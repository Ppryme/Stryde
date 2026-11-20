// src/data/sync/syncQueue.js
// ─────────────────────────────────────────────
// Shared Dexie queue wrapper.
// Wraps the existing `db.queue` table used by habits,
// goals, check-ins and user streak aggregations.
//
// IMPORTANT: The queue table schema is:
//   queue: "++id, type, createdAt"
//
// Additional metadata (attempts, status, etc.) is stored
// as non-indexed object properties and does NOT require
// a Dexie schema change.
// ─────────────────────────────────────────────
import { db } from "@/lib/db";

// ── Constants ────────────────────────────────────────────────────────────

export const QUEUE_STATUS = {
  PENDING: "pending",
  FAILED: "failed",
};

const DEFAULT_MAX_ATTEMPTS = 8;
const BASE_BACKOFF_MS = 2000;    // 2 seconds
const MAX_BACKOFF_MS = 300_000;  // 5 minutes

// ── Enqueue ──────────────────────────────────────────────────────────────

/**
 * Adds an operation to the shared sync queue.
 *
 * Before enqueuing, checks for a duplicate pending CREATE operation
 * for the same entity to avoid double-creates. Other operation types
 * are always enqueued to preserve chronological ordering.
 *
 * @param {Object} params
 * @param {string} params.type       - Operation type (e.g. "CREATE_HABIT").
 * @param {Object} params.payload    - Operation payload.
 * @param {string} [params.entityId] - Stable ID of the entity (habit ID, goal ID, etc.).
 * @param {string} [params.createdAt] - ISO timestamp (defaults to now).
 * @returns {Promise<number>} The queue record ID.
 */
export async function enqueueOperation({ type, payload, entityId, createdAt }) {
  // Duplicate prevention: skip if an identical CREATE is already pending.
  if (type.startsWith("CREATE_") && entityId) {
    const existing = await db.queue
      .where("type")
      .equals(type)
      .filter((item) => {
        // Legacy records may lack entityId metadata; check payload too
        const itemEntityId = item.entityId || deriveEntityId(item);
        const itemStatus = item.status || QUEUE_STATUS.PENDING;
        return itemEntityId === entityId && itemStatus === QUEUE_STATUS.PENDING;
      })
      .first();

    if (existing) {
      return existing.id;
    }
  }

  return db.queue.add({
    type,
    payload,
    createdAt: createdAt || new Date().toISOString(),
    // Retry metadata (non-indexed, no schema change required)
    entityId: entityId || null,
    attempts: 0,
    status: QUEUE_STATUS.PENDING,
    nextRetryAt: null,
    lastAttemptAt: null,
    lastError: null,
  });
}

// ── Read ─────────────────────────────────────────────────────────────────

/**
 * Retrieves all queue records in insertion order.
 * Legacy records without metadata are treated as pending.
 *
 * @returns {Promise<Array>}
 */
export async function getPendingOperations() {
  const all = await db.queue.toArray();
  return all.map(normalizeQueueRecord);
}

/**
 * Returns whether the queue contains any records.
 *
 * @returns {Promise<boolean>}
 */
export async function hasPendingOperations() {
  const count = await db.queue.count();
  return count > 0;
}

// ── Update metadata ──────────────────────────────────────────────────────

/**
 * Records a failed attempt on a queue item.
 * Increments the attempt counter, stores the error, and computes the
 * next retry timestamp with exponential backoff.
 *
 * @param {number} queueId     - The queue record's auto-increment ID.
 * @param {Object} error       - The error object from the failed attempt.
 * @param {number} [maxAttempts] - Override the default max attempts.
 * @returns {Promise<void>}
 */
