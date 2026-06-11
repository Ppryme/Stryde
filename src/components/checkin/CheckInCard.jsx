// src/components/checkin/CheckInCard.jsx
// ─────────────────────────────────────────────
// CHECK-IN CARD — large tap target for daily check-in
// Tapping completes / uncompletes the habit
// Writes to IndexedDB first, then syncs to Supabase
// ─────────────────────────────────────────────
"use client";
import { useState } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";

export default function CheckInCard({ habit, userId, today, isChecked, onToggle, onMilestone }) {
  const [pressing, setPressing] = useState(false);

  async function handleTap() {
    const newValue = !isChecked;

    // 1. Instant visual feedback
    setPressing(true);
    onToggle(habit.id, newValue); // update parent state immediately
    setTimeout(() => setPressing(false), 150);

    // 2. Write to IndexedDB
    const existing = await db.checkIns
      .where({ habitId: habit.id, userId, date: today })
      .first();

    if (existing) {
      await db.checkIns.update(existing.id, { completed: newValue, synced: false });
    } else {
      await db.checkIns.add({
        habitId: habit.id, userId, date: today,
        completed: newValue, synced: false,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Recalculate streak + check for milestones
    const newStreak = await recalculateStreak(habit.id, userId);
    if (newValue && newStreak) onMilestone?.(newStreak);

    // 4. Sync to Supabase if online
    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("check_ins").upsert(
        { habit_id: habit.id, user_id: userId, date: today, completed: newValue },
        { onConflict: "habit_id,date" }
      );
    }
  }

  return (
    <button
      onClick={handleTap}
      aria-pressed={isChecked}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all"
      style={{
        minHeight:  72,
        background: isChecked ? "var(--color--stryde-success-light)" : "var(--color-bento-card)",
        border:     `1px solid ${isChecked ? "var(--color--stryde-success)" : "var(--color-bento-border)"}`,
        transform:  pressing ? "scale(0.97)" : "scale(1)",
        transition: "transform 0.1s ease, background 0.2s ease",
      }}
    >
      {/* Circle checkbox */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: isChecked ? "var(--color--stryde-success)" : "transparent",
          border:     isChecked ? "none" : "1.5px solid var(--color-bento-border)",
          color:      isChecked ? "#fff" : "var(--color-bento-muted)",
        }}
      >
        {isChecked && <i className="ti ti-check text-base" aria-hidden="true" />}
      </div>

      {/* Habit name */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{
            color:          isChecked ? "var(--color--stryde-success-dark)" : "var(--color-bento-text)",
            textDecoration: isChecked ? "line-through" : "none",
          }}
        >
          {habit.name}
        </p>
        <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--color-bento-muted)" }}>
          {habit.category}
        </p>
      </div>

      {/* Tap hint on unchecked */}
      {!isChecked && (
        <span className="text-xs flex-shrink-0" style={{ color: "var(--color-bento-muted)" }}>
          Tap to complete
        </span>
      )}
    </button>
  );
}
