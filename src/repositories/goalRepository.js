// src/repositories/goalRepository.js
// ─────────────────────────────────────────────
// Coordinates local writes, remote persistence, and
// offline queue management for goals.
//
// PUBLIC API (preserved):
//   createGoal(goalData)          → returns localId
//   updateGoal(id, updates, uId)  → returns true
//   deleteGoal(id, uId)           → returns true
//   getGoals(userId, status)      → returns Promise<Array>
// ─────────────────────────────────────────────
import { getSupabase } from "@/lib/supabase";
import {
  saveLocalGoal,
  updateLocalGoal,
  deleteLocalGoal,
  getLocalGoalsByUserId,
} from "@/data/local/goalLocalData";
import {
  insertGoalRemote,
  updateGoalRemote,
  deleteGoalRemote,
} from "@/data/remote/goalRemoteData";
import { toRemoteGoal, toRemoteGoalUpdates } from "@/data/mappers/goalMapper";
import {
  enqueueOperation,
  getPendingOperations,
  QUEUE_STATUS,
} from "@/data/sync/syncQueue";

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Checks whether an earlier operation for this goal is pending in the queue.
 * Ensures strict FIFO ordering so an update/delete never jumps ahead of a create.
 */
async function hasEarlierPendingGoalOperation(goalId) {
  if (!goalId) return false;
  const strId = String(goalId);
  const pending = await getPendingOperations();
  return pending.some(
    (item) =>
      item.status === QUEUE_STATUS.PENDING &&
      (item.entityId === goalId ||
        item.entityId === strId ||
        item.payload?.id === goalId ||
        String(item.payload?.id) === strId)
  );
}

// ── Repository ───────────────────────────────────────────────────────────

export const GoalRepository = {
  /**
   * Creates a goal locally and syncs to Supabase or queues offline.
   *
   * @param {Object} goalData
   * @returns {Promise<string|number>} The local goal ID.
   */
  async createGoal(goalData) {
    const userId = goalData.user_id || goalData.userId;
    const now = new Date().toISOString();
    const localRecord = {
      ...goalData,
      userId,
      status: goalData.status || "active",
      createdAt: goalData.createdAt || goalData.created_at || now,
      updated_at: goalData.updated_at || goalData.updatedAt || now,
    };

    // 1. Save to IndexedDB goals store immediately (offline-safe)
    const localId = await saveLocalGoal(localRecord);
    const persistedRecord = { ...localRecord, id: localId };

    // 2. Sync to Supabase if online, otherwise queue
    if (navigator.onLine) {
      try {
        const supabase = getSupabase();
        const remoteRecord = toRemoteGoal(persistedRecord);
        await insertGoalRemote(supabase, remoteRecord);
      } catch (err) {
        console.warn("[GoalRepository] Remote create failed, queueing:", err.message || err);
        await enqueueOperation({
          type: "CREATE_GOAL",
          payload: persistedRecord,
          entityId: String(localId),
          createdAt: now,
        });
      }
    } else {
      await enqueueOperation({
        type: "CREATE_GOAL",
        payload: persistedRecord,
        entityId: String(localId),
        createdAt: now,
      });
    }

    return localId;
  },

  /**
   * Updates an existing goal locally and syncs to Supabase.
   *
   * @param {string|number} id
   * @param {Object} updates
   * @param {string} [userId]
   * @returns {Promise<boolean>}
   */
  async updateGoal(id, updates, userId) {
    const updatedAt = new Date().toISOString();
    const localUpdates = { ...updates, updated_at: updatedAt };

    // 1. Update local Dexie DB immediately
    await updateLocalGoal(id, localUpdates);

    // 2. Sync to Supabase if online & no earlier pending operations exist
    if (navigator.onLine && !(await hasEarlierPendingGoalOperation(id))) {
      try {
        const supabase = getSupabase();
        const remoteUpdates = toRemoteGoalUpdates(localUpdates);
        await updateGoalRemote(supabase, id, remoteUpdates, userId);
      } catch (err) {
        console.warn("[GoalRepository] Remote update failed, queueing:", err.message || err);
        await enqueueOperation({
          type: "UPDATE_GOAL",
          payload: { id, updates, userId },
          entityId: String(id),
          createdAt: updatedAt,
        });
      }
    } else {
      await enqueueOperation({
        type: "UPDATE_GOAL",
        payload: { id, updates, userId },
        entityId: String(id),
        createdAt: updatedAt,
      });
    }

    return true;
  },

  /**
   * Deletes a goal locally and syncs to Supabase.
   *
   * @param {string|number} id
   * @param {string} [userId]
   * @returns {Promise<boolean>}
   */
  async deleteGoal(id, userId) {
    const now = new Date().toISOString();

    // 1. Delete from local Dexie DB
    await deleteLocalGoal(id);

    // 2. Sync to Supabase or queue
    if (navigator.onLine && !(await hasEarlierPendingGoalOperation(id))) {
      try {
        const supabase = getSupabase();
        await deleteGoalRemote(supabase, id, userId);
      } catch (err) {
        console.warn("[GoalRepository] Remote delete failed, queueing:", err.message || err);
        await enqueueOperation({
          type: "DELETE_GOAL",
          payload: { id, userId },
          entityId: String(id),
          createdAt: now,
        });
      }
    } else {
      await enqueueOperation({
        type: "DELETE_GOAL",
        payload: { id, userId },
        entityId: String(id),
        createdAt: now,
      });
    }

    return true;
  },

  /**
   * Queries goals for a specific user from local IndexedDB.
   *
   * @param {string} userId
   * @param {string} [status]
   * @returns {Promise<Array>}
   */
  async getGoals(userId, status) {
    return getLocalGoalsByUserId(userId, status);
  },
};

export default GoalRepository;
