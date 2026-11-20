// src/data/local/habitLocalData.js
// ─────────────────────────────────────────────
// All habit-related Dexie (IndexedDB) operations.
// No Supabase, no queue logic, no React state.
// ─────────────────────────────────────────────
import { db } from "@/lib/db";

/**
 * Saves a habit record to IndexedDB.
 *
 * The caller is responsible for providing the `id` field when a stable
 * client-generated UUID is required (normal UI creation flow).
 *
 * Dexie's `add()` with `++id` will auto-generate an integer key ONLY
 * if no `id` property is present on the object. When a string UUID is
 * supplied, Dexie uses it as the primary key verbatim.
 *
 * @param {Object} habitRecord - Full habit object to store.
 * @returns {Promise<string|number>} The key of the stored record.
 */
export async function saveLocalHabit(habitRecord) {
  return db.habits.add(habitRecord);
}

/**
 * Retrieves a single habit by its primary key.
 *
 * @param {string|number} habitId
 * @returns {Promise<Object|undefined>}
 */
export async function getLocalHabitById(habitId) {
  return db.habits.get(habitId);
}

/**
 * Retrieves all habits for a given user.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getLocalHabitsByUserId(userId) {
  if (!userId) return [];
  return db.habits
    .where("userId")
    .equals(userId)
    .toArray();
}

/**
 * Retrieves active daily habits for a user.
 * Used by streak calculations (userStreakRepository).
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getActiveDailyHabits(userId) {
  if (!userId) return [];
  return db.habits
    .where("userId")
    .equals(userId)
    .and((h) => h.frequency === "daily" && !h.archived)
    .toArray();
}

/**
 * Updates a habit record with partial fields.
 *
 * @param {string|number} habitId - Primary key of the habit.
 * @param {Object} updates - Partial fields to merge.
 * @returns {Promise<number>} 1 if updated, 0 if the key was not found.
 */
export async function updateLocalHabit(habitId, updates) {
  return db.habits.update(habitId, updates);
}

/**
 * Archives a habit by setting `archived: true`.
 *
 * @param {string|number} habitId
 * @returns {Promise<number>}
 */
export async function archiveLocalHabit(habitId) {
  return db.habits.update(habitId, { archived: true });
}

/**
 * Unarchives a habit by setting `archived: false`.
 *
 * @param {string|number} habitId
 * @returns {Promise<number>}
 */
export async function unarchiveLocalHabit(habitId) {
  return db.habits.update(habitId, { archived: false });
}

/**
 * Clears all local habit records.
 * Called during sign-out to ensure user isolation.
 *
 * @returns {Promise<void>}
 */
export async function clearLocalHabits() {
  return db.habits.clear();
}
