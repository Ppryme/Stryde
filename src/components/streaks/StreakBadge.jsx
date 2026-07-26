// src/components/streaks/StreakBadge.jsx
// ─────────────────────────────────────────────
// STREAK BADGE — shows current streak count in the dashboard header.
//
// Displays "0" for users who have habits but haven't completed a full
// day yet, so new users always see a clear baseline.
// Hides during the initial async load (streak === null).
//
// Props:
//   habitId  — if set, shows per-habit streak from IndexedDB
//   userId   — if set, shows overall daily completion streak
//   trigger  — any value; change it to force a re-fetch (e.g. completedCount)
// ─────────────────────────────────────────────
"use client";
import { useState, useEffect } from "react";
import { StreakRepository } from "@/repositories/streakRepository";
import { UserStreakRepository } from "@/repositories/userStreakRepository";
import { Flame } from "lucide-react";

export default function StreakBadge({ habitId, userId, trigger }) {
  // null  → loading (badge hidden)
  // 0..n  → streak count (always shown once resolved)
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let value = 0;

      if (habitId) {
        value = await StreakRepository.getHabitStreak(habitId);
      } else if (userId) {
        value = await UserStreakRepository.get(userId);
      }

      if (!cancelled) setStreak(value);
    }

    load().catch(() => { if (!cancelled) setStreak(0); });

    return () => { cancelled = true; };
  }, [habitId, userId, trigger]);

  // While loading, render nothing to avoid a flash of "0" on page load.
  if (streak === null) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 bg-stryde-fire-light text-stryde-fire-dark">
      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
      {streak}
    </span>
  );
}
