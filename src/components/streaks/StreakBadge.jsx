// src/components/streaks/StreakBadge.jsx
// ─────────────────────────────────────────────
// STREAK BADGE — shows current overall streak count in the dashboard header.
//
// Displays "0" for users who have habits but haven't completed a full
// day yet, so new users always see a clear baseline.
// Hides during the initial async load.
//
// Props:
//   userId   — user ID to fetch streak for via useStreak hook
//   streak   — optional direct streak number prop
//   trigger  — optional trigger to force a re-fetch
// ─────────────────────────────────────────────
"use client";
import { useEffect } from "react";
import { useStreak } from "@/hooks/useStreak";
import { Flame } from "lucide-react";

export default function StreakBadge({ userId, streak: streakProp, isLoading: isLoadingProp, trigger }) {
  const { streak: hookStreak, isLoading: hookLoading, refresh } = useStreak(streakProp === undefined ? userId : null);

  useEffect(() => {
    if (trigger !== undefined && streakProp === undefined && userId) {
      refresh();
    }
  }, [trigger, streakProp, userId, refresh]);

  const isLoading = isLoadingProp !== undefined ? isLoadingProp : hookLoading;
  const displayStreak = streakProp !== undefined ? streakProp : hookStreak;

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 bg-stryde-fire-light text-stryde-fire-dark">
        <Flame className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
        <span className="inline-block w-3 h-3 border-2 border-stryde-fire-dark/30 border-t-stryde-fire-dark rounded-full animate-spin" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 bg-stryde-fire-light text-stryde-fire-dark">
      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
      {displayStreak}
    </span>
  );
}
