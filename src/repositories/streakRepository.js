import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { computeStreakFromDates, computeOverallStreakFromCheckIns } from "@/lib/streakUtils";

export const StreakRepository = {
  /**
   * Recalculates and persists the PER-HABIT streak locally and syncs to Supabase.
   *
   * @param {string} habitId
   * @param {string} userId
   * @returns {Object} { currentStreak, longestStreak }
   */
  async updateStreak(habitId, userId) {
    const checkIns = await db.checkIns
      .where("habitId").equals(habitId)
      .and((c) => c.userId === userId && c.completed === true)
      .toArray();

    let currentStreak = 0;
    let longestStreak = 0;
    let lastCheckedIn = null;

    if (checkIns.length === 0) {
      const existing = await db.streaks.where("habitId").equals(habitId).first();
      if (existing) {
        await db.streaks.update(existing.id, { currentStreak: 0 });
      }
      longestStreak = existing?.longestStreak ?? 0;
    } else {
      const dates = checkIns
        .map((c) => c.date)
        .sort((a, b) => new Date(b) - new Date(a));
      
      currentStreak = computeStreakFromDates(dates);
      const existing = await db.streaks.where("habitId").equals(habitId).first();
      longestStreak = Math.max(existing?.longestStreak ?? 0, currentStreak);
      lastCheckedIn = dates[0];

      if (existing) {
        await db.streaks.update(existing.id, {
          currentStreak,
          longestStreak,
          lastCheckedIn,
        });
      } else {
        await db.streaks.add({
          habitId,
          userId, // Added userId to match table schema
          currentStreak,
          longestStreak,
          lastCheckedIn,
        });
      }
    }

    // 2. Sync online or queue
    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("streaks").upsert(
        {
          habit_id: habitId,
          user_id: userId,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_checked_in: lastCheckedIn,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "habit_id" }
      );
    } else {
      await db.queue.add({
        type: "UPSERT_STREAK",
        payload: {
          habitId,
          userId,
          currentStreak,
          longestStreak,
          lastCheckedIn,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return { currentStreak, longestStreak };
  },

  /**
   * Async wrapper to calculate the overall streak across all daily habits (reads IndexedDB).
   * Used primarily by Dashboard.
   *
   * @param {string} userId
   * @returns {number}
   */
  async getOverallStreak(userId) {
    try {
      const activeHabits = await db.habits
        .where("userId").equals(userId)
        .and((h) => h.frequency === "daily" && !h.archived)
        .toArray();

      if (activeHabits.length === 0) return 0;

      const checkIns = await db.checkIns
        .where("userId").equals(userId)
        .and((c) => c.completed === true)
        .toArray();

      const { currentStreak } = computeOverallStreakFromCheckIns(checkIns, activeHabits);
      return currentStreak;
    } catch (err) {
      console.error("[Stryde] Failed to calculate overall streak:", err);
      return 0;
    }
  },

  /**
   * Retrieves the current streak for a specific habit from IndexedDB.
   *
   * @param {string} habitId 
   * @returns {number}
   */
  async getHabitStreak(habitId) {
    try {
      const record = await db.streaks.where("habitId").equals(habitId).first();
      return record?.currentStreak ?? 0;
    } catch (err) {
      console.error("[Stryde] Failed to get habit streak:", err);
      return 0;
    }
  }
};
