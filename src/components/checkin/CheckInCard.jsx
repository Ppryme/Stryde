"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";

export default function CheckInCard({ habit, userId, today, isChecked, onToggle, onMilestone }) {
  const [pressing, setPressing] = useState(false);

  async function handleTap() {
    const newValue = !isChecked;

    setPressing(true);
    onToggle(habit.id, newValue);
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

    const newStreak = await recalculateStreak(habit.id, userId);
    if (newValue && newStreak) onMilestone?.(newStreak);

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
      aria-label={isChecked ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`}
      aria-pressed={isChecked}
      data-checked={isChecked}
      data-pressing={pressing}
      className="w-full min-h-[72px] flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all bg-bento-card border-bento-border data-checked:bg-stryde-success-light data-checked:border-stryde-success data-pressing:scale-[0.97]"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isChecked
            ? "bg-stryde-success text-white"
            : "bg-transparent border border-bento-border text-bento-muted"
        }`}
      >
        {isChecked && <i className="ti ti-check text-base" aria-hidden="true" />}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            isChecked ? "text-stryde-success-dark line-through" : "text-bento-text"
          }`}
        >
          {habit.name}
        </p>
        <p className="text-xs mt-0.5 capitalize text-bento-muted">
          {habit.category}
        </p>
      </div>

      {!isChecked && (
        <span className="text-xs flex-shrink-0 text-bento-muted">
          Tap to complete
        </span>
      )}
    </button>
  );
}
