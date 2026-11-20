// src/data/mappers/habitMapper.js
// ─────────────────────────────────────────────
// Pure transformation functions between local (Dexie)
// and remote (Supabase) habit record formats.
// ─────────────────────────────────────────────

/**
 * Maps a local (Dexie/camelCase) habit record to the remote (Supabase/snake_case) format.
 *
 * Only includes fields that exist on the input object to avoid overwriting
 * remote columns with `undefined`.
 *
 * @param {Object} localHabit - A local habit record.
 * @returns {Object} A remote-shaped habit record.
 */
export function toRemoteHabit(localHabit) {
  if (!localHabit) return localHabit;

  const remote = {};

  if (localHabit.id !== undefined)           remote.id = localHabit.id;
  if (localHabit.userId !== undefined)       remote.user_id = localHabit.userId;
  if (localHabit.name !== undefined)         remote.name = localHabit.name;
  if (localHabit.category !== undefined)     remote.category = localHabit.category;
  if (localHabit.frequency !== undefined)    remote.frequency = localHabit.frequency;
  if (localHabit.reminderTime !== undefined) remote.reminder_time = localHabit.reminderTime;
  if (localHabit.colorTag !== undefined)     remote.color_tag = localHabit.colorTag;
  if (localHabit.archived !== undefined)     remote.archived = localHabit.archived;
  if (localHabit.createdAt !== undefined)    remote.created_at = localHabit.createdAt;

  // Pass through fields that are already in snake_case (e.g. order_index)
  if (localHabit.order_index !== undefined)    remote.order_index = localHabit.order_index;
  if (localHabit.user_id !== undefined && remote.user_id === undefined)
    remote.user_id = localHabit.user_id;
  if (localHabit.reminder_time !== undefined && remote.reminder_time === undefined)
    remote.reminder_time = localHabit.reminder_time;
  if (localHabit.color_tag !== undefined && remote.color_tag === undefined)
    remote.color_tag = localHabit.color_tag;
  if (localHabit.created_at !== undefined && remote.created_at === undefined)
    remote.created_at = localHabit.created_at;

  return remote;
}

/**
 * Maps a remote (Supabase/snake_case) habit record to local (Dexie/camelCase) format.
 *
 * Only includes fields that exist on the input object.
 *
 * @param {Object} remoteHabit - A remote habit record.
 * @returns {Object} A local-shaped habit record.
 */
export function toLocalHabit(remoteHabit) {
  if (!remoteHabit) return remoteHabit;

  const local = {};

  if (remoteHabit.id !== undefined)            local.id = remoteHabit.id;
  if (remoteHabit.user_id !== undefined)       local.userId = remoteHabit.user_id;
  if (remoteHabit.name !== undefined)          local.name = remoteHabit.name;
  if (remoteHabit.category !== undefined)      local.category = remoteHabit.category;
  if (remoteHabit.frequency !== undefined)     local.frequency = remoteHabit.frequency;
  if (remoteHabit.reminder_time !== undefined) local.reminderTime = remoteHabit.reminder_time;
  if (remoteHabit.color_tag !== undefined)     local.colorTag = remoteHabit.color_tag;
  if (remoteHabit.archived !== undefined)      local.archived = remoteHabit.archived;
  if (remoteHabit.created_at !== undefined)    local.createdAt = remoteHabit.created_at;
  if (remoteHabit.order_index !== undefined)   local.order_index = remoteHabit.order_index;

  return local;
}

/**
 * Maps a partial local update object to its remote equivalent.
 *
 * Only includes fields that are actually supplied in the update,
 * so unrelated remote columns are never overwritten with `undefined`.
 *
 * @param {Object} localUpdates - Partial local habit fields.
 * @returns {Object} Partial remote habit fields.
 */
export function toRemoteUpdates(localUpdates) {
  if (!localUpdates) return localUpdates;

  const remote = {};

  if (localUpdates.name !== undefined)         remote.name = localUpdates.name;
  if (localUpdates.category !== undefined)     remote.category = localUpdates.category;
  if (localUpdates.frequency !== undefined)    remote.frequency = localUpdates.frequency;
  if (localUpdates.reminderTime !== undefined) remote.reminder_time = localUpdates.reminderTime;
  if (localUpdates.colorTag !== undefined)     remote.color_tag = localUpdates.colorTag;
  if (localUpdates.archived !== undefined)     remote.archived = localUpdates.archived;
  if (localUpdates.createdAt !== undefined)    remote.created_at = localUpdates.createdAt;

  // Pass through already-snake_case fields
  if (localUpdates.reminder_time !== undefined && remote.reminder_time === undefined)
    remote.reminder_time = localUpdates.reminder_time;
  if (localUpdates.color_tag !== undefined && remote.color_tag === undefined)
    remote.color_tag = localUpdates.color_tag;

  return remote;
}
