import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";

export const HabitRepository = {
  /**
   * Creates a new habit locally and syncs to Supabase.
   * If offline, queues the creation.
   * 
   * @param {Object} habitData 
   */
  async createHabit(habitData) {
    // 1. Save to IndexedDB immediately (works offline)
    // Dexie requires string ID for v2
    await db.habits.add(habitData);

    // 2. Sync to Supabase if online
    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("habits").insert({
        id: habitData.id,
        user_id: habitData.userId,
        name: habitData.name,
        category: habitData.category,
        frequency: habitData.frequency,
        reminder_time: habitData.reminderTime,
        color_tag: habitData.colorTag,
        archived: habitData.archived,
        created_at: habitData.createdAt,
      });
    } else {
      // Queue for later sync
      await db.queue.add({ 
        type: "CREATE_HABIT", 
        payload: habitData, 
        createdAt: habitData.createdAt 
      });
    }

    return habitData;
  },

  /**
   * Updates an existing habit locally and syncs to Supabase.
   * 
   * @param {string} habitId 
   * @param {Object} updates { name, frequency, reminderTime }
   */
  async updateHabit(habitId, updates) {
    // 1. Update IndexedDB
    await db.habits.update(habitId, updates);

    // 2. Sync online or queue
    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase
        .from("habits")
        .update({
          name: updates.name,
          frequency: updates.frequency,
          reminder_time: updates.reminderTime,
        })
        .eq("id", habitId);
    } else {
      await db.queue.add({
        type: "UPDATE_HABIT",
        payload: {
          habitId,
          name: updates.name,
          frequency: updates.frequency,
          reminderTime: updates.reminderTime,
        },
        createdAt: new Date().toISOString(),
      });
    }
  },

  async archiveHabit(habitId) {
    await db.habits.update(habitId, { archived: true });

    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("habits").update({ archived: true }).eq("id", habitId);
    } else {
      await db.queue.add({
        type: "ARCHIVE_HABIT",
        payload: { habitId },
        createdAt: new Date().toISOString(),
      });
    }
  },

  /**
   * Unarchives a habit locally and syncs to Supabase.
   * 
   * @param {string} habitId 
   */
  async unarchiveHabit(habitId) {
    await db.habits.update(habitId, { archived: false });

    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("habits").update({ archived: false }).eq("id", habitId);
    } else {
      await db.queue.add({
        type: "UNARCHIVE_HABIT",
        payload: { habitId },
        createdAt: new Date().toISOString(),
      });
    }
  }
};
