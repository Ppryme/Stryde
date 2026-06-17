"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";
import { HABIT_CATEGORIES } from "@/lib/design-token";

export default function HabitCard({ habit, userId, isChecked: initialChecked }) {
  const [isChecked, setIsChecked] = useState(initialChecked);
  const [pressing, setPressing] = useState(false);

  const category = Object.values(HABIT_CATEGORIES).find((c) => c.id === habit.category);
  const dotColor = category?.color ?? "#888780";
  const today = new Date().toISOString().split("T")[0];

  async function handleToggle() {
    const newValue = !isChecked;

    setPressing(true);
    setIsChecked(newValue);
    setTimeout(() => setPressing(false), 150);

    const existing = await db.checkIns
      .where({ habitId: habit.id, userId, date: today })
      .first();

    if (existing) {
      await db.checkIns.update(existing.id, { completed: newValue, synced: false });
    } else {
      await db.checkIns.add({
        habitId: habit.id,
        userId,
        date: today,
        completed: newValue,
        synced: false,
        createdAt: new Date().toISOString(),
      });
    }

    await recalculateStreak(habit.id, userId);

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
      data-checked={isChecked}
      data-pressing={pressing}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-bento-card border-bento-border transition-all data-checked:opacity-65 data-pressing:scale-[0.98]"
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate text-bento-text ${isChecked ? "line-through" : ""}`}>
          {habit.name}
        </p>
        <p className="text-[11px] capitalize text-bento-muted">
          {habit.frequency} &middot; {habit.category}
        </p>
      </div>

      <button
        onClick={handleToggle}
        aria-label={isChecked ? "Mark incomplete" : "Mark complete"}
        aria-pressed={isChecked}
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isChecked
            ? "bg-stryde-success text-white"
            : "bg-transparent border border-bento-border text-bento-muted"
        }`}
      >
        {isChecked && <i className="ti ti-check text-sm" aria-hidden="true" />}
      </button>
    </div>
  );
}
