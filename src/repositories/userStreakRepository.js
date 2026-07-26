import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date";
import { computeMissedDayPenalty } from "@/lib/streakUtils";

export const UserStreakRepository = {
  /**
   * Retrieves or initializes the user's overall streak record.
   *
   * @param {string} userId
   * @returns {Object} { id, userId, currentStreak, longestStreak, lastCompletedDate, updatedAt }
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
   * Retrieves the current persistent overall streak for a user.
   *
   * @param {string} userId
   * @returns {number}
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
   * @returns {Object} Updated record
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
   * Called when all daily habits for today are completed.
   * Increments streak if consecutive, or sets to 1 if broken/new.
   *
   * @param {string} userId
   * @returns {Object} Updated record
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
