// lib/sync.js
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function syncQueue() {
  const pending = await db.queue.toArray();
  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      if (item.type === 'UPSERT_CHECKIN') {
        await supabase.from('check_ins').upsert(
          {
            habit_id: item.payload.habitId,
            user_id:  item.payload.userId,
            date:     item.payload.date,
            completed: item.payload.completed,
          },
          { onConflict: 'habit_id, date' }
        );
      }

      if (item.type === 'CREATE_HABIT') {
        await supabase.from('habits').insert({
          user_id:      item.payload.userId,
          name:         item.payload.name,
          frequency:    item.payload.frequency,
          category:     item.payload.category,
          color_tag:    item.payload.colorTag,
          reminder_time: item.payload.reminderTime,
        });
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