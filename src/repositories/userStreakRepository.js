import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date";
import {
  computeMissedDayPenalty,
  computeOverallStreakFromCheckIns,
  areAllDailyHabitsCompleted,
} from "@/lib/streakUtils";

/**
 * Repository for Option A: Overall "Perfect-Day" User Streak System.
 *
 * Serves as the SINGLE SOURCE OF TRUTH for user streaks.
 * Under Option A:
 *   - Exactly one streak record exists per user in `db.userStreaks` and Supabase `user_streaks`.
 *   - The streak only advances when ALL active daily habits for the user are completed on that date.
 *   - Checking off only a subset of habits never advances the streak.
 */
export const UserStreakRepository = {
  /**
   * Retrieves or initializes the user's overall streak record.
   *
   * @param {string} userId
   * @returns {Promise<{ id?: number, userId: string, currentStreak: number, longestStreak: number, lastCompletedDate: string|null, updatedAt: string }>}
   */
  async getOrCreate(userId) {
    if (!userId) return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };

    try {
      let record = await db.userStreaks.where("userId").equals(userId).first();

      if (!record) {
        const initialRecord = {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          updatedAt: new Date().toISOString(),
        };
        const id = await db.userStreaks.add(initialRecord);
        record = { ...initialRecord, id };
      }

      return record;
    } catch (err) {
      console.error("[Stryde] Failed to get/create user streak:", err);
      return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
    }
  },

  /**
   * Retrieves the current persistent overall streak count for a user.
   *
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async get(userId) {
    const record = await this.getOrCreate(userId);
    return record?.currentStreak ?? 0;
  },

  /**
   * Checks if days were missed since last completion and updates currentStreak accordingly.
   * Called on app/dashboard load.
   *
   * @param {string} userId
   * @returns {Promise<Object|null>} Updated record
   */
  async applyMissedDayPenalty(userId) {
    if (!userId) return null;

    const record = await this.getOrCreate(userId);
    const today = getLocalDateString();

    const newStreak = computeMissedDayPenalty(
      record.lastCompletedDate,
      today,
      record.currentStreak
    );

    if (newStreak !== record.currentStreak) {
      const updatedAt = new Date().toISOString();
      await db.userStreaks.update(record.id, {
        currentStreak: newStreak,
        updatedAt,
      });

      const updatedRecord = { ...record, currentStreak: newStreak, updatedAt };
      await this._sync(updatedRecord);
      return updatedRecord;
    }

    return record;
  },

  /**
   * Checks whether all active daily habits have been completed today (or on a specific date)
   * for the given user.
   *
   * @param {string} userId
   * @param {string} [date] YYYY-MM-DD string (defaults to today)
   * @returns {Promise<boolean>}
   */
  async hasCompletedAllDailyHabitsToday(userId, date = getLocalDateString()) {
    if (!userId) return false;

    try {
      const activeHabits = await db.habits
        .where("userId")
        .equals(userId)
        .and((h) => h.frequency === "daily" && !h.archived)
        .toArray();

      if (activeHabits.length === 0) return false;

      const checkIns = await db.checkIns
        .where("[userId+date]")
        .equals([userId, date])
        .and((c) => c.completed === true)
        .toArray();

      return areAllDailyHabitsCompleted(activeHabits, checkIns);
    } catch (err) {
      console.error("[Stryde] Failed to check daily habit completion:", err);
      return false;
    }
  },

  /**
   * Called when all daily habits for today are completed.
   * Increments streak if consecutive with yesterday, or sets to 1 if broken/new.
   * Idempotent: safe to call multiple times on the same calendar day.
   *
   * @param {string} userId
   * @returns {Promise<Object|null>} Updated record
   */
  async onDayCompleted(userId) {
    if (!userId) return null;

    const record = await this.getOrCreate(userId);
    const today = getLocalDateString();

    // Idempotent check: if already completed today, do not increment again
    if (record.lastCompletedDate === today) {
      return record;
    }

    let newStreak = 1;
    if (record.lastCompletedDate) {
      const dLast = new Date(`${record.lastCompletedDate}T00:00:00`);
      const dToday = new Date(`${today}T00:00:00`);
      const gap = Math.round((dToday - dLast) / 86_400_000);

      if (gap === 1) {
        // Consecutive day!
        newStreak = record.currentStreak + 1;
      }
    }

    const newLongest = Math.max(record.longestStreak ?? 0, newStreak);
    const updatedAt = new Date().toISOString();

    await db.userStreaks.update(record.id, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: today,
      updatedAt,
    });

    const updatedRecord = {
      ...record,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: today,
      updatedAt,
    };

    await this._sync(updatedRecord);
    return updatedRecord;
  },

  /**
   * Evaluates if all active daily habits are completed today for the user.
   * If yes, automatically records day completion via onDayCompleted(userId).
   *
   * @param {string} userId
   * @param {string} [date] YYYY-MM-DD
   * @returns {Promise<{ completed: boolean, record: Object|null }>}
   */
  async checkAndRecordDayCompletion(userId, date = getLocalDateString()) {
    if (!userId) return { completed: false, record: null };

    const isAllCompleted = await this.hasCompletedAllDailyHabitsToday(userId, date);
    if (isAllCompleted) {
      const record = await this.onDayCompleted(userId);
      return { completed: true, record };
    }

    const record = await this.getOrCreate(userId);
    return { completed: false, record };
  },

  /**
   * Computes the overall streak dynamically across historical check-ins in IndexedDB.
   * Useful for analytics, cross-verification, and recovery.
   *
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getOverallStreak(userId) {
    if (!userId) return 0;

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
      console.error("[Stryde] Failed to calculate overall streak from check-ins:", err);
      return 0;
    }
  },

  /**
   * Internal helper to sync user_streaks to Supabase or queue offline.
   */
  async _sync(record) {
    if (navigator.onLine) {
      try {
        const supabase = getSupabase();
        await supabase.from("user_streaks").upsert(
          {
            user_id: record.userId,
            current_streak: record.currentStreak,
            longest_streak: record.longestStreak,
            last_completed_date: record.lastCompletedDate,
            updated_at: record.updatedAt,
          },
          { onConflict: "user_id" }
        );
      } catch (err) {
        console.warn("[Stryde] Supabase sync user_streaks failed:", err);
      }
    } else {
      await db.queue.add({
        type: "UPSERT_USER_STREAK",
        payload: {
          userId: record.userId,
          currentStreak: record.currentStreak,
          longestStreak: record.longestStreak,
          lastCompletedDate: record.lastCompletedDate,
          updatedAt: record.updatedAt,
        },
        createdAt: new Date().toISOString(),
      });
    }
  },
};

export default UserStreakRepository;
