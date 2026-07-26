// src/lib/streakUtils.js
// ─────────────────────────────────────────────
// STREAK UTILS — SINGLE SOURCE OF TRUTH for streak calculation.
//
// Rules:
//   • If the user checks in today → streak = previous consecutive streak + 1
//   • If the user skipped a calendar day → streak resets to 0
//   • New user with 0 check-ins → streak = 0
//
// Exports:
//   computeStreakFromDates(sortedDates)          — pure, synchronous
//   computeOverallStreakFromCheckIns(checkIns, habits) — pure, synchronous, server-safe
//   recalculateStreak(habitId, userId)           — async, writes to IndexedDB
//   calculateOverallStreak(userId)               — async, reads IndexedDB
// ─────────────────────────────────────────────
import { db } from "./db";
import { getLocalDateString } from "./date";

// ─────────────────────────────────────────────
// computeStreakFromDates
// Pure helper used by all streak callers.
//
// @param sortedDates  string[] YYYY-MM-DD sorted DESCENDING (newest first)
// @returns            number — current streak count
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// computeLongestStreakFromDates
// Pure helper — finds the longest-ever consecutive run in a date list.
//
// @param sortedDates  string[] YYYY-MM-DD sorted DESCENDING (newest first)
// @returns            number
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// computeOverallStreakFromCheckIns   ← SHARED PURE HELPER
//
// Works on plain arrays — no IO, no IndexedDB, no Supabase client.
// Safe to call from server components (Analytics page) and client components.
//
// @param checkIns   { habit_id|habitId, date, completed }[]  — all check-in rows
// @param habits     { id }[]  — active daily habits for this user
// @returns          { currentStreak: number, longestStreak: number }
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// computeMissedDayPenalty
// Pure helper — computes updated streak count based on missed days.
//
// Rules:
//   • If lastCompletedDate is null → no change
//   • Gap of 0 (today) or 1 (yesterday) → no change
//   • Gap >= 2 → missed (gap - 1) days, subtract from currentStreak (floor 0)
//
// @param lastCompletedDate  string YYYY-MM-DD or null
// @param today              string YYYY-MM-DD
// @param currentStreak      number
// @returns                  number — updated streak count
// ─────────────────────────────────────────────
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


