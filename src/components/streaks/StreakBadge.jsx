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

export default function StreakBadge({ userId, streak: streakProp, trigger }) {
  const { streak: hookStreak, isLoading, refresh } = useStreak(streakProp === undefined ? userId : null);

  useEffect(() => {
    if (trigger !== undefined && streakProp === undefined && userId) {
      refresh();
    }
  }, [trigger, streakProp, userId, refresh]);

  const displayStreak = streakProp !== undefined ? streakProp : hookStreak;

  // While loading (and no direct streakProp provided), render nothing to avoid flash of "0".
  if (isLoading && streakProp === undefined) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 bg-stryde-fire-light text-stryde-fire-dark">
      <Flame className="w-3.5 h-3.5" aria-hidden="true" />
      {displayStreak}
    </span>
  );
}
