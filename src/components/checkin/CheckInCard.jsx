"use client";

import { useState, useEffect, memo, useCallback } from "react";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { recalculateStreak } from "@/lib/streakUtils";
import { CheckCircle2, Edit2, Trash2, Bell } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { getLocalDateString } from "@/lib/date";

function CheckInCard({ habit, userId, today, isChecked, onToggle, onMilestone, isLocked }) {
  const [pressing, setPressing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Inline edit state variables
  const [editName, setEditName] = useState(habit.name);
  const [editFrequency, setEditFrequency] = useState(habit.frequency || "daily");
  const [editReminders, setEditReminders] = useState(() =>
    (habit.reminder_time || habit.reminderTime || "").split(",").filter(Boolean)
  );

  // Sync edit state variables if parent habit updates
  useEffect(() => {
    setEditName(habit.name);
    setEditFrequency(habit.frequency || "daily");
    setEditReminders((habit.reminder_time || habit.reminderTime || "").split(",").filter(Boolean));
  }, [habit]);

  // Hook into Zustand store to handle editing & deleting the habit
  const habits = useAppStore((state) => state.habits);
  const setHabits = useAppStore((state) => state.setHabits);
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);
  const showUndo = useAppStore((state) => state.showUndo);

  const handleTap = useCallback(async () => {
    if (isLocked) return; // Do nothing if locked (all checked off for the day)

    const newValue = !isChecked;
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
  }, [isChecked, isLocked, habit.id, userId, onToggle, onMilestone]);

  const handleSaveEdit = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!editName.trim()) return;

    showLoading("Saving habit...");
    const updatedName = editName.trim();
    const remindersStr = editReminders.filter((r) => r.trim() !== "").join(",");

    try {
      // 1. Update IndexedDB
      await db.habits.update(habit.id, {
        name: updatedName,
        frequency: editFrequency,
        reminderTime: remindersStr,
      });

      // 2. Update Zustand store
      const updatedHabits = habits.map((h) =>
        h.id === habit.id
          ? { ...h, name: updatedName, frequency: editFrequency, reminder_time: remindersStr }
          : h
      );
      setHabits(updatedHabits);

      // 3. Sync online or queue
      if (navigator.onLine) {
        const supabase = getSupabase();
        await supabase
          .from("habits")
          .update({
            name: updatedName,
            frequency: editFrequency,
            reminder_time: remindersStr,
          })
          .eq("id", habit.id);
      } else {
        await db.queue.add({
          type: "UPDATE_HABIT",
          payload: {
            habitId: habit.id,
            name: updatedName,
            frequency: editFrequency,
            reminderTime: remindersStr,
          },
          createdAt: new Date().toISOString(),
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save habit edit:", err);
    } finally {
      hideLoading();
    }
  }, [editName, editFrequency, editReminders, habit.id, habits, setHabits, showLoading, hideLoading]);

  const handleDelete = useCallback(async (e) => {
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
  }, [habit.id, habit.name, habits, setHabits, showLoading, hideLoading, showUndo]);

  if (isEditing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-3.5 p-4 rounded-2xl border bg-bento-card border-stryde-primary transition-all w-full animate-fadeIn"
      >
        <div>
          <label className="text-[10px] font-bold text-bento-muted uppercase tracking-wider block mb-1">
            Habit Name
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-bento-bg text-bento-text text-sm px-3.5 py-2 rounded-xl border border-bento-border focus:outline-none focus:border-stryde-primary min-w-0"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-bento-muted uppercase tracking-wider block mb-1">
            Frequency
          </label>
          <div className="flex gap-2">
            {["daily", "weekly"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setEditFrequency(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                  editFrequency === f
                    ? "bg-stryde-primary text-white border-stryde-primary"
                    : "bg-transparent border-bento-border text-bento-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-bento-muted uppercase tracking-wider">
              Reminder Times (Max 4)
            </label>
            {editReminders.length < 4 && (
              <button
                type="button"
                onClick={() => setEditReminders([...editReminders, "08:00"])}
                className="text-[10px] text-stryde-primary font-bold hover:underline"
              >
                + Add Time
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {editReminders.map((time, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-bento-bg border border-bento-border rounded-xl px-2 py-1">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    const updated = [...editReminders];
                    updated[idx] = e.target.value;
                    setEditReminders(updated);
                  }}
                  className="bg-transparent text-xs text-bento-text outline-none p-0.5"
                />
                <button
                  type="button"
                  onClick={() => setEditReminders(editReminders.filter((_, i) => i !== idx))}
                  className="text-bento-muted hover:text-stryde-danger text-xs font-bold px-1"
                >
                  &times;
                </button>
              </div>
            ))}
            {editReminders.length === 0 && (
              <p className="text-[11px] text-bento-muted italic">No reminders set.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-bento-border/30 mt-1 flex-shrink-0">
          <button
            onClick={handleSaveEdit}
            disabled={!editName.trim()}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditName(habit.name);
              setEditFrequency(habit.frequency || "daily");
              setEditReminders((habit.reminder_time || habit.reminderTime || "").split(",").filter(Boolean));
              setIsEditing(false);
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-bento-border text-bento-muted hover:text-bento-text hover:bg-bento-border transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const reminderList = (habit.reminder_time || habit.reminderTime || "").split(",").filter(Boolean);

  return (
    <div
      onClick={handleTap}
      data-checked={isChecked}
      data-pressing={pressing}
      className={`group/card w-full min-h-[72px] flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-all bg-bento-card border-bento-border ${
        isLocked
          ? "cursor-default opacity-85"
          : "cursor-pointer hover:border-bento-border/80 data-pressing:scale-[0.97]"
      } ${isChecked ? "opacity-65" : ""}`}
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
        <div className="flex flex-col gap-0.5 mt-0.5">
          <p className="text-xs capitalize text-bento-muted">
            {habit.frequency} &middot; {habit.category}
          </p>
          {reminderList.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-bento-muted flex-wrap">
              <Bell className="w-3 h-3 text-bento-muted flex-shrink-0" />
              <span>{reminderList.join(" · ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (Edit & Delete) - Hidden if check-in is complete (isLocked) */}
      {!isLocked && (
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
      )}

      {!isChecked && !isLocked && (
        <span className="text-xs flex-shrink-0 text-bento-muted group-hover/card:hidden">
          Tap to complete
        </span>
      )}
    </div>
  );
}

export default memo(CheckInCard);