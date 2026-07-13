"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";
import { CheckCircle2 } from "lucide-react";

export default function CheckInCard({ habit, userId, today, isChecked, onToggle, onMilestone }) {
  const [pressing, setPressing] = useState(false);

  async function handleTap() {
    const newValue = !isChecked;

    setPressing(true);
    onToggle(habit.id, newValue); // Triggers parent updates instantly
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
      className="w-full min-h-[72px] flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all bg-bento-card border-bento-border data-checked:opacity-65 data-pressing:scale-[0.97]"
    >
      {/* Lucide CheckCircle2 for high-end look & consistency with HabitCard */}
      <div className="flex-shrink-0 transition-all">
        {isChecked ? (
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-transparent border border-bento-border" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Adjusted Checked colors for premium look against Bento dark styling */}
        <p
          className={`text-sm font-semibold transition-colors ${
            isChecked ? "text-bento-muted line-through" : "text-bento-text"
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