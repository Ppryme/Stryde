// src/data/mappers/goalMapper.js
// ─────────────────────────────────────────────
// Pure transformation functions between local (Dexie)
// and remote (Supabase) goal record formats.
// ─────────────────────────────────────────────

/**
 * Maps a local (Dexie) goal record to the remote (Supabase/snake_case) format.
 *
 * Only includes fields that exist on the input object to avoid overwriting
 * remote columns with undefined.
 *
 * @param {Object} localGoal - A local goal record.
 * @returns {Object} A remote-shaped goal record.
 */
export function toRemoteGoal(localGoal) {
  if (!localGoal) return localGoal;

  const remote = {};

  if (localGoal.id !== undefined) remote.id = localGoal.id;

  // Map user ID
  if (localGoal.userId !== undefined) {
    remote.user_id = localGoal.userId;
  } else if (localGoal.user_id !== undefined) {
    remote.user_id = localGoal.user_id;
  }

  if (localGoal.title !== undefined) remote.title = localGoal.title;
  if (localGoal.description !== undefined) remote.description = localGoal.description;

  // Map target date
  if (localGoal.targetDate !== undefined) {
    remote.target_date = localGoal.targetDate;
  } else if (localGoal.target_date !== undefined) {
    remote.target_date = localGoal.target_date;
  }

  // Map progress percentage
  if (localGoal.progressPct !== undefined) {
    remote.progress_pct = localGoal.progressPct;
  } else if (localGoal.progress_pct !== undefined) {
    remote.progress_pct = localGoal.progress_pct;
  }

  if (localGoal.status !== undefined) remote.status = localGoal.status;

  // Map timestamps
  if (localGoal.createdAt !== undefined) {
    remote.created_at = localGoal.createdAt;
  } else if (localGoal.created_at !== undefined) {
    remote.created_at = localGoal.created_at;
  }

  if (localGoal.updatedAt !== undefined) {
    remote.updated_at = localGoal.updatedAt;
  } else if (localGoal.updated_at !== undefined) {
    remote.updated_at = localGoal.updated_at;
  }

  return remote;
}

/**
 * Maps a remote (Supabase/snake_case) goal record to local (Dexie) format.
 * Preserves both snake_case and camelCase field aliases so components
 * consuming either property continue working seamlessly.
 *
 * @param {Object} remoteGoal - A remote goal record.
 * @returns {Object} A local-shaped goal record.
 */
export function toLocalGoal(remoteGoal) {
  if (!remoteGoal) return remoteGoal;

  const local = {};

  if (remoteGoal.id !== undefined) local.id = remoteGoal.id;

  if (remoteGoal.user_id !== undefined) {
    local.userId = remoteGoal.user_id;
    local.user_id = remoteGoal.user_id;
  }

  if (remoteGoal.title !== undefined) local.title = remoteGoal.title;
  if (remoteGoal.description !== undefined) local.description = remoteGoal.description;

  if (remoteGoal.target_date !== undefined) {
    local.targetDate = remoteGoal.target_date;
    local.target_date = remoteGoal.target_date;
  }

  if (remoteGoal.progress_pct !== undefined) {
    local.progressPct = remoteGoal.progress_pct;
    local.progress_pct = remoteGoal.progress_pct;
  }

  if (remoteGoal.status !== undefined) local.status = remoteGoal.status;

  if (remoteGoal.created_at !== undefined) {
    local.createdAt = remoteGoal.created_at;
    local.created_at = remoteGoal.created_at;
  }

  if (remoteGoal.updated_at !== undefined) {
    local.updatedAt = remoteGoal.updated_at;
    local.updated_at = remoteGoal.updated_at;
  }

  return local;
}

/**
 * Maps a partial local goal update object to its remote equivalent.
 *
 * Only includes fields that are actually supplied in the update.
 *
 * @param {Object} localUpdates - Partial local goal fields.
 * @returns {Object} Partial remote goal fields.
 */
export function toRemoteGoalUpdates(localUpdates) {
  if (!localUpdates) return localUpdates;

  const remote = {};

  if (localUpdates.title !== undefined) remote.title = localUpdates.title;
  if (localUpdates.description !== undefined) remote.description = localUpdates.description;

  if (localUpdates.targetDate !== undefined) {
    remote.target_date = localUpdates.targetDate;
  } else if (localUpdates.target_date !== undefined) {
    remote.target_date = localUpdates.target_date;
  }

  if (localUpdates.progressPct !== undefined) {
    remote.progress_pct = localUpdates.progressPct;
  } else if (localUpdates.progress_pct !== undefined) {
    remote.progress_pct = localUpdates.progress_pct;
  }

  if (localUpdates.status !== undefined) remote.status = localUpdates.status;

  if (localUpdates.updatedAt !== undefined) {
    remote.updated_at = localUpdates.updatedAt;
  } else if (localUpdates.updated_at !== undefined) {
    remote.updated_at = localUpdates.updated_at;
  }

  return remote;
}
