"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";
import { HABIT_CATEGORIES } from "@/lib/design-token";
import { CheckCircle2, Edit2, Trash2 } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { getLocalDateString } from "@/lib/date";

export default function HabitCard({ habit, userId, isChecked: initialChecked, onMilestone }) {
  const [pressing, setPressing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);

  // Hook into Zustand store
  const habits = useAppStore((state) => state.habits);
  const setHabits = useAppStore((state) => state.setHabits);
  const todayCheckIns = useAppStore((state) => state.todayCheckIns);
  const markCheckedIn = useAppStore((state) => state.markCheckedIn);
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);
  const showUndo = useAppStore((state) => state.showUndo);

  const isChecked = todayCheckIns[habit.id] ?? initialChecked;
  const category = Object.values(HABIT_CATEGORIES).find((c) => c.id === habit.category);
  const dotColor = category?.color ?? "#888780";
  // Use local date so users in non-UTC timezones don't get tomorrow's date
  const today = getLocalDateString();

  async function handleToggle(e) {
    if (e) e.stopPropagation();

    const newValue = !isChecked;
    setPressing(true);
    markCheckedIn(habit.id, newValue);
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

    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("check_ins").upsert(
        { habit_id: habit.id, user_id: userId, date: today, completed: newValue },
        { onConflict: "habit_id,date" }
      );
    } else {
      await db.queue.add({
        type: "UPSERT_CHECKIN",
        payload: { habitId: habit.id, userId, date: today, completed: newValue },
        createdAt: new Date().toISOString(),
      });
    }

    // Fire milestone callback if warranted
    if (newValue && newStreak) onMilestone?.(newStreak);
  }

  async function handleSaveEdit(e) {
    if (e) e.stopPropagation();
    if (!editName.trim()) return;

    showLoading("Saving habit...");
    const updatedName = editName.trim();

    // 1. Update IndexedDB
    await db.habits.update(habit.id, { name: updatedName });

    // 2. Update Zustand store
    const updatedHabits = habits.map((h) =>
      h.id === habit.id ? { ...h, name: updatedName } : h
    );
    setHabits(updatedHabits);

    // 3. Sync online or queue
    if (navigator.onLine) {
      const supabase = getSupabase();
      await supabase.from("habits").update({ name: updatedName }).eq("id", habit.id);
    } else {
      await db.queue.add({
        type: "UPDATE_HABIT",
        payload: { habitId: habit.id, name: updatedName },
        createdAt: new Date().toISOString(),
      });
    }

    hideLoading();
    setIsEditing(false);
  }

  async function handleDelete(e) {
    if (e) e.stopPropagation();

    showLoading("Deleting habit...");
    const habitId = habit.id;
    const originalHabits = [...habits];

    // Optimistically filter out from Zustand store
    setHabits(habits.filter((h) => h.id !== habitId));
    hideLoading();

    showUndo(
      `Deleted "${habit.name}"`,
      () => {
        // Undo: Restore to Zustand store
        setHabits(originalHabits);
      },
      async () => {
        // Dismiss: Permanently delete/archive
        await db.habits.update(habitId, { archived: true });

        if (navigator.onLine) {
          const supabase = getSupabase();
          await supabase.from("habits").update({ archived: true }).eq("id", habitId);
        } else {
          await db.queue.add({
            type: "ARCHIVE_HABIT",
            payload: { habitId },
            createdAt: new Date().toISOString(),
          });
        }
      }
    );
  }

  if (isEditing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-bento-card border-stryde-primary transition-all w-full"
      >
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit(e);
            if (e.key === "Escape") {
              setEditName(habit.name);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="flex-1 bg-bento-bg text-bento-text text-sm px-3 py-1.5 rounded-xl border border-bento-border focus:outline-none focus:border-stryde-primary min-w-0"
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleSaveEdit}
            disabled={!editName.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditName(habit.name);
              setIsEditing(false);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-bento-border text-bento-muted hover:text-bento-text hover:bg-bento-border transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-checked={isChecked}
      data-pressing={pressing}
      onClick={handleToggle}
      className="group/card flex items-center gap-3 cursor-pointer px-4 py-3 rounded-2xl border bg-bento-card border-bento-border transition-all data-checked:opacity-65 data-pressing:scale-[0.98] w-full min-h-[66px]"
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate text-bento-text transition-colors ${isChecked ? "line-through text-bento-muted" : ""}`}>
          {habit.name}
        </p>
        <p className="text-[11px] capitalize text-bento-muted">
          {habit.frequency} &middot; {habit.category} 
        </p>
      </div>

      {/* Action buttons (Edit & Delete) */}
      <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 md:opacity-0 max-md:opacity-75 transition-opacity duration-150 mr-1 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1.5 rounded-lg text-bento-muted hover:text-stryde-primary hover:bg-bento-border transition-colors"
          aria-label="Edit habit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-bento-muted hover:text-stryde-danger hover:bg-bento-border transition-colors"
          aria-label="Delete habit"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        onClick={handleToggle}
        aria-label={isChecked ? "Mark incomplete" : "Mark complete"}
        aria-pressed={isChecked}
        className={`w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${
          isChecked
            ? "text-green-500"
            : "border border-bento-border text-bento-muted"
        }`}
      >
        {isChecked ? (
          <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0" />
        ) : null}
      </button>
    </div>
  );
}