// src/data/remote/goalRemoteData.js
// ─────────────────────────────────────────────
// All goal-related Supabase queries.
// Every function receives an already-created Supabase client
// so both browser and server clients can be used.
// ─────────────────────────────────────────────

/**
 * Normalized error thrown when a Supabase goal query fails.
 * Preserves the original message, Postgres error code,
 * HTTP status, and details for classification by callers.
 */
export class SupabaseGoalError extends Error {
  /**
   * @param {string} message
   * @param {Object} [opts]
   * @param {string} [opts.code]    - Postgres error code (e.g. "23505")
   * @param {number} [opts.status]  - HTTP status code (e.g. 409)
   * @param {string} [opts.details] - Additional details from the response
   * @param {string} [opts.hint]    - Hint from Postgres
   */
  constructor(message, { code, status, details, hint } = {}) {
    super(message);
    this.name = "SupabaseGoalError";
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
    throw new SupabaseGoalError(
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
 * Inserts a single goal into Supabase.
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {Object} remoteGoal - Goal record in remote format.
 * @returns {Promise<Object|null>}
 */
export async function insertGoalRemote(supabase, remoteGoal) {
  const result = await supabase.from("goals").insert(remoteGoal).select();
  return throwIfError(result, "insertGoalRemote");
}

/**
 * Updates a goal in Supabase.
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {string|number} goalId - The goal's ID.
 * @param {Object} remoteUpdates - Partial remote fields to update.
 * @param {string} [userId] - Optional user ID for ownership filtering.
 * @returns {Promise<Object|null>}
 */
export async function updateGoalRemote(supabase, goalId, remoteUpdates, userId) {
  let query = supabase.from("goals").update(remoteUpdates).eq("id", goalId);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const result = await query;
  return throwIfError(result, "updateGoalRemote");
}

/**
 * Deletes a goal from Supabase.
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {string|number} goalId - The goal's ID.
 * @param {string} [userId] - Optional user ID for ownership filtering.
 * @returns {Promise<Object|null>}
 */
export async function deleteGoalRemote(supabase, goalId, userId) {
  let query = supabase.from("goals").delete().eq("id", goalId);
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const result = await query;
  return throwIfError(result, "deleteGoalRemote");
}

// ─────────────────────────────────────────────
// READ operations (used by Server Components and client)
// ─────────────────────────────────────────────

/**
 * Fetches active goals for a user (used by dashboard page).
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {string} userId - User's ID.
 * @returns {Promise<Array>}
 */
export async function fetchActiveGoals(supabase, userId) {
  const result = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return throwIfError(result, "fetchActiveGoals");
}

/**
 * Fetches all goals for a user (used by goals list page).
 *
 * @param {Object} supabase - Supabase client instance.
 * @param {string} userId - User's ID.
 * @returns {Promise<Array>}
 */
export async function fetchAllGoals(supabase, userId) {
  const result = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return throwIfError(result, "fetchAllGoals");
}
