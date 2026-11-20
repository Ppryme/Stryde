// src/data/local/goalLocalData.js
// ─────────────────────────────────────────────
// All goal-related Dexie (IndexedDB) operations.
// No Supabase, no queue logic, no React state.
// ─────────────────────────────────────────────
import { db } from "@/lib/db";

/**
 * Saves a goal record to IndexedDB.
 *
 * @param {Object} goalRecord - Goal object to store.
 * @returns {Promise<string|number>} The key of the stored record.
 */
export async function saveLocalGoal(goalRecord) {
  return db.goals.add(goalRecord);
}

/**
 * Retrieves a single goal by its primary key.
 *
 * @param {string|number} id
 * @returns {Promise<Object|undefined>}
 */
export async function getLocalGoalById(id) {
  return db.goals.get(id);
}

/**
 * Retrieves all goals for a given user, optionally filtered by status.
 *
 * @param {string} userId
 * @param {string} [status] - e.g. "active", "completed", "archived"
 * @returns {Promise<Array>}
 */
export async function getLocalGoalsByUserId(userId, status) {
  if (!userId) return [];
  let query = db.goals.where("userId").equals(userId);
  if (status) {
    query = query.and((g) => g.status === status);
  }
  return query.toArray();
}

/**
 * Updates a goal record with partial fields in IndexedDB.
 *
 * @param {string|number} id - Primary key of the goal.
 * @param {Object} updates - Partial fields to merge.
 * @returns {Promise<number>} 1 if updated, 0 if the key was not found.
 */
export async function updateLocalGoal(id, updates) {
  return db.goals.update(id, updates);
}

/**
 * Deletes a goal record from IndexedDB.
 *
 * @param {string|number} id - Primary key of the goal.
 * @returns {Promise<void>}
 */
export async function deleteLocalGoal(id) {
  return db.goals.delete(id);
}

/**
 * Clears all local goal records.
 * Called during sign-out to ensure user isolation.
 *
 * @returns {Promise<void>}
 */
export async function clearLocalGoals() {
  return db.goals.clear();
}
