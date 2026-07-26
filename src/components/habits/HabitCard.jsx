"use client";

import { useState, memo, useCallback } from "react";
import { StreakRepository } from "@/repositories/streakRepository";
import { HABIT_CATEGORIES } from "@/lib/design-token";
import { CheckCircle2, Edit2, Trash2, Bell } from "lucide-react";
import useAppStore from "@/stores/useAppStore";
import { getLocalDateString } from "@/lib/date";
import { useHabit } from "@/hooks/useHabit";
import { CheckInRepository } from "@/repositories/checkInRepository";

function HabitCard({ habit, userId, isChecked: initialChecked, onMilestone, isLocked }) {
  const [pressing, setPressing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Inline edit state variables
  const [editName, setEditName] = useState(habit.name);
  const [editFrequency, setEditFrequency] = useState(habit.frequency || "daily");
  const [editReminders, setEditReminders] = useState(() =>
    (habit.reminder_time || habit.reminderTime || "").split(",").filter(Boolean)
  );

  // Sync edit state variables if parent habit updates
  // (done in the edit button handler to avoid setState-in-effect warnings)

  // Hook into Zustand store
  const habits = useAppStore((state) => state.habits);
  const setHabits = useAppStore((state) => state.setHabits);
  const todayCheckIns = useAppStore((state) => state.todayCheckIns);
  const markCheckedIn = useAppStore((state) => state.markCheckedIn);
  const showUndo = useAppStore((state) => state.showUndo);
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  const { updateHabit, archiveHabit, unarchiveHabit } = useHabit();

  const isChecked = todayCheckIns[habit.id] ?? initialChecked;
  const category = Object.values(HABIT_CATEGORIES).find((c) => c.id === habit.category);
  const dotColor = category?.color ?? "#888780";
  const today = getLocalDateString();

  const handleToggle = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (isLocked) return; // Do nothing if check-in is complete for the day

    const newValue = !isChecked;
    setPressing(true);
    markCheckedIn(habit.id, newValue);
    setTimeout(() => setPressing(false), 150);

    try {
      await CheckInRepository.upsertCheckIn({
        habitId: habit.id,
        userId,
        date: today,
        completed: newValue,
      });

      const { currentStreak } = await StreakRepository.updateStreak(habit.id, userId);

      // Fire milestone callback if warranted
      if (newValue && currentStreak) onMilestone?.(currentStreak);
    } catch (err) {
      console.error("Failed to toggle check-in:", err);
    }
  }, [isChecked, isLocked, habit.id, userId, today, markCheckedIn, onMilestone]);

  const handleSaveEdit = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!editName.trim()) return;

    showLoading("Saving habit...");
    const updatedName = editName.trim();
    const remindersStr = editReminders.filter((r) => r.trim() !== "").join(",");

    try {
      await updateHabit(habit.id, {
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
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save habit edit:", err);
    } finally {
      hideLoading();
    }
  }, [editName, editFrequency, editReminders, habit.id, habits, setHabits, updateHabit, hideLoading, showLoading]);

  const handleDelete = useCallback(async (e) => {
    if (e) e.stopPropagation();

    const habitId = habit.id;
    const originalHabits = [...habits];

    // 1. Optimistically remove from UI immediately
    setHabits(habits.filter((h) => h.id !== habitId));

    // 2. Archive in DB immediately — don't wait for Undo to time out
    await archiveHabit(habitId);

    showUndo(
      `Deleted "${habit.name}"`,
      async () => {
        // Undo: Restore in DB first, then restore UI
        await unarchiveHabit(habitId);
        setHabits(originalHabits);
      },
      () => {
        // Dismiss: Already archived, nothing more to do
      }
    );
  }, [habit.id, habit.name, habits, setHabits, showUndo, archiveHabit, unarchiveHabit]);

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

        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-bento-border/30 mt-1 shrink-0">
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
    <>
    <div
      data-checked={isChecked}
      data-pressing={pressing}
      onClick={handleToggle}
      className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border bg-bento-card border-bento-border transition-all w-full min-h-16.5 ${
        isLocked
          ? "cursor-default opacity-85"
          : "cursor-pointer hover:border-bento-border/80 data-pressing:scale-[0.98]"
      } ${isChecked ? "opacity-65" : ""}`}
    >
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: dotColor }}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate text-bento-text transition-colors ${isChecked ? "line-through text-bento-muted" : ""}`}>
          {habit.name}
        </p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <p className="text-[11px] capitalize text-bento-muted">
            {habit.frequency} &middot; {habit.category} 
          </p>
          {reminderList.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-bento-muted flex-wrap">
              <Bell className="w-3 h-3 text-green-500 shrink-0" />
              <span>{reminderList.join(" · ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (Edit & Delete) */}
      
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 max-md:opacity-75 transition-opacity duration-150 mr-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Refresh edit fields from the latest habit data before entering edit mode
              setEditName(habit.name);
              setEditFrequency(habit.frequency || "daily");
              setEditReminders(
                (habit.reminder_time || habit.reminderTime || "").split(",").filter(Boolean)
              );
              setIsEditing(true);
            }}
            className="p-1.5 rounded-lg text-bento-muted hover:text-white hover:bg-bento-border transition-colors"
            aria-label="Edit habit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-white hover:text-white hover:bg-bento-border transition-colors"
            aria-label="Delete habit"
          >
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
   

      <button
        onClick={handleToggle}
        disabled={isLocked}
        aria-label={isChecked ? "Mark incomplete" : "Mark complete"}
        aria-pressed={isChecked}
        className={`w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${
          isChecked
            ? "text-green-500"
            : "border border-bento-border text-bento-muted"
        }`}
      >
        {isChecked ? (
          <CheckCircle2 className="w-7 h-7 text-green-500 shrink-0" />
        ) : null}
      </button>
    </div>


    </>
    
   
  );
}

export default memo(HabitCard);