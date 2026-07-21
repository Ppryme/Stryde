import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";

export const CheckInRepository = {
  /**
   * Upserts a check-in locally and syncs to Supabase.
   * 
   * @param {Object} params { habitId, userId, date, completed }
   */
  async upsertCheckIn({ habitId, userId, date, completed }) {
    const createdAt = new Date().toISOString();

    // 1. Upsert IndexedDB
    const existing = await db.checkIns
      .where({ habitId, userId, date })
      .first();

    if (existing) {
      await db.checkIns.update(existing.id, { completed, synced: false });
    } else {
      await db.checkIns.add({
        habitId,
        userId,
        date,
        completed,
        synced: false,
        createdAt,
      });
    }

    // 2. Sync online or queue
    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("check_ins").upsert(
        { habit_id: habitId, user_id: userId, date, completed },
        { onConflict: "habit_id,date" }
      );
    } else {
      await db.queue.add({
        type: "UPSERT_CHECKIN",
        payload: { habitId, userId, date, completed },
        createdAt,
      });
    }
  },
};
