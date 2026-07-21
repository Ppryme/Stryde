// hooks/useCheckins.js
import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import useAppStore from '@/stores/useAppStore';
import { StreakRepository } from '@/repositories/streakRepository';

export function useCheckins(userId) {
  const { todayCheckIns, markCheckedIn } = useAppStore();
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

  useEffect(() => {
    if (!userId) return;

    async function loadTodayCheckins() {
      const local = await db.checkIns
        .where('[userId+date]')
        .equals([userId, today])
        .toArray();

      const map = {};
      local.forEach((c) => { map[c.habitId] = c.completed; });
      useAppStore.setState({ todayCheckIns: map });
      setLoading(false);
    }

    loadTodayCheckins();
  }, [userId]);

  async function toggleCheckIn(habitId, currentValue) {
    const newValue = !currentValue;
    const now = new Date().toISOString();

    // 1. Optimistic UI update immediately
    markCheckedIn(habitId, newValue);

    // 2. Write to IndexedDB
    const existing = await db.checkIns
      .where({ habitId, userId, date: today })
      .first();

    if (existing) {
      await db.checkIns.update(existing.id, { completed: newValue, synced: false });
    } else {
      await db.checkIns.add({
        habitId, userId, date: today,
        completed: newValue,
        synced: false,
        createdAt: now,
      });
    }

    // 3. Recalculate streak locally
    await StreakRepository.updateStreak(habitId, userId);

    // 4. Queue for Supabase sync
    await db.queue.add({
      type: 'UPSERT_CHECKIN',
      payload: { habitId, userId, date: today, completed: newValue },
      createdAt: now,
    });

    return newValue;
  }

  // Completion count for today
  const completedCount = Object.values(todayCheckIns).filter(Boolean).length;

  return { todayCheckIns, completedCount, toggleCheckIn, loading };
}