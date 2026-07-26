"use client";

import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGoal } from "@/hooks/useGoal";
import Badge from "@/components/ui/badge";
import useAppStore from "@/stores/useAppStore";
import {
  parseGoal,
  getStreak,
  evaluateGoalStatus,
  calculateProgress,
  getDaysDifference,
} from "@/lib/goalUtils";
import { getLocalDateString, formatDisplayDate } from "@/lib/date";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  RotateCcw,
  Archive,
  ArrowRight,
  Trash2,
  Pencil,
  Plus,
  X,
} from "lucide-react";

const STATUS_VARIANT = {
  active: "info",
  completed: "success",
  "almost-there": "warning",
  missed: "danger",
  archived: "info",
};

const STATUS_LABEL = {
  active: "Active",
  completed: "Completed",
  "almost-there": "Almost There",
  missed: "Missed",
  archived: "Archived",
};

function GoalCard({ goal }) {
  const router = useRouter();
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  const { updateGoal, deleteGoal } = useGoal();

  // Local goal state for smooth, instant optimistic updates
  const [localGoal, setLocalGoal] = useState(goal);
  const [prevGoalProp, setPrevGoalProp] = useState(goal);
  if (goal !== prevGoalProp) {
    setPrevGoalProp(goal);
    setLocalGoal(goal);
  }

  const [expanded, setExpanded] = useState(false);
  const [extending, setExtending] = useState(false);
  const [newTargetDate, setNewTargetDate] = useState("");
  const [error, setError] = useState("");

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editTasks, setEditTasks] = useState([]);
  const [editReminders, setEditReminders] = useState([]);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const todayStr = getLocalDateString();

  // Memoize parsed goal data based on localGoal
  const parsedGoal = useMemo(
    () => parseGoal(localGoal),
    [localGoal]
  );
  const { tasks, reminders, completionHistory, createdAtDate } = parsedGoal;

  // Optimistic overlay: null means "use server data"; set on task toggle for instant UI feedback.
  // We use the React-documented "setState during render" pattern to reset the overlay when the
  // server sends a new description — no useEffect needed, no cascading re-render.
  const [optimisticState, setOptimisticState] = useState({
    history: null,
    forDescription: localGoal.description,
  });

  // If the server's description changed AND it differs from what we optimistically wrote,
  // reset the overlay.  Calling setState during render is intentional here per React docs:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (
    optimisticState.forDescription !== localGoal.description &&
    optimisticState.history !== null
  ) {
    setOptimisticState({ history: null, forDescription: localGoal.description });
  }

  const optimisticHistory =
    optimisticState.forDescription === localGoal.description
      ? optimisticState.history
      : null;

  // localHistory is the server-parsed history, overlaid with any optimistic update.
  const localHistory = optimisticHistory ?? completionHistory;

  // Stable memoised slice of today's completions so useCallback deps don't change every render.
  const todayCompletions = useMemo(
    () => localHistory[todayStr] ?? [],
    [localHistory, todayStr]
  );
  const completedTodayCount = todayCompletions.length;
  const totalTasksCount = tasks.length;

  const totalDays = Math.max(1, getDaysDifference(createdAtDate, localGoal.target_date) + 1);
  const completedDaysCount = Object.keys(localHistory).filter(
    (d) => (localHistory[d] ?? []).length === totalTasksCount && totalTasksCount > 0
  ).length;

  const daysRemaining = Math.max(0, getDaysDifference(todayStr, localGoal.target_date));
  const streak = getStreak(localHistory, totalTasksCount, createdAtDate);

  // Auto-evaluate goal status when deadline or completion changes
  useEffect(() => {
    async function autoEvaluate() {
      if (localGoal.status === "archived") return;
      const evaluated = evaluateGoalStatus(localGoal);
      if (evaluated !== localGoal.status) {
        setLocalGoal((prev) => ({ ...prev, status: evaluated }));
        await updateGoal(localGoal.id, { status: evaluated });
      }
    }
    autoEvaluate();
  }, [localGoal.id, localGoal.status, localGoal.target_date, localGoal.description, updateGoal, setLocalGoal, localGoal]);

  // Toggle task completion without collapsing the card
  const toggleTask = useCallback(
    async (taskId, e) => {
      if (e) e.stopPropagation();

      let newDayCompletions = [];
      if (todayCompletions.includes(taskId)) {
        newDayCompletions = todayCompletions.filter((id) => id !== taskId);
      } else {
        newDayCompletions = [...todayCompletions, taskId];
      }

      const newHistory = {
        ...localHistory,
        [todayStr]: newDayCompletions,
      };

      const newDescription = JSON.stringify({
        tasks,
        reminders,
        completion_history: newHistory,
        created_at_date: createdAtDate,
        finished_date: null,
      });

      const tempGoal = { ...localGoal, description: newDescription };
      const newProgress = calculateProgress(tempGoal);
      const newStatus = evaluateGoalStatus({ ...tempGoal, progress_pct: newProgress });

      // Optimistically update local state immediately (no useEffect needed)
      setOptimisticState({ history: newHistory, forDescription: localGoal.description });
      setLocalGoal((prev) => ({
        ...prev,
        description: newDescription,
        progress_pct: newProgress,
        status: newStatus,
      }));

      try {
        await updateGoal(localGoal.id, {
          description: newDescription,
          progress_pct: newProgress,
          status: newStatus,
        });
      } catch (err) {
        console.error("Failed to toggle goal task:", err);
        // Rollback: discard optimistic overlay so server data shows again
        setOptimisticState({ history: null, forDescription: localGoal.description });
      }
    },
    [
      todayCompletions,
      localHistory,
      todayStr,
      tasks,
      reminders,
      createdAtDate,
      localGoal,
      updateGoal,
      setOptimisticState,
      setLocalGoal,
    ]
  );

  const handleDelete = useCallback(
    async (e) => {
      if (e) e.stopPropagation();
      if (!confirm("Are you sure you want to delete this goal? This cannot be undone.")) return;

      showLoading("Deleting goal...");
      try {
        const success = await deleteGoal(localGoal.id);
        if (!success) {
          alert("Failed to delete goal. Try again.");
        } else {
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to delete goal:", err);
      } finally {
        hideLoading();
      }
    },
    [localGoal.id, router, showLoading, hideLoading, deleteGoal]
  );

  // Enter Edit Mode
  const startEditing = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      const parsed = parseGoal(localGoal);
      setEditTitle(localGoal.title);
      setEditTargetDate(localGoal.target_date);
      setEditTasks(parsed.tasks.map((t) => ({ ...t })));
      setEditReminders([...parsed.reminders]);
      setEditError("");
      setIsEditing(true);
    },
    [localGoal, setEditTitle, setEditTargetDate, setEditTasks, setEditReminders, setEditError, setIsEditing]
  );

  // Edit Handlers for Task & Reminders
  const addEditTask = () => {
    setEditTasks([...editTasks, { id: `task-${Date.now()}-${Math.random()}`, name: "" }]);
  };

  const removeEditTask = (id) => {
    if (editTasks.length === 1) {
      setEditError("A goal must have at least one task.");
      return;
    }
    setEditTasks(editTasks.filter((t) => t.id !== id));
    setEditError("");
  };

  const updateEditTaskName = (id, val) => {
    setEditTasks(editTasks.map((t) => (t.id === id ? { ...t, name: val } : t)));
    setEditError("");
  };

  const addEditReminder = () => {
    setEditReminders([...editReminders, "08:00"]);
  };

  const removeEditReminder = (idx) => {
    setEditReminders(editReminders.filter((_, i) => i !== idx));
  };

  const updateEditReminder = (idx, val) => {
    setEditReminders(editReminders.map((r, i) => (i === idx ? val : r)));
  };

  // Save Edits
  const handleSaveEdit = async (e) => {
    if (e) e.stopPropagation();

    if (!editTitle.trim()) {
      setEditError("Please enter a goal title.");
      return;
    }

    const validTasks = editTasks.filter((t) => t.name.trim() !== "");
    if (validTasks.length === 0) {
      setEditError("Add at least one goal task.");
      return;
    }

    if (!editTargetDate) {
      setEditError("Target date is required.");
      return;
    }

    setSavingEdit(true);
    setEditError("");

    try {
      const finalTasks = validTasks.map((t, idx) => ({
        id: t.id ? t.id : `task-${Date.now()}-${idx}`,
        name: t.name.trim(),
      }));

      const newDescription = JSON.stringify({
        tasks: finalTasks,
        reminders: editReminders.filter((r) => r.trim() !== ""),
        completion_history: localHistory,
        created_at_date: createdAtDate,
        finished_date: null,
      });

      const tempGoal = {
        ...localGoal,
        title: editTitle.trim(),
        target_date: editTargetDate,
        description: newDescription,
      };

      const newProgress = calculateProgress(tempGoal);
      const newStatus = evaluateGoalStatus({ ...tempGoal, progress_pct: newProgress });

      await updateGoal(localGoal.id, {
        title: editTitle.trim(),
        target_date: editTargetDate,
        description: newDescription,
        progress_pct: newProgress,
        status: newStatus,
      });

      setLocalGoal((prev) => ({
        ...prev,
        title: editTitle.trim(),
        target_date: editTargetDate,
        description: newDescription,
        progress_pct: newProgress,
        status: newStatus,
      }));

      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save goal edits:", err);
      setEditError("Failed to save updates. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveExtension = useCallback(async () => {
    if (!newTargetDate) return;
    if (newTargetDate <= todayStr) {
      setError("New target date must be in the future.");
      return;
    }

    showLoading("Updating goal deadline...");
    setError("");

    try {
      const tempGoal = { ...localGoal, target_date: newTargetDate, status: "active" };
      const newProgress = calculateProgress(tempGoal);

      const success = await updateGoal(localGoal.id, {
        target_date: newTargetDate,
        progress_pct: newProgress,
        status: "active",
      });

      if (!success) {
        setError("Failed to extend deadline.");
      } else {
        setLocalGoal((prev) => ({
          ...prev,
          target_date: newTargetDate,
          progress_pct: newProgress,
          status: "active",
        }));
        setExtending(false);
      }
    } catch (err) {
      console.error("Error extending target date:", err);
      setError("An unexpected error occurred.");
    } finally {
      hideLoading();
    }
  }, [newTargetDate, todayStr, localGoal, updateGoal, showLoading, hideLoading, setError, setLocalGoal, setExtending]);

  const handleRestart = useCallback(async () => {
    if (!confirm("Restart this goal? All task completion history will be reset.")) return;

    showLoading("Restarting goal...");
    const { tasks: currentTasks, reminders: currentReminders } = parseGoal(localGoal);

    const newDescription = JSON.stringify({
      tasks: currentTasks,
      reminders: currentReminders,
      completion_history: {},
      created_at_date: todayStr,
      finished_date: null,
    });

    try {
      await updateGoal(localGoal.id, {
        description: newDescription,
        progress_pct: 0,
        status: "active",
      });

      setLocalGoal((prev) => ({
        ...prev,
        description: newDescription,
        progress_pct: 0,
        status: "active",
      }));
      // Clear the optimistic overlay so the reset empty history is shown immediately
      setOptimisticState({ history: {}, forDescription: newDescription });
    } catch (err) {
      console.error("Failed to restart goal:", err);
    } finally {
      hideLoading();
    }
  }, [localGoal, todayStr, updateGoal, showLoading, hideLoading, setLocalGoal, setOptimisticState]);

  const handleArchive = useCallback(async () => {
    if (!confirm("Archive this goal? It will be moved to history.")) return;

    try {
      await updateGoal(localGoal.id, { status: "archived" });
      setLocalGoal((prev) => ({ ...prev, status: "archived" }));
    } catch (err) {
      console.error("Failed to archive goal:", err);
    } finally {
      hideLoading();
    }
  }, [localGoal.id, updateGoal, hideLoading, setLocalGoal]);

  const variant = STATUS_VARIANT[localGoal.status] ?? "info";
  const label = STATUS_LABEL[localGoal.status] ?? localGoal.status;

  // Render Inline Edit Mode Form
  if (isEditing) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="p-5 rounded-2xl bg-bento-card border border-stryde-primary/50 shadow-lg flex flex-col gap-4 animate-fadeIn"
      >
        <div className="flex items-center justify-between border-b border-bento-border/50 pb-2">
          <h3 className="text-sm font-bold text-bento-text flex items-center gap-2">
            <Pencil className="w-4 h-4 text-stryde-primary" /> Edit Goal
          </h3>
          <button
            onClick={() => setIsEditing(false)}
            className="p-1 rounded-lg text-bento-muted hover:bg-bento-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Target Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-bento-muted uppercase tracking-wider block mb-1">
              Goal Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-bento-bg border border-bento-border text-bento-text outline-none focus:border-stryde-primary transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-bento-muted uppercase tracking-wider block mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={editTargetDate}
              onChange={(e) => setEditTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-bento-bg border border-bento-border text-bento-text outline-none focus:border-stryde-primary transition-all"
            />
          </div>
        </div>

        {/* Goal Tasks Editor */}
        <div className="p-3.5 rounded-xl bg-bento-bg border border-bento-border/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-bento-muted">
              Goal Tasks
            </span>
            <button
              type="button"
              onClick={addEditTask}
              className="p-1 rounded-md bg-bento-card border border-bento-border text-bento-muted hover:text-stryde-primary transition-all text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {editTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => updateEditTaskName(t.id, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-bento-card border border-bento-border text-bento-text outline-none focus:border-stryde-primary"
                />
                <button
                  type="button"
                  onClick={() => removeEditTask(t.id)}
                  className="p-1.5 text-bento-muted hover:text-stryde-danger transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Reminders Editor */}
        <div className="p-3.5 rounded-xl bg-bento-bg border border-bento-border/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-bento-muted">
              Reminder Times
            </span>
            <button
              type="button"
              onClick={addEditReminder}
              className="p-1 rounded-md bg-bento-card border border-bento-border text-bento-muted hover:text-stryde-primary transition-all text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Time
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {editReminders.map((time, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-bento-card border border-bento-border rounded-lg px-2 py-1">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => updateEditReminder(idx, e.target.value)}
                  className="bg-transparent text-xs text-bento-text outline-none w-full"
                />
                <button
                  type="button"
                  onClick={() => removeEditReminder(idx)}
                  className="p-1 text-bento-muted hover:text-stryde-danger transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {editReminders.length === 0 && (
              <span className="text-xs text-bento-muted col-span-full py-1">No reminders configured.</span>
            )}
          </div>
        </div>

        {editError && <p className="text-xs text-stryde-danger font-medium">{editError}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-bento-border/50">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-bento-border text-bento-muted hover:bg-bento-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={savingEdit}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors disabled:opacity-50"
          >
            {savingEdit ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        if (localGoal.status === "active") setExpanded((prev) => !prev);
      }}
      className={`p-4 rounded-2xl bg-bento-card border transition-all duration-200 select-none ${
        localGoal.status === "active" ? "cursor-pointer hover:border-bento-border/80" : "border-bento-border/50"
      } border-bento-border`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-bento-text truncate">
            {localGoal.title}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-bento-muted">
            <span suppressHydrationWarning className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-bento-muted" />
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Deadline today"}
            </span>
            {reminders && reminders.length > 0 && (
              <span className="flex items-center gap-1 text-stryde-primary/90 font-medium">
                <Clock className="w-3 h-3 text-stryde-primary" />
                {reminders.join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={variant} className="capitalize">
            {label}
          </Badge>
          <button
            onClick={startEditing}
            className="p-1.5 rounded-lg text-bento-muted hover:text-stryde-primary hover:bg-bento-border transition-colors cursor-pointer"
            aria-label="Edit goal"
            title="Edit Goal"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-bento-muted hover:text-stryde-danger hover:bg-bento-border transition-colors cursor-pointer"
            aria-label="Delete goal"
            title="Delete Goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {localGoal.status === "active" && (
            <span className="text-bento-muted">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar & percentage */}
      <div className="my-3">
        <div className="h-2 rounded-full overflow-hidden bg-bento-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              localGoal.status === "missed"
                ? "bg-stryde-danger"
                : localGoal.status === "completed"
                ? "bg-stryde-success"
                : "bg-stryde-primary"
            }`}
            style={{ width: `${localGoal.progress_pct ?? 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-bento-muted mt-1.5 font-medium">
          <span>{localGoal.progress_pct ?? 0}% complete</span>
          <span suppressHydrationWarning>{completedDaysCount} / {totalDays} days completed</span>
        </div>
      </div>

      {/* Daily Metrics */}
      {localGoal.status === "active" && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-bento-border/30 text-xs">
          <div className="flex items-center gap-1.5 text-bento-text">
            <Flame className="w-4 h-4 text-stryde-fire" />
            <div>
              <p className="text-[10px] text-bento-muted">Current Streak</p>
              <p suppressHydrationWarning className="font-bold">{streak} {streak === 1 ? "day" : "days"}</p>
            </div>
          </div>
        </div>
      )}

      {/* History details */}
      {localGoal.status !== "active" && (
        <div className="mt-3 pt-3 border-t border-bento-border/30 grid grid-cols-2 gap-2 text-[11px] text-bento-muted">
          <span suppressHydrationWarning>Target Date: {formatDisplayDate(localGoal.target_date)}</span>
          {localGoal.created_at && (
            <span suppressHydrationWarning>Created: {formatDisplayDate(localGoal.created_at)}</span>
          )}
        </div>
      )}

      {/* Accordion checklist when expanded */}
      {localGoal.status === "active" && expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 pt-3 border-t border-bento-border/40 flex flex-col gap-2.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-bento-muted">
            <span>Today&apos;s Checklist</span>
            <span>{completedTodayCount} / {totalTasksCount} tasks today</span>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
              const checked = todayCompletions.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={(e) => toggleTask(task.id, e)}
                  className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-bento-text text-bento-muted transition-colors text-sm"
                >
                  <span className="shrink-0 transition-all">
                    {checked ? (
                      <CheckCircle2 className="w-5 h-5 text-stryde-success" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-bento-border bg-transparent" />
                    )}
                  </span>
                  <span className={checked ? "line-through text-bento-muted/60" : "text-bento-text"}>
                    {task.name}
                  </span>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="text-xs text-bento-muted italic py-1">No tasks defined for this goal.</p>
            )}
          </div>
        </div>
      )}

      {/* Show more/less toggle text at the bottom */}
      {localGoal.status === "active" && (
        <div className="flex justify-center mt-2 pt-2 border-t border-bento-border/30">
          <span className="text-xs font-semibold text-stryde-primary flex items-center gap-1 hover:underline cursor-pointer">
            {expanded ? "Show less" : "Show more"}
          </span>
        </div>
      )}

      {/* Remediation actions */}
      {localGoal.status === "almost-there" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 pt-3 border-t border-bento-border/40 flex flex-col gap-2"
        >
          <p className="text-xs text-bento-muted">You did great but ran out of time! Extend the target date to continue.</p>
          {!extending ? (
            <button
              onClick={() => setExtending(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-all"
            >
              Extend Target Date
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            renderDatePicker()
          )}
        </div>
      )}

      {/* Missed goals remediation actions */}
      {localGoal.status === "missed" && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 pt-3 border-t border-bento-border/40 flex flex-col gap-2"
        >
          <p className="text-xs text-bento-muted">Goal missed target deadline. Choose an action below.</p>
          {!extending ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setExtending(true)}
                className="flex flex-col items-center gap-1 py-2 rounded-xl border border-bento-border text-[10px] font-semibold text-bento-text hover:bg-bento-bg transition-all"
              >
                <Calendar className="w-4 h-4 text-stryde-primary" />
                Continue
              </button>
              <button
                onClick={handleRestart}
                className="flex flex-col items-center gap-1 py-2 rounded-xl border border-bento-border text-[10px] font-semibold text-bento-text hover:bg-bento-bg transition-all animate-none"
              >
                <RotateCcw className="w-4 h-4 text-stryde-success" />
                Restart
              </button>
              <button
                onClick={handleArchive}
                className="flex flex-col items-center gap-1 py-2 rounded-xl border border-bento-border text-[10px] font-semibold text-bento-text hover:bg-bento-bg transition-all"
              >
                <Archive className="w-4 h-4 text-bento-muted" />
                Archive
              </button>
            </div>
          ) : (
            renderDatePicker()
          )}
        </div>
      )}
    </div>
  );

  function renderDatePicker() {
    return (
      <div className="p-3 bg-bento-bg border border-bento-border rounded-xl flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-bento-muted uppercase tracking-wider">
          New Target Date
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            value={newTargetDate}
            onChange={(e) => {
              setNewTargetDate(e.target.value);
              setError("");
            }}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-bento-card border border-bento-border text-bento-text focus:border-stryde-primary outline-none"
          />
          <button
            onClick={handleSaveExtension}
            disabled={!newTargetDate}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            onClick={() => {
              setExtending(false);
              setError("");
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-bento-border text-bento-muted hover:bg-bento-border transition-colors"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-[10px] text-stryde-danger mt-1">{error}</p>}
      </div>
    );
  }
}

export default memo(GoalCard);
