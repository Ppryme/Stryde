// src/components/habits/HabitCard.jsx
// ─────────────────────────────────────────────
// HABIT CARD — single habit row
// Shows: category dot, name, frequency, streak badge, check button
// Tapping the check button toggles check-in (optimistic update)
// ─────────────────────────────────────────────
"use client";
import { useState } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";
import { HABIT_CATEGORIES } from "@/lib/design-token";

export default function HabitCard({ habit, userId, isChecked: initialChecked }) {
  const [isChecked, setIsChecked] = useState(initialChecked);
  const [pressing,  setPressing]  = useState(false);

  const category = Object.values(HABIT_CATEGORIES).find((c) => c.id === habit.category);
  const dotColor = category?.color ?? "#888780";
  const today    = new Date().toISOString().split("T")[0];

  async function handleToggle() {
    const newValue = !isChecked;

    // 1. Instant UI feedback
    setPressing(true);
    setIsChecked(newValue);
    setTimeout(() => setPressing(false), 150);

    // 2. Write to IndexedDB (offline-safe)
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

    // 3. Recalculate streak in IndexedDB
    await recalculateStreak(habit.id, userId);

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
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-opacity"
      style={{
        background: "var(--color-bento-card)",
        border:     "1px solid var(--color-bento-border)",
        opacity:    isChecked ? 0.65 : 1,
        transform:  pressing ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.1s ease, opacity 0.2s",
      }}
    >
      {/* Category color dot */}
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />

      {/* Habit name + meta */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{
            color:          "var(--color-bento-text)",
            textDecoration: isChecked ? "line-through" : "none",
          }}
        >
          {habit.name}
        </p>
        <p
          className="text-[11px] capitalize"
          style={{ color: "var(--color-bento-muted)" }}
        >
          {habit.frequency} · {habit.category}
        </p>
      </div>

      {/* Check button */}
      <button
        onClick={handleToggle}
        aria-label={isChecked ? "Mark incomplete" : "Mark complete"}
        aria-pressed={isChecked}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background:   isChecked ? "var(--color--stryde-success)" : "transparent",
          border:       isChecked ? "none" : "1.5px solid var(--color-bento-border)",
          color:        isChecked ? "#fff" : "var(--color-bento-muted)",
        }}
      >
        {isChecked && <i className="ti ti-check text-sm" aria-hidden="true" />}
      </button>
    </div>
  );
}
