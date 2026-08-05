import { db } from "@/lib/db"; // Dexie instance
import { getSupabase } from "@/lib/supabase";

export const GoalRepository = {
  async updateGoal(id, updates) {
    // 1. Update local Dexie DB immediately
    await db.goals.update(id, { ...updates, updated_at: new Date().toISOString() });

    // 2. Try pushing to Supabase if online, otherwise queue it
    if (navigator.onLine) {
      try {
        const supabase = getSupabase();
        await supabase.from("goals").update(updates).eq("id", id);
      } catch (err) {
        console.warn("Network sync failed, queueing update:", err);
        await db.syncQueue.add({ type: "UPDATE_GOAL", payload: { id, updates } });
      }
    } else {
      // Offline: Store mutation in IndexedDB queue
      await db.syncQueue.add({ type: "UPDATE_GOAL", payload: { id, updates } });
    }

    return true;
  }
};