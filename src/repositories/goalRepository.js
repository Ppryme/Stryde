import { getSupabase } from "@/lib/supabase";

export const GoalRepository = {
  /**
   * Creates a new goal in Supabase.
   *
   * @param {Object} payload 
   * @returns {Object} inserted data
   */
  async createGoal(payload) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("goals").insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing goal in Supabase.
   *
   * @param {string} id 
   * @param {Object} payload 
   * @returns {Object} updated data
   */
  async updateGoal(id, payload) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("goals").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  /**
   * Deletes a goal from Supabase.
   *
   * @param {string} id 
   */
  async deleteGoal(id) {
    const supabase = getSupabase();
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
  }
};
