// hooks/useHabits.js
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import useAppStore from '@/stores/useAppStore';

export function useHabits(userId) {
  const [loading, setLoading] = useState(true);
  const { habits, setHabits } = useAppStore();

  useEffect(() => {
    if (!userId) return;

    async function loadHabits() {
      // 1. Load from IndexedDB first (instant, offline-safe)
      const localHabits = await db.habits
        .where('userId').equals(userId)
        .and((h) => !h.archived)
        .toArray();

      if (localHabits.length > 0) {
        setHabits(localHabits);
        setLoading(false);
      }

      // 2. Then fetch from Supabase and sync
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false);

      if (data && !error) {
        // Update local DB with fresh data
        await db.habits.bulkPut(data.map((h) => ({ ...h, userId: h.user_id })));
        setHabits(data);
      }

      setLoading(false);
    }

    loadHabits();
  }, [userId]);

  async function createHabit(habitData) {
    const newHabit = {
      ...habitData,
      userId,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    // Save to IndexedDB immediately (optimistic)
    const localId = await db.habits.add(newHabit);

    // Queue for Supabase sync
    await db.queue.add({
      type: 'CREATE_HABIT',
      payload: newHabit,
      createdAt: new Date().toISOString(),
    });

    setHabits([...habits, { ...newHabit, id: localId }]);
    return localId;
  }

  async function archiveHabit(habitId) {
    await db.habits.update(habitId, { archived: true });
    await supabase.from('habits').update({ archived: true }).eq('id', habitId);
    setHabits(habits.filter((h) => h.id !== habitId));
  }

  return { habits, loading, createHabit, archiveHabit };
}