"use client";

import { useState, useEffect, useCallback } from "react";
import { UserStreakRepository } from "@/repositories/userStreakRepository";

/**
 * Custom hook for Option A: Overall "Perfect-Day" Streak System.
 *
 * Exposes the user's overall streak state and mutation methods while ensuring
 * UI components follow project rules and never talk directly to Dexie or repositories.
 *
 * @param {string | null | undefined} userId - The authenticated user's ID.
 * @returns {{
 *   streak: number,
 *   longestStreak: number,
 *   lastCompletedDate: string | null,
 *   isLoading: boolean,
 *   refresh: () => Promise<void>,
 *   recordDayCompleted: () => Promise<Object | null>,
 *   checkAndRecordDayCompletion: (date?: string) => Promise<{ completed: boolean, record: Object | null }>
 * }}
 */
export function useStreak(userId) {
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  /**
   * Revalidates streak from repository and applies missed day penalties if any.
   */
  const refresh = useCallback(async () => {
    if (!userId) {
      setStreak(0);
      setLongestStreak(0);
      setLastCompletedDate(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // applyMissedDayPenalty retrieves/initializes record & penalizes skipped days
      const record = await UserStreakRepository.applyMissedDayPenalty(userId);
      if (record) {
        setStreak(record.currentStreak ?? 0);
        setLongestStreak(record.longestStreak ?? 0);
        setLastCompletedDate(record.lastCompletedDate ?? null);
      }
    } catch (err) {
      console.error("[useStreak] Failed to refresh streak:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * On mount or whenever userId changes, apply penalty and initialize state.
   */
  useEffect(() => {
    let isMounted = true;

    async function initializeStreak() {
      if (!userId) {
        if (isMounted) {
          setStreak(0);
          setLongestStreak(0);
          setLastCompletedDate(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const record = await UserStreakRepository.applyMissedDayPenalty(userId);
        if (isMounted && record) {
          setStreak(record.currentStreak ?? 0);
          setLongestStreak(record.longestStreak ?? 0);
          setLastCompletedDate(record.lastCompletedDate ?? null);
        }
      } catch (err) {
        console.error("[useStreak] Initialization error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeStreak();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  /**
   * Explicitly records that today was completed (all active daily habits checked off).
   * Increments streak and updates local state.
   */
  const recordDayCompleted = useCallback(async () => {
    if (!userId) return null;
    try {
      const updated = await UserStreakRepository.onDayCompleted(userId);
      if (updated) {
        setStreak(updated.currentStreak ?? 0);
        setLongestStreak(updated.longestStreak ?? 0);
        setLastCompletedDate(updated.lastCompletedDate ?? null);
      }
      return updated;
    } catch (err) {
      console.error("[useStreak] Failed to record day completion:", err);
      return null;
    }
  }, [userId]);

  /**
   * Evaluates if all active daily habits are completed today. If so, records day completion.
   */
  const checkAndRecordDayCompletion = useCallback(async (date) => {
    if (!userId) return { completed: false, record: null };
    try {
      const result = await UserStreakRepository.checkAndRecordDayCompletion(userId, date);
      if (result?.record) {
        setStreak(result.record.currentStreak ?? 0);
        setLongestStreak(result.record.longestStreak ?? 0);
        setLastCompletedDate(result.record.lastCompletedDate ?? null);
      }
      return result;
    } catch (err) {
      console.error("[useStreak] Failed to check and record day completion:", err);
      return { completed: false, record: null };
    }
  }, [userId]);

  return {
    streak,
    longestStreak,
    lastCompletedDate,
    isLoading,
    refresh,
    recordDayCompleted,
    checkAndRecordDayCompletion,
  };
}

export default useStreak;
