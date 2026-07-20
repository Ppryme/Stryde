"use client";

import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Badge from "@/components/ui/badge";
import useAppStore from "@/stores/useAppStore";
import {
  parseGoal,
  getStreak,
  evaluateGoalStatus,
  getDaysDifference,
} from "@/lib/goalUtils";
import { getLocalDateString } from "@/lib/date";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Flame,
  CheckCircle2,
  RotateCcw,
  Archive,
  ArrowRight,
  Trash2,
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

  const [expanded, setExpanded] = useState(false);
  const [extending, setExtending] = useState(false);
  const [newTargetDate, setNewTargetDate] = useState("");
  const [error, setError] = useState("");

  const todayStr = getLocalDateString();

  // Memoize parsed goal data — parseGoal returns new object references every render,
  // so we must stabilise on goal.id + goal.description (both are primitive strings).
  const parsedGoal = useMemo(
    () => parseGoal(goal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goal.id, goal.description]
  );
  const { tasks, completionHistory, createdAtDate } = parsedGoal;

  // Local state for optimistic checklist updates.
  // Initialised once from the memoized value; synced back only when the
  // server description actually changes (goal.description is a stable string).
  const [localHistory, setLocalHistory] = useState(completionHistory);

  useEffect(() => {
    setLocalHistory(completionHistory);
    // Only re-sync when the server sends a new description (string comparison —
    // no infinite loop from object identity).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.description]);

  const todayCompletions = localHistory[todayStr] ?? [];
  const completedTodayCount = todayCompletions.length;
  const totalTasksCount = tasks.length;

  const daysRemaining = Math.max(0, getDaysDifference(todayStr, goal.target_date));
  const streak = getStreak(localHistory, totalTasksCount, createdAtDate);

  // Auto-evaluation hook — runs only when the goal's status or deadline actually
  // changes. Keyed on PRIMITIVE props so we never re-fire just because the parent
  // re-rendered and passed a new goal object reference (which would cause an
  // infinite loop via router.refresh() → re-render → new goal ref → effect again).
  useEffect(() => {
    async function evaluateStatus() {
      if (goal.status !== "active") return;
      try {
        const evaluated = evaluateGoalStatus(goal);
        if (evaluated !== goal.status) {
          const supabase = getSupabase();
          await supabase
            .from("goals")
            .update({ status: evaluated })
            .eq("id", goal.id);
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to auto-evaluate goal status:", err);
      }
    }
    evaluateStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.id, goal.status, goal.target_date]);

  const toggleTask = useCallback(async (taskId, e) => {
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

    // Optimistically update the UI instantly
    setLocalHistory(newHistory);

    const tasksPerDay = tasks.length;
    const totalDays = Math.max(1, getDaysDifference(createdAtDate, goal.target_date));
    const maxCompletions = totalDays * tasksPerDay;

    let totalCompleted = 0;
    Object.values(newHistory).forEach((list) => {
      totalCompleted += list.length;
    });

    const newProgress = maxCompletions > 0 
      ? Math.min(100, Math.round((totalCompleted / maxCompletions) * 100)) 
      : 0;

    const newDescription = JSON.stringify({
      tasks,
      reminders: parseGoal(goal).reminders,
      completion_history: newHistory,
      created_at_date: createdAtDate,
      finished_date: null,
    });

    try {
      const supabase = getSupabase();
      await supabase
        .from("goals")
        .update({
          description: newDescription,
          progress_pct: newProgress,
        })
        .eq("id", goal.id);

      router.refresh();
    } catch (err) {
      console.error("Failed to toggle goal task:", err);
      // Revert on error
      setLocalHistory(completionHistory);
    }
  }, [todayCompletions, localHistory, todayStr, tasks, createdAtDate, goal, router, completionHistory]);

  const handleDelete = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this goal? This cannot be undone.")) return;

    showLoading("Deleting goal...");
    try {
      const supabase = getSupabase();
      const { error: err } = await supabase
        .from("goals")
        .delete()
        .eq("id", goal.id);

      if (err) {
        alert("Failed to delete goal. Try again.");
        console.error(err);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      hideLoading();
    }
  }, [goal.id, router, showLoading, hideLoading]);

  const handleSaveExtension = useCallback(async () => {
    if (!newTargetDate) return;
    if (newTargetDate <= todayStr) {
      setError("New target date must be in the future.");
      return;
    }

    showLoading("Updating goal deadline...");
    setError("");

    try {
      const supabase = getSupabase();
      const { error: err } = await supabase
        .from("goals")
        .update({
          target_date: newTargetDate,
          status: "active",
        })
        .eq("id", goal.id);

      if (err) {
        setError("Failed to extend deadline.");
      } else {
        setExtending(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Error extending target date:", err);
      setError("An unexpected error occurred.");
    } finally {
      hideLoading();
    }
  }, [newTargetDate, todayStr, goal.id, router, showLoading, hideLoading]);

  const handleRestart = useCallback(async () => {
    if (!confirm("Are you sure you want to restart this goal? This will reset all statistics and task completion history.")) return;

    showLoading("Restarting goal...");
    const { tasks, reminders } = parseGoal(goal);

    const newDescription = JSON.stringify({
      tasks,
      reminders,
      completion_history: {},
      created_at_date: todayStr,
      finished_date: null,
    });

    try {
      const supabase = getSupabase();
      await supabase
        .from("goals")
        .update({
          description: newDescription,
          progress_pct: 0,
          status: "active",
        })
        .eq("id", goal.id);

      router.refresh();
    } catch (err) {
      console.error("Failed to restart goal:", err);
    } finally {
      hideLoading();
    }
  }, [goal, todayStr, router, showLoading, hideLoading]);

  const handleArchive = useCallback(async () => {
    if (!confirm("Archive this goal? It will be moved to history and will no longer show as active.")) return;

    try {
      const supabase = getSupabase();
      await supabase
        .from("goals")
        .update({ status: "archived" })
        .eq("id", goal.id);

      router.refresh();
    } catch (err) {
      console.error("Failed to archive goal:", err);
    } finally {
      hideLoading();
    }
  }, [goal.id, router, hideLoading]);

  const variant = STATUS_VARIANT[goal.status] ?? "info";
  const label = STATUS_LABEL[goal.status] ?? goal.status;

  return (
    <div
      onClick={() => {
        if (goal.status === "active") setExpanded((prev) => !prev);
      }}
      className={`p-4 rounded-2xl bg-bento-card border transition-all duration-200 select-none ${
        goal.status === "active" ? "cursor-pointer hover:border-bento-border/80" : "border-bento-border/50"
      } border-bento-border`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-bento-text truncate">
            {goal.title}
          </p>
          {goal.status === "active" && (
            <p className="text-[10px] text-bento-muted mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-bento-muted" />
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Deadline today"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={variant} className="capitalize">
            {label}
          </Badge>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-bento-muted hover:text-stryde-danger hover:bg-bento-border transition-colors cursor-pointer"
            aria-label="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {goal.status === "active" && (
            <span className="text-bento-muted">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar & percentage */}
      <div className="my-3">
        <div className="h-1.5 rounded-full overflow-hidden bg-bento-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goal.status === "missed" ? "bg-stryde-danger" : "bg-stryde-primary"
            }`}
            style={{ width: `${goal.progress_pct ?? 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-bento-muted mt-1.5">
          <span>{goal.progress_pct ?? 0}% complete</span>
          {goal.status === "active" && totalTasksCount > 0 && (
            <span>{completedTodayCount} / {totalTasksCount} tasks today</span>
          )}
        </div>
      </div>

      {/* Daily Metrics (Streak Only, Success Rate Removed) */}
      {goal.status === "active" && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-bento-border/30 text-xs">
          <div className="flex items-center gap-1.5 text-bento-text">
            <Flame className="w-4 h-4 text-stryde-fire" />
            <div>
              <p className="text-[10px] text-bento-muted">Current Streak</p>
              <p className="font-bold">{streak} {streak === 1 ? "day" : "days"}</p>
            </div>
          </div>
        </div>
      )}

      {/* History details */}
      {goal.status !== "active" && (
        <div className="mt-3 pt-3 border-t border-bento-border/30 grid grid-cols-2 gap-2 text-[11px] text-bento-muted">
          <span>Target Date: {new Date(goal.target_date).toLocaleDateString()}</span>
          {goal.created_at && (
            <span>Created: {new Date(goal.created_at).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {/* Accordion checklist when expanded */}
      {goal.status === "active" && expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 pt-3 border-t border-bento-border/40 flex flex-col gap-2.5 animate-fadeIn"
        >
          <p className="text-[10px] uppercase tracking-wider font-semibold text-bento-muted">Today&apos;s Checklist</p>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
              const checked = todayCompletions.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={(e) => toggleTask(task.id, e)}
                  className="flex items-center gap-2.5 cursor-pointer py-1.5 hover:text-bento-text text-bento-muted transition-colors text-sm"
                >
                  <span className="flex-shrink-0 transition-all">
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
      {goal.status === "active" && (
        <div className="flex justify-center mt-2 pt-2 border-t border-bento-border/30">
          <span className="text-xs font-semibold text-stryde-primary flex items-center gap-1 hover:underline cursor-pointer">
            {expanded ? "Show less" : "Show more"}
          </span>
        </div>
      )}

      {/* Remediation actions */}
      {goal.status === "almost-there" && (
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
      {goal.status === "missed" && (
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