export async function recordAttemptFailure(queueId, error, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
  const item = await db.queue.get(queueId);
  if (!item) return;

  const normalized = normalizeQueueRecord(item);
  const newAttempts = normalized.attempts + 1;
  const isPermanent = newAttempts >= maxAttempts;

  const backoffMs = Math.min(
    BASE_BACKOFF_MS * Math.pow(2, newAttempts - 1),
    MAX_BACKOFF_MS
  );

  await db.queue.update(queueId, {
    attempts: newAttempts,
    status: isPermanent ? QUEUE_STATUS.FAILED : QUEUE_STATUS.PENDING,
    lastAttemptAt: new Date().toISOString(),
    lastError: serializeError(error),
    nextRetryAt: isPermanent ? null : new Date(Date.now() + backoffMs).toISOString(),
  });
}

/**
 * Marks a queue item as permanently failed so it is retained
 * for inspection but no longer retried automatically.
 *
 * @param {number} queueId
 * @param {Object} error
 * @returns {Promise<void>}
 */
export async function markOperationFailed(queueId, error) {
  await db.queue.update(queueId, {
    status: QUEUE_STATUS.FAILED,
    lastAttemptAt: new Date().toISOString(),
    lastError: serializeError(error),
    nextRetryAt: null,
  });
}

// ── Remove ───────────────────────────────────────────────────────────────

/**
 * Removes a queue item after confirmed remote success.
 *
 * @param {number} queueId
 * @returns {Promise<void>}
 */
export async function removeOperation(queueId) {
  await db.queue.delete(queueId);
}

/**
 * Clears the entire queue.
 * Used during sign-out to ensure user isolation.
 *
 * NOTE: This discards any unsynchronised operations. If a user signs
 * out before the queue drains, those changes will not reach Supabase.
 *
 * @returns {Promise<void>}
 */
export async function clearQueue() {
  return db.queue.clear();
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Normalizes a queue record so legacy items (without metadata)
 * are treated as pending with zero attempts.
 */
function normalizeQueueRecord(item) {
  return {
    ...item,
    attempts: item.attempts ?? 0,
    status: item.status || QUEUE_STATUS.PENDING,
    nextRetryAt: item.nextRetryAt || null,
    lastAttemptAt: item.lastAttemptAt || null,
    lastError: item.lastError || null,
    entityId: item.entityId || deriveEntityId(item),
  };
}

/**
 * Derives the entity ID from a queue item's payload based on its type.
 * This handles legacy records that do not have an explicit `entityId`.
 */
function deriveEntityId(item) {
  if (!item || !item.payload) return null;

  switch (item.type) {
    case "CREATE_HABIT":
      return item.payload.id || null;
    case "UPDATE_HABIT":
    case "ARCHIVE_HABIT":
    case "UNARCHIVE_HABIT":
      return item.payload.habitId || null;
    case "UPSERT_CHECKIN":
      return item.payload.habitId || null;
    case "CREATE_GOAL":
    case "UPDATE_GOAL":
    case "DELETE_GOAL":
      return item.payload.id || null;
    case "UPSERT_STREAK":
      return item.payload.habitId || null;
    case "UPSERT_USER_STREAK":
      return item.payload.userId || null;
    default:
      return null;
  }
}

/**
 * Serializes an error for storage in IndexedDB.
 * IndexedDB cannot store Error instances directly.
 */
function serializeError(err) {
  if (!err) return null;
  if (typeof err === "string") return err;
  return {
    message: err.message || String(err),
    code: err.code || null,
    status: err.status || null,
    details: err.details || null,
    name: err.name || null,
  };
}

/**
 * Checks whether a queue item is ready for a retry attempt.
 *
 * @param {Object} item - A normalized queue record.
 * @returns {boolean}
 */
export function isReadyForRetry(item) {
  const normalized = normalizeQueueRecord(item);
  if (normalized.status === QUEUE_STATUS.FAILED) return false;
  if (!normalized.nextRetryAt) return true;
  return new Date().toISOString() >= normalized.nextRetryAt;
}

/**
 * Exposes deriveEntityId for use by the sync processor.
 */
export { deriveEntityId };
