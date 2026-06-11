// src/components/streaks/StreakBadge.jsx
// ─────────────────────────────────────────────
// STREAK BADGE — shows current streak count
// Reads from IndexedDB (fast, offline-safe)
// Shows fire icon + streak number in amber pill
// ─────────────────────────────────────────────
"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/db";

export default function StreakBadge({ habitId, userId }) {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    async function load() {
      if (habitId) {
        // Per-habit streak
        const record = await db.streaks.where("habitId").equals(habitId).first();
        setStreak(record?.currentStreak ?? 0);
      } else if (userId) {
        // Overall best streak across all habits
        const allStreaks = await db.streaks.toArray();
        const best = allStreaks.reduce((max, s) => Math.max(max, s.currentStreak), 0);
        setStreak(best);
      }
    }
    load();
  }, [habitId, userId]);

  if (streak === null || streak === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
      style={{ background: "var(--color--stryde-fire-light)", color: "#633806" }}
    >
      <i className="ti ti-flame text-sm" aria-hidden="true" />
      {streak}
    </span>
  );
}
