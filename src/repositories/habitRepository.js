// src/repositories/habitRepository.js
// ─────────────────────────────────────────────
// Coordinates local writes, remote persistence and
// offline queue management for habits.
//
// PUBLIC API (preserved):
//   createHabit(habitData)   → returns habitData
//   updateHabit(habitId, u)  → returns undefined
//   archiveHabit(habitId)    → returns undefined
//   unarchiveHabit(habitId)  → returns undefined
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import {
  saveLocalHabit,
  updateLocalHabit,
  archiveLocalHabit,
  unarchiveLocalHabit,
} from "@/data/local/habitLocalData";
import {
  insertHabitRemote,
  updateHabitRemote,
  archiveHabitRemote,
  unarchiveHabitRemote,
} from "@/data/remote/habitRemoteData";
import { toRemoteHabit, toRemoteUpdates } from "@/data/mappers/habitMapper";
import {
  enqueueOperation,
  getPendingOperations,
  QUEUE_STATUS,
} from "@/data/sync/syncQueue";

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Checks whether there is an earlier pending queue operation
 * for the given habit that has not yet been synchronised.
 *
 * When an earlier operation exists (e.g. a CREATE that has not
 * reached Supabase), we must NOT bypass the queue with a direct
 * remote write because the dependency chain would break.
 */
async function hasEarlierPendingOperation(habitId) {
  if (!habitId) return false;
  const pending = await getPendingOperations();
  return pending.some(
    (item) =>
      item.status === QUEUE_STATUS.PENDING &&
      (item.entityId === habitId ||
        item.payload?.id === habitId ||
        item.payload?.habitId === habitId)
  );
}

// ── Repository ───────────────────────────────────────────────────────────

export const HabitRepository = {
  /**
   * Creates a new habit locally and syncs to Supabase.
   * If offline or if remote persistence fails, queues the creation.
   *
   * @param {Object} habitData
   * @returns {Object} The original habitData object (preserving existing contract).
   */
  async createHabit(habitData) {
    // 1. Save to IndexedDB immediately (works offline)
    await saveLocalHabit(habitData);

    // 2. Sync to Supabase if online
    if (navigator.onLine) {
      try {
        const supabase = getSupabase();
        const remoteRecord = toRemoteHabit(habitData);
        await insertHabitRemote(supabase, remoteRecord);
      } catch (err) {
        // Remote failed — queue for later retry
        console.warn("[HabitRepository] Remote data creation failed, queuing:", err.message);
        await enqueueOperation({
          type: "CREATE_HABIT",
          payload: habitData,
          entityId: habitData.id,
          createdAt: habitData.createdAt,
        });
      }
    } else {
      // Offline — queue for later sync
      await enqueueOperation({
        type: "CREATE_HABIT",
        payload: habitData,
        entityId: habitData.id,
        createdAt: habitData.createdAt,
      });
    }

    return habitData;
  },

  /**
   * Updates an existing habit locally and syncs to Supabase.
   *
   * @param {string} habitId
   * @param {Object} updates { name, frequency, reminderTime }
   * @returns {undefined}
   */
  async updateHabit(habitId, updates) {
    // 1. Update IndexedDB
    await updateLocalHabit(habitId, updates);

    // 2. Sync online or queue
    if (navigator.onLine && !(await hasEarlierPendingOperation(habitId))) {
      try {
        const supabase = getSupabase();
        const remoteUpdates = toRemoteUpdates(updates);
        await updateHabitRemote(supabase, habitId, remoteUpdates);
      } catch (err) {
        console.warn("[HabitRepository] Remote update failed, queuing:", err.message);
        await enqueueOperation({
          type: "UPDATE_HABIT",
          payload: {
            habitId,
            name: updates.name,
            frequency: updates.frequency,
            reminderTime: updates.reminderTime,
          },
          entityId: habitId,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      await enqueueOperation({
        type: "UPDATE_HABIT",
        payload: {
          habitId,
          name: updates.name,
          frequency: updates.frequency,
          reminderTime: updates.reminderTime,
        },
        entityId: habitId,
        createdAt: new Date().toISOString(),
      });
    }
  },

  /**
   * Archives a habit locally and syncs to Supabase.
   *
   * @param {string} habitId
   * @returns {undefined}
   */
  async archiveHabit(habitId) {
    await archiveLocalHabit(habitId);

    if (navigator.onLine && !(await hasEarlierPendingOperation(habitId))) {
      try {
        const supabase = getSupabase();
        await archiveHabitRemote(supabase, habitId);
      } catch (err) {
        console.warn("[HabitRepository] Remote archive failed, queuing:", err.message);
        await enqueueOperation({
          type: "ARCHIVE_HABIT",
          payload: { habitId },
          entityId: habitId,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      await enqueueOperation({
        type: "ARCHIVE_HABIT",
        payload: { habitId },
        entityId: habitId,
        createdAt: new Date().toISOString(),
      });
    }
  },

  /**
   * Unarchives a habit locally and syncs to Supabase.
   *
   * @param {string} habitId
   * @returns {undefined}
   */
  async unarchiveHabit(habitId) {
    await unarchiveLocalHabit(habitId);

    if (navigator.onLine && !(await hasEarlierPendingOperation(habitId))) {
      try {
        const supabase = getSupabase();
        await unarchiveHabitRemote(supabase, habitId);
      } catch (err) {
        console.warn("[HabitRepository] Remote unarchive failed, queuing:", err.message);
        await enqueueOperation({
          type: "UNARCHIVE_HABIT",
          payload: { habitId },
          entityId: habitId,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      await enqueueOperation({
        type: "UNARCHIVE_HABIT",
        payload: { habitId },
        entityId: habitId,
        createdAt: new Date().toISOString(),
      });
    }
  },
};
