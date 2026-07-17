"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";
import { CheckCircle2, Edit2, Trash2 } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { getLocalDateString } from "@/lib/date";

export default function CheckInCard({ habit, userId, today, isChecked, onToggle, onMilestone }) {
  const [pressing, setPressing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);

  // Hook into Zustand store to handle editing & deleting the habit
  const habits = useAppStore((state) => state.habits);
  const setHabits = useAppStore((state) => state.setHabits);
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);
  const showUndo = useAppStore((state) => state.showUndo);

  async function handleTap() {
    const newValue = !isChecked;
    // Derive today on the client from the local clock — never trust the
    // server-passed `today` prop for the write key, because the server runs
    // in its own timezone which may differ from the user's device.
    const clientToday = getLocalDateString();

    setPressing(true);
    onToggle(habit.id, newValue); // Triggers parent updates instantly
    setTimeout(() => setPressing(false), 150);

    try {
      const existing = await db.checkIns
        .where({ habitId: habit.id, userId, date: clientToday })
        .first();

      if (existing) {
        await db.checkIns.update(existing.id, { completed: newValue, synced: false });
      } else {
        await db.checkIns.add({
          habitId: habit.id,
          userId,
          date: clientToday,
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
          { habit_id: habit.id, user_id: userId, date: clientToday, completed: newValue },
          { onConflict: "habit_id,date" }
        );
      } else {
        await db.queue.add({
          type: "UPSERT_CHECKIN",
          payload: { habitId: habit.id, userId, date: clientToday, completed: newValue },
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to toggle check-in:", err);
    }
  }

  async function handleSaveEdit(e) {
    if (e) e.stopPropagation();
    if (!editName.trim()) return;

    showLoading("Saving habit...");
    const updatedName = editName.trim();

    try {
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
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save habit edit:", err);
    } finally {
      hideLoading();
    }
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
        try {
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
        } catch (err) {
          console.error("Failed to delete habit:", err);
        }
      }
    );
  }

  if (isEditing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-bento-card border-stryde-primary transition-all w-full min-h-[72px]"
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
      onClick={handleTap}
      data-checked={isChecked}
      data-pressing={pressing}
      className="group/card w-full min-h-[72px] flex items-center gap-4 px-5 py-4 rounded-2xl border text-left cursor-pointer transition-all bg-bento-card border-bento-border data-checked:opacity-65 data-pressing:scale-[0.97]"
    >
      <div className="flex-shrink-0 transition-all">
        {isChecked ? (
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-transparent border border-bento-border" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold transition-colors truncate ${
            isChecked ? "text-bento-muted line-through" : "text-bento-text"
          }`}
        >
          {habit.name}
        </p>
        <p className="text-xs mt-0.5 capitalize text-bento-muted">
          {habit.category}
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

      {!isChecked && (
        <span className="text-xs flex-shrink-0 text-bento-muted group-hover/card:hidden">
          Tap to complete
        </span>
      )}
    </div>
  );
}