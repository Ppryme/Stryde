// src/lib/streakUtils.js
// ─────────────────────────────────────────────
// STREAK UTILS — calculates and saves streak data
// Runs locally against IndexedDB (no network needed)
// Returns the new currentStreak number
// ─────────────────────────────────────────────
import { db } from "./db";
import { getLocalDateString } from "./date";

export async function recalculateStreak(habitId, userId) {
  // Get all COMPLETED check-ins for this habit
  const checkIns = await db.checkIns
    .where("habitId").equals(habitId)
    .and((c) => c.userId === userId && c.completed === true)
    .toArray();

  if (checkIns.length === 0) {
    // No completions — zero the streak
    const existing = await db.streaks.where("habitId").equals(habitId).first();
    if (existing) {
      await db.streaks.update(existing.id, { currentStreak: 0 });
    }
    return 0;
  }

  // Sort dates descending (newest first)
  const dates = checkIns
    .map((c) => c.date)
    .sort((a, b) => new Date(b) - new Date(a));

  const today     = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86_400_000));

  // If the last check-in wasn't today or yesterday, streak is broken
  if (dates[0] !== today && dates[0] !== yesterday) {
    const existing = await db.streaks.where("habitId").equals(habitId).first();
    if (existing) {
      await db.streaks.update(existing.id, { currentStreak: 0 });
    }
    return 0;
  }

  // Count consecutive days going backwards
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const newerDate = new Date(dates[i - 1]);
    const olderDate = new Date(dates[i]);
    const dayDiff   = (newerDate - olderDate) / 86_400_000;

    if (dayDiff === 1) {
      streak++;
    } else {
      break; // gap found — stop counting
    }
  }

  // Save to IndexedDB
  const existing = await db.streaks.where("habitId").equals(habitId).first();
  if (existing) {
    await db.streaks.update(existing.id, {
      currentStreak: streak,
      longestStreak: Math.max(existing.longestStreak ?? 0, streak),
      lastCheckedIn: dates[0],
    });
  } else {
    await db.streaks.add({
      habitId,
      currentStreak: streak,
      longestStreak: streak,
      lastCheckedIn: dates[0],
    });
  }

  return streak;
}

export async function calculateOverallStreak(userId) {
  try {
    // Get all active daily habits for this user
    const activeHabits = await db.habits
      .where("userId").equals(userId)
      .and((h) => h.frequency === "daily" && !h.archived)
      .toArray();

    if (activeHabits.length === 0) return 0;

    const dailyHabitIds = activeHabits.map((h) => h.id);
    const totalHabitsCount = dailyHabitIds.length;

    // Get all completed check-ins for this user
    const checkIns = await db.checkIns
      .where("userId").equals(userId)
      .and((c) => c.completed === true)
      .toArray();

    // Group completed check-ins by date
    const dateMap = {};
    checkIns.forEach((c) => {
      if (dailyHabitIds.includes(c.habitId)) {
        if (!dateMap[c.date]) {
          dateMap[c.date] = new Set();
        }
        dateMap[c.date].add(c.habitId);
      }
    });

    // A date is complete if all active daily habits are completed on that date
    const completedDates = Object.keys(dateMap)
      .filter((date) => dateMap[date].size === totalHabitsCount)
      .sort((a, b) => new Date(b) - new Date(a));

    if (completedDates.length === 0) return 0;

    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 86_400_000));

    // If the last complete check-in wasn't today or yesterday, streak is broken
    if (completedDates[0] !== today && completedDates[0] !== yesterday) {
      return 0;
    }

    // Count consecutive days going backwards
    let streak = 1;
    for (let i = 1; i < completedDates.length; i++) {
      const newerDate = new Date(completedDates[i - 1]);
      const olderDate = new Date(completedDates[i]);
      const dayDiff = (newerDate - olderDate) / 86_400_000;

      if (dayDiff === 1) {
        streak++;
      } else {
        break; // gap found — stop counting
      }
    }

    return streak;
  } catch (err) {
    console.error("Failed to calculate overall streak:", err);
    return 0;
  }
}

