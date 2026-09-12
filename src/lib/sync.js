// lib/sync.js
import { db } from '@/lib/db';
import { getSupabase } from '@/lib/supabase';

export async function syncQueue() {
  const pending = await db.queue.toArray();
  if (pending.length === 0) return;

  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) {
    // No authenticated user active; do not replay queue
    return;
  }

  for (const item of pending) {
    // Ensure item belongs to the currently authenticated user to avoid cross-user sync pollution
    const itemUserId = item.payload?.userId || item.payload?.user_id;
    if (itemUserId && itemUserId !== currentUserId) {
      await db.queue.delete(item.id);
      continue;
    }

    try {
      if (item.type === 'UPSERT_CHECKIN') {
        await supabase.from('check_ins').upsert(
          {
            habit_id: item.payload.habitId,
            user_id:  currentUserId,
            date:     item.payload.date,
            completed: item.payload.completed,
          },
          { onConflict: 'habit_id,date' }
        );
      }

      if (item.type === 'CREATE_HABIT') {
        await supabase.from('habits').insert({
          user_id:      currentUserId,
          name:         item.payload.name,
          frequency:    item.payload.frequency,
          category:     item.payload.category,
          color_tag:    item.payload.colorTag,
          reminder_time: item.payload.reminderTime,
        });
      }

      if (item.type === 'UPDATE_HABIT') {
        await supabase.from('habits').update({
          name: item.payload.name,
          frequency: item.payload.frequency,
          reminder_time: item.payload.reminderTime
        }).eq('id', item.payload.habitId).eq('user_id', currentUserId);
      }

      if (item.type === 'ARCHIVE_HABIT') {
        await supabase.from('habits').update({ archived: true }).eq('id', item.payload.habitId).eq('user_id', currentUserId);
      }

      if (item.type === 'CREATE_GOAL') {
        await supabase.from('goals').insert({
          user_id:      currentUserId,
          title:        item.payload.title,
          description:  item.payload.description,
          target_date:  item.payload.target_date || item.payload.targetDate,
          progress_pct: item.payload.progress_pct ?? item.payload.progressPct ?? 0,
          status:       item.payload.status || 'active',
        });
      }

      if (item.type === 'UPDATE_GOAL') {
        await supabase.from('goals').update(item.payload.updates).eq('id', item.payload.id).eq('user_id', currentUserId);
      }

      if (item.type === 'DELETE_GOAL') {
        await supabase.from('goals').delete().eq('id', item.payload.id).eq('user_id', currentUserId);
      }

      if (item.type === 'UPSERT_STREAK') {
        await supabase.from('streaks').upsert(
          {
            habit_id:       item.payload.habitId,
            user_id:        currentUserId,
            current_streak: item.payload.currentStreak,
            longest_streak: item.payload.longestStreak,
            last_checked_in: item.payload.lastCheckedIn,
            updated_at:     new Date().toISOString(),
          },
          { onConflict: 'habit_id' }
        );
      }

      if (item.type === 'UPSERT_USER_STREAK') {
        await supabase.from('user_streaks').upsert(
          {
            user_id:             currentUserId,
            current_streak:      item.payload.currentStreak,
            longest_streak:      item.payload.longestStreak,
            last_completed_date: item.payload.lastCompletedDate,
            updated_at:          item.payload.updatedAt || new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }

      // Remove from queue on success
      await db.queue.delete(item.id);
    } catch (err) {
      console.error('Sync failed for item', item.id, err);
      // Leave in queue to retry next time
    }
  }
}

// Call this whenever the app comes online
export function initSyncListener() {
  window.addEventListener('online', syncQueue);
}