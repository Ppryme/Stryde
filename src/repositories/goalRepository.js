import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";

export const GoalRepository = {
  /**
   * Creates a goal locally and syncs to Supabase or queues offline.
   * @param {Object} goalData
   */
  async createGoal(goalData) {
    const userId = goalData.user_id || goalData.userId;
    const localRecord = {
      ...goalData,
      userId,
      status: goalData.status || "active",
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save to IndexedDB goals store
    const localId = await db.goals.add(localRecord);

    // 2. Sync to Supabase if online, otherwise queue
    if (navigator.onLine) {
      try {
        const supabase = getSupabase();
        await supabase.from("goals").insert({
          user_id: userId,
          title: goalData.title,
          description: goalData.description,
          target_date: goalData.target_date || goalData.targetDate,
          progress_pct: goalData.progress_pct ?? goalData.progressPct ?? 0,
          status: goalData.status || "active",
        });
      } catch (err) {
        console.warn("Network sync failed, queueing goal creation:", err);
        await db.queue.add({
          type: "CREATE_GOAL",
          payload: { ...localRecord, id: localId },
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      await db.queue.add({
        type: "CREATE_GOAL",
        payload: { ...localRecord, id: localId },
        createdAt: new Date().toISOString(),
      });
    }

    return localId;
  },

  /**
   * Updates an existing goal locally and syncs to Supabase.
   * @param {string|number} id
   * @param {Object} updates
   * @param {string} [userId]
   */
  async updateGoal(id, updates, userId) {
    const updatedAt = new Date().toISOString();
    // 1. Update local Dexie DB immediately
    await db.goals.update(id, { ...updates, updated_at: updatedAt });

    // 2. Try pushing to Supabase if online, otherwise queue it
    if (navigator.onLine) {
      try {
        const supabase = getSupabase();
        let query = supabase.from("goals").update({ ...updates, updated_at: updatedAt }).eq("id", id);
        if (userId) {
          query = query.eq("user_id", userId);
        }
        await query;
      } catch (err) {
        console.warn("Network sync failed, queueing update:", err);
        await db.queue.add({
          type: "UPDATE_GOAL",
          payload: { id, updates, userId },
          createdAt: updatedAt,
        });
      }
    } else {
      await db.queue.add({
        type: "UPDATE_GOAL",
        payload: { id, updates, userId },
        createdAt: updatedAt,
      });
    }

    return true;
  },

  /**
   * Deletes a goal locally and syncs to Supabase.
   * @param {string|number} id
   * @param {string} [userId]
   */
  async deleteGoal(id, userId) {
    // 1. Delete from local Dexie DB
    await db.goals.delete(id);

    // 2. Sync to Supabase or queue
    if (navigator.onLine) {
      try {
        const supabase = getSupabase();
        let query = supabase.from("goals").delete().eq("id", id);
        if (userId) {
          query = query.eq("user_id", userId);
        }
        await query;
      } catch (err) {
        console.warn("Network sync failed, queueing delete:", err);
        await db.queue.add({
          type: "DELETE_GOAL",
          payload: { id, userId },
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      await db.queue.add({
        type: "DELETE_GOAL",
        payload: { id, userId },
        createdAt: new Date().toISOString(),
      });
    }

    return true;
  },

  /**
   * Queries goals for a specific user.
   * @param {string} userId
   * @param {string} [status]
   */
  async getGoals(userId, status) {
    if (!userId) return [];
    let query = db.goals.where("userId").equals(userId);
    if (status) {
      query = query.and((g) => g.status === status);
    }
    return query.toArray();
  },
};

export default GoalRepository;