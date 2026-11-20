// lib/sync.js
// ─────────────────────────────────────────────
// Shared offline queue processor.
// Handles habits, goals, check-ins and user streaks.
//
// Improvements over the original implementation:
//   A. Preserves stable habit IDs on CREATE_HABIT replay.
//   B. Checks every Supabase { error } before deleting a queue item.
//   C. Handles UNARCHIVE_HABIT.
//   D. Concurrency guard prevents overlapping executions.
//   E. Bounded retries with exponential backoff.
//   F. Per-habit FIFO ordering (blocked items block later items for the same entity).
//   G. Preserves all existing non-habit handlers and payload formats.
// ─────────────────────────────────────────────
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import {
  getPendingOperations,
  removeOperation,
  recordAttemptFailure,
  markOperationFailed,
  isReadyForRetry,
  deriveEntityId,
  QUEUE_STATUS,
} from "@/data/sync/syncQueue";
import { toRemoteHabit, toRemoteUpdates } from "@/data/mappers/habitMapper";
import { toRemoteGoal, toRemoteGoalUpdates } from "@/data/mappers/goalMapper";

// ── Concurrency guard ────────────────────────────────────────────────────

let _syncInFlight = null;

/**
 * Processes the shared offline queue.
 * If a sync is already running, the caller awaits the same promise
 * rather than starting a duplicate execution.
 *
 * @returns {Promise<void>}
 */
export async function syncQueue() {
  if (_syncInFlight) {
    return _syncInFlight;
  }

  _syncInFlight = _doSync();
  try {
    await _syncInFlight;
  } finally {
    _syncInFlight = null;
  }
}

// ── Error classification ─────────────────────────────────────────────────

/**
 * Determines whether a Supabase or network error is retryable.
 *
 * Retryable: network failures, timeouts, 408, 429, 5xx.
 * Permanent: validation errors, schema errors, constraint violations (non-unique),
 *            RLS/permission denials, and other 4xx errors.
 *
 * Unknown errors are treated conservatively as retryable so the queue
 * item is retained rather than silently dropped.
 */
function isRetryableError(err) {
  if (!err) return false;

  // Network-level failures (fetch TypeError, AbortError, etc.)
  if (err instanceof TypeError && /fetch|network|aborted/i.test(err.message)) {
    return true;
  }
  if (err.name === "AbortError") return true;

  const status = err.status ?? null;
  const code = err.code ?? null;

  // HTTP status-based classification
  if (status) {
    if (status === 408 || status === 429) return true;
    if (status >= 500) return true;

    // 409 Conflict for duplicate key — treat as *success* (the row already exists).
    // This is handled by the caller, not here.

    // Other 4xx — generally permanent
    if (status >= 400 && status < 500) return false;
  }

  // Postgres error codes (Supabase propagates these)
  if (code) {
    // 23505 = unique_violation → handled as duplicate by caller, not retried
    if (code === "23505") return false;
    // 42xxx = syntax/schema errors → permanent
    if (code.startsWith("42")) return false;
    // 23xxx = integrity constraint violations → permanent
    if (code.startsWith("23")) return false;
    // 28xxx = authorization/RLS → permanent (if truly an RLS policy denial)
    if (code.startsWith("28")) return false;
    // PGRST (PostgREST) codes
    if (code === "PGRST301" || code === "PGRST302") return false; // schema/relation errors
  }

  // Connection / timeout strings
  if (err.message && /timeout|econnreset|econnrefused|socket hang up/i.test(err.message)) {
    return true;
  }

  // Unknown — treat as retryable (conservative)
  return true;
}

/**
 * Checks whether a Supabase error is a duplicate-key conflict (409 / 23505).
 * When a CREATE was already applied but its queue deletion was lost,
 * the replay will produce this error. We treat it as success.
 */
function isDuplicateConflict(err) {
  if (!err) return false;
  if (err.code === "23505") return true;
  if (err.status === 409) return true;
  return false;
}

// ── Supabase result checking ─────────────────────────────────────────────

/**
 * Throws a structured error if the Supabase result contains an error.
 * This prevents the queue item from being deleted after a failed request.
 */
function assertSuccess(result, context) {
  if (result.error) {
    const err = new Error(result.error.message || `Supabase error in ${context}`);
    err.code = result.error.code || null;
    err.status = result.status ?? result.error.status ?? null;
    err.details = result.error.details || null;
    err.hint = result.error.hint || null;
    throw err;
  }
}

// ── Core sync logic ──────────────────────────────────────────────────────

