// src/data/remote/habitRemoteData.js
// ─────────────────────────────────────────────
// All habit-related Supabase queries.
// Every function receives an already-created Supabase client
// so both browser and server clients can be used.
// ─────────────────────────────────────────────

/**
 * Normalized error thrown when a Supabase query fails.
 * Preserves the original message, Postgres error code,
 * HTTP status and details for classification by callers.
 */
export class SupabaseHabitError extends Error {
  /**
   * @param {string} message
   * @param {Object} opts
   * @param {string} [opts.code]    - Postgres error code (e.g. "23505")
   * @param {number} [opts.status]  - HTTP status code (e.g. 409)
   * @param {string} [opts.details] - Additional details from the response
   * @param {string} [opts.hint]    - Hint from Postgres
   */
  constructor(message, { code, status, details, hint } = {}) {
    super(message);
    this.name = "SupabaseHabitError";
    this.code = code ?? null;
    this.status = status ?? null;
    this.details = details ?? null;
    this.hint = hint ?? null;
  }
}

/**
 * Internal helper: checks a Supabase result and throws on error.
 */
function throwIfError(result, context) {
  if (result.error) {
    throw new SupabaseHabitError(
      result.error.message || `Supabase error in ${context}`,
      {
        code: result.error.code,
        status: result.status ?? result.error.status,
        details: result.error.details,
        hint: result.error.hint,
      }
    );
  }
  return result.data;
}

// ─────────────────────────────────────────────
// WRITE operations
// ─────────────────────────────────────────────

/**
 * Inserts a single habit into Supabase.
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {Object} remoteHabit - Habit record in remote/snake_case format.
 * @returns {Promise<Object|null>} The inserted data.
 */
export async function insertHabitRemote(supabase, remoteHabit) {
  const result = await supabase.from("habits").insert(remoteHabit).select();
  return throwIfError(result, "insertHabitRemote");
}

/**
 * Inserts multiple habits in a single batch.
 * Used by onboarding where Supabase generates IDs.
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {Array<Object>} remoteHabits - Array of habit records in remote format.
 * @returns {Promise<Object|null>} The inserted data.
 */
export async function insertHabitsRemoteBatch(supabase, remoteHabits) {
  const result = await supabase.from("habits").insert(remoteHabits);
  return throwIfError(result, "insertHabitsRemoteBatch");
}

/**
 * Updates a habit in Supabase.
 * Applies a user ownership filter.
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {string} habitId - The habit's UUID.
 * @param {Object} remoteUpdates - Partial remote fields to update.
 * @param {string} userId - Owner's user ID for the ownership filter.
 * @returns {Promise<Object|null>}
 */
export async function updateHabitRemote(supabase, habitId, remoteUpdates, userId) {
  let query = supabase.from("habits").update(remoteUpdates).eq("id", habitId);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const result = await query;
  return throwIfError(result, "updateHabitRemote");
}

/**
 * Archives a habit remotely (sets archived = true).
 *
 * @param {Object} supabase
 * @param {string} habitId
 * @param {string} [userId] - Optional user ownership filter.
 * @returns {Promise<Object|null>}
 */
export async function archiveHabitRemote(supabase, habitId, userId) {
  let query = supabase.from("habits").update({ archived: true }).eq("id", habitId);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const result = await query;
  return throwIfError(result, "archiveHabitRemote");
}

/**
 * Unarchives a habit remotely (sets archived = false).
 *
 * @param {Object} supabase
 * @param {string} habitId
 * @param {string} [userId] - Optional user ownership filter.
 * @returns {Promise<Object|null>}
 */
export async function unarchiveHabitRemote(supabase, habitId, userId) {
  let query = supabase.from("habits").update({ archived: false }).eq("id", habitId);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const result = await query;
  return throwIfError(result, "unarchiveHabitRemote");
}

// ─────────────────────────────────────────────
// READ operations (used by Server Components and client)
// ─────────────────────────────────────────────

/**
 * Fetches active daily habits for the dashboard and check-in pages.
 * Replicates the existing query: select *, archived=false, frequency=daily,
 * ordered by order_index ascending.
 *
 * @param {Object} supabase
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchActiveDailyHabits(supabase, userId) {
  const result = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("archived", false)
    .eq("frequency", "daily")
    .order("order_index", { ascending: true });
  return throwIfError(result, "fetchActiveDailyHabits");
}

/**
 * Fetches active daily habit IDs for analytics streak calculation.
 * Replicates: select id, frequency=daily, archived=false.
 *
 * @param {Object} supabase
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchActiveDailyHabitIds(supabase, userId) {
  const result = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)
    .eq("frequency", "daily")
    .eq("archived", false);
  return throwIfError(result, "fetchActiveDailyHabitIds");
}

/**
 * Fetches active habits for the new-goal page linking.
 * Replicates: select id, name, category, archived=false.
 *
 * @param {Object} supabase
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function fetchActiveHabitsForGoalLinking(supabase, userId) {
  const result = await supabase
    .from("habits")
    .select("id, name, category")
    .eq("user_id", userId)
    .eq("archived", false);
  return throwIfError(result, "fetchActiveHabitsForGoalLinking");
}
