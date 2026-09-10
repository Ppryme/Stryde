// src/lib/streakUtils.js
// ─────────────────────────────────────────────
// STREAK UTILS — Pure helper functions for Option A (Overall Perfect-Day Streak)
//
// Rules of Option A:
//   • There is one overall streak per user.
//   • The streak only increases when the user has completed ALL active daily habits on that day.
//   • Checking in only some habits must not increase the streak.
//   • A missed calendar day penalizes the streak.
//
// Exports:
//   computeStreakFromDates(sortedDates)                — pure, synchronous
//   computeLongestStreakFromDates(sortedDates)         — pure, synchronous
//   computeOverallStreakFromCheckIns(checkIns, habits) — pure, synchronous, server-safe
//   computeMissedDayPenalty(lastDate, today, streak)   — pure, synchronous
//   areAllDailyHabitsCompleted(habits, checkInsOrMap)  — pure, synchronous
// ─────────────────────────────────────────────
import { getLocalDateString } from "./date";

/**
 * Pure helper to compute current streak from a descending-sorted list of completion dates.
 * Most recent date must be today or yesterday; otherwise streak is 0.
 *
 * @param {string[]} sortedDates YYYY-MM-DD sorted DESCENDING (newest first)
 * @returns {number} Current streak count
 */
export function computeStreakFromDates(sortedDates) {
  if (!sortedDates || sortedDates.length === 0) return 0;

  const today     = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86_400_000));

  // Most recent complete date must be today or yesterday — otherwise streak is broken.
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const dayDiff = Math.round(
      (new Date(sortedDates[i - 1]) - new Date(sortedDates[i])) / 86_400_000
    );
    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Pure helper — finds the longest-ever consecutive run in a date list.
 *
 * @param {string[]} sortedDates YYYY-MM-DD sorted DESCENDING (newest first)
 * @returns {number} Longest consecutive run
 */
function computeLongestStreakFromDates(sortedDates) {
  if (!sortedDates || sortedDates.length === 0) return 0;

  let longest = 1;
  let run = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const dayDiff = Math.round(
      (new Date(sortedDates[i - 1]) - new Date(sortedDates[i])) / 86_400_000
    );
    if (dayDiff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  return longest;
}

/**
 * Pure helper used to calculate overall streak across all check-in history.
 * Safe to call from server components (e.g. Analytics page) and client components.
 * A date counts only when ALL active daily habits were completed on that date.
 *
 * @param {Array<{ habit_id?: string, habitId?: string, date: string, completed: boolean }>} checkIns
 * @param {Array<{ id: string }>} habits Active daily habits for this user
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
export function computeOverallStreakFromCheckIns(checkIns, habits) {
  if (!habits || habits.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Support both camelCase (IndexedDB) and snake_case (Supabase) field names.
  const habitIds = new Set(habits.map((h) => h.id));
  const total = habitIds.size;

  // Group completed check-ins by date — only count active daily habits.
  const dateMap = {};
  for (const c of checkIns) {
    if (!c.completed) continue;
    const id = c.habit_id ?? c.habitId; // snake_case from Supabase, camelCase from IndexedDB
    if (!habitIds.has(id)) continue;
    if (!dateMap[c.date]) dateMap[c.date] = new Set();
    dateMap[c.date].add(id);
  }

  // A date counts only when ALL active daily habits are checked off.
  const completedDates = Object.keys(dateMap)
    .filter((d) => dateMap[d].size === total)
    .sort((a, b) => new Date(b) - new Date(a)); // descending

  if (completedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const currentStreak = computeStreakFromDates(completedDates);
  const longestStreak = computeLongestStreakFromDates(completedDates);

  return { currentStreak, longestStreak };
}

/**
 * Pure helper — computes updated streak count based on missed calendar days.
 *
 * Rules:
 *   • If lastCompletedDate is null → no change
 *   • Gap of 0 (today) or 1 (yesterday) → no change
 *   • Gap >= 2 → missed (gap - 1) days, subtract from currentStreak (floor 0)
 *
 * @param {string | null} lastCompletedDate YYYY-MM-DD or null
 * @param {string} today YYYY-MM-DD
 * @param {number} currentStreak
 * @returns {number} Updated streak count
 */
export function computeMissedDayPenalty(lastCompletedDate, today, currentStreak) {
  if (!lastCompletedDate || currentStreak <= 0) return Math.max(0, currentStreak || 0);

  const d1 = new Date(`${lastCompletedDate}T00:00:00`);
  const d2 = new Date(`${today}T00:00:00`);
  const gap = Math.round((d2 - d1) / 86_400_000);

  if (gap <= 1) {
    return currentStreak;
  }

  const missedDays = gap - 1;
  return Math.max(0, currentStreak - missedDays);
}

/**
 * Pure helper to verify if ALL active daily habits have been completed today.
 *
 * @param {Array<{ id: string, frequency?: string, archived?: boolean }>} habits
 *   The list of habits (will be filtered for active daily habits).
 * @param {Array<{ habitId?: string, habit_id?: string, completed?: boolean }> | Record<string, boolean>} checkInsOrMap
 *   Check-ins for today: either an array of check-in rows or a dictionary map { [habitId]: boolean }.
 * @returns {boolean} True if there is at least one active daily habit and all are completed.
 */
export function areAllDailyHabitsCompleted(habits, checkInsOrMap) {
  if (!habits || habits.length === 0 || !checkInsOrMap) return false;

  const activeDailyHabits = habits.filter(
    (h) => (h.frequency === undefined || h.frequency === "daily") && !h.archived
  );

  if (activeDailyHabits.length === 0) return false;

  if (Array.isArray(checkInsOrMap)) {
    const completedSet = new Set(
      checkInsOrMap
        .filter((c) => Boolean(c.completed))
        .map((c) => c.habitId ?? c.habit_id)
    );
    return activeDailyHabits.every((h) => completedSet.has(h.id));
  }

  if (typeof checkInsOrMap === "object") {
    return activeDailyHabits.every((h) => Boolean(checkInsOrMap[h.id]));
  }

  return false;
}