async function _doSync() {
  const pending = await getPendingOperations();
  if (pending.length === 0) return;

  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) {
    // No authenticated user; do not replay queue
    return;
  }

  // Track entity IDs that are blocked (earlier operation pending/failed).
  // Later operations for the same entity must wait.
  const blockedEntities = new Set();

  for (const item of pending) {
    // ── User isolation ─────────────────────────────────────────────────
    const itemUserId = item.payload?.userId || item.payload?.user_id;
    if (itemUserId && itemUserId !== currentUserId) {
      await removeOperation(item.id);
      continue;
    }

    // ── Skip permanently failed items ──────────────────────────────────
    if (item.status === QUEUE_STATUS.FAILED) {
      const entityId = item.entityId || deriveEntityId(item);
      if (entityId) blockedEntities.add(entityId);
      continue;
    }

    // ── Skip items not ready for retry (backoff) ───────────────────────
    if (!isReadyForRetry(item)) {
      const entityId = item.entityId || deriveEntityId(item);
      if (entityId) blockedEntities.add(entityId);
      continue;
    }

    // ── Per-entity ordering: skip if an earlier op for this entity is blocked
    const entityId = item.entityId || deriveEntityId(item);
    if (entityId && blockedEntities.has(entityId)) {
      continue;
    }

    try {
      await _processItem(supabase, item, currentUserId);
      await removeOperation(item.id);
    } catch (err) {
      console.error("[sync] Failed for item", item.id, item.type, err.message || err);

      // Duplicate conflict on CREATE → treat as success
      if (item.type.startsWith("CREATE_") && isDuplicateConflict(err)) {
        console.info("[sync] Duplicate detected for", item.type, "— treating as success");
        await removeOperation(item.id);
        continue;
      }

      if (isRetryableError(err)) {
        await recordAttemptFailure(item.id, err);
      } else {
        // Permanent failure — mark as failed, retain for inspection
        await markOperationFailed(item.id, err);
      }

      // Block later operations for this entity
      if (entityId) blockedEntities.add(entityId);
    }
  }
}

/**
 * Dispatches a single queue item to the appropriate Supabase operation.
 * Throws on any Supabase error so the caller can classify and handle it.
 */
async function _processItem(supabase, item, currentUserId) {
  switch (item.type) {
    // ── HABITS ─────────────────────────────────────────────────────────
    case "CREATE_HABIT": {
      // Build remote record preserving the original client-generated ID
      const remoteHabit = toRemoteHabit(item.payload);
      // Ensure the user_id matches the currently authenticated user
      remoteHabit.user_id = currentUserId;
      // Preserve the original ID from the payload
      if (item.payload.id) {
        remoteHabit.id = item.payload.id;
      }

      const result = await supabase.from("habits").insert(remoteHabit);
      assertSuccess(result, "CREATE_HABIT");
      break;
    }

    case "UPDATE_HABIT": {
      const updates = toRemoteUpdates(item.payload);
      // Remove habitId from the update payload (it's a filter, not a column)
      delete updates.habitId;

      const result = await supabase
        .from("habits")
        .update(updates)
        .eq("id", item.payload.habitId)
        .eq("user_id", currentUserId);
      assertSuccess(result, "UPDATE_HABIT");
      break;
    }

    case "ARCHIVE_HABIT": {
      const result = await supabase
        .from("habits")
        .update({ archived: true })
        .eq("id", item.payload.habitId)
        .eq("user_id", currentUserId);
      assertSuccess(result, "ARCHIVE_HABIT");
      break;
    }

    case "UNARCHIVE_HABIT": {
      const result = await supabase
        .from("habits")
        .update({ archived: false })
        .eq("id", item.payload.habitId)
        .eq("user_id", currentUserId);
      assertSuccess(result, "UNARCHIVE_HABIT");
      break;
    }

    // ── CHECK-INS ──────────────────────────────────────────────────────
    case "UPSERT_CHECKIN": {
      const result = await supabase.from("check_ins").upsert(
        {
          habit_id: item.payload.habitId,
          user_id: currentUserId,
          date: item.payload.date,
          completed: item.payload.completed,
        },
        { onConflict: "habit_id,date" }
      );
      assertSuccess(result, "UPSERT_CHECKIN");
      break;
    }

    // ── GOALS ──────────────────────────────────────────────────────────
    case "CREATE_GOAL": {
      const remoteGoal = toRemoteGoal(item.payload);
      remoteGoal.user_id = currentUserId;
      const result = await supabase.from("goals").insert(remoteGoal);
      assertSuccess(result, "CREATE_GOAL");
      break;
    }

    case "UPDATE_GOAL": {
      const updates = toRemoteGoalUpdates(item.payload.updates);
      const result = await supabase
        .from("goals")
        .update(updates)
        .eq("id", item.payload.id)
        .eq("user_id", currentUserId);
      assertSuccess(result, "UPDATE_GOAL");
      break;
    }

    case "DELETE_GOAL": {
      const result = await supabase
        .from("goals")
        .delete()
        .eq("id", item.payload.id)
        .eq("user_id", currentUserId);
      assertSuccess(result, "DELETE_GOAL");
      break;
    }

    // ── STREAKS ────────────────────────────────────────────────────────
    case "UPSERT_STREAK": {
      const result = await supabase.from("streaks").upsert(
        {
          habit_id: item.payload.habitId,
          user_id: currentUserId,
          current_streak: item.payload.currentStreak,
          longest_streak: item.payload.longestStreak,
          last_checked_in: item.payload.lastCheckedIn,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "habit_id" }
      );
      assertSuccess(result, "UPSERT_STREAK");
      break;
    }

    case "UPSERT_USER_STREAK": {
      const result = await supabase.from("user_streaks").upsert(
        {
          user_id: currentUserId,
          current_streak: item.payload.currentStreak,
          longest_streak: item.payload.longestStreak,
          last_completed_date: item.payload.lastCompletedDate,
          updated_at: item.payload.updatedAt || new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      assertSuccess(result, "UPSERT_USER_STREAK");
      break;
    }

    default:
      console.warn("[sync] Unknown queue item type:", item.type);
      // Do not remove — retain for inspection
      throw new Error(`Unknown queue operation type: ${item.type}`);
  }
}

// ── Sync listener (preserved, but unused in the codebase) ────────────────

export function initSyncListener() {
  window.addEventListener("online", syncQueue);
}
