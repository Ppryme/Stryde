// src/components/streaks/StreakBadge.jsx
// ─────────────────────────────────────────────
// STREAK BADGE — shows current streak count
// Reads from IndexedDB (fast, offline-safe)
// Shows fire icon + streak number in amber pill
// ─────────────────────────────────────────────
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/db";

import { calculateOverallStreak } from "@/lib/streakUtils";

export default function StreakBadge({ habitId, userId, trigger }) {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    async function load() {
      if (habitId) {
        // Per-habit streak
        const record = await db.streaks.where("habitId").equals(habitId).first();
        setStreak(record?.currentStreak ?? 0);
      } else if (userId) {
        // Overall check-in completion streak
        const overall = await calculateOverallStreak(userId);
        setStreak(overall);
      }
    }
    load();
  }, [habitId, userId, trigger]);

  if (streak === null || streak === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 bg-stryde-fire-light text-stryde-fire-dark">
      <i className="ti ti-flame text-sm" aria-hidden="true" />
      {streak}
    </span>
  );
}
