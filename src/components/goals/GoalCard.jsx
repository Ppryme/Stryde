"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import Badge from "@/components/ui/badge";
import useAppStore from "@/stores/useAppStore";
import {
  parseGoal,
  getStreak,
  calculateProgress,
  calculateSuccessRate,
  evaluateGoalStatus,
  getDaysDifference,
} from "@/lib/goalUtils";
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Calendar,
  Flame,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Archive,
  ArrowRight,
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

export default function GoalCard({ goal }) {
  const router = useRouter();
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  const [expanded, setExpanded] = useState(false);
  const [extending, setExtending] = useState(false);
  const [newTargetDate, setNewTargetDate] = useState("");
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const { tasks, completionHistory, createdAtDate } = parseGoal(goal);

  const todayCompletions = completionHistory[todayStr] ?? [];
  const completedTodayCount = todayCompletions.length;
  const totalTasksCount = tasks.length;

  const daysRemaining = Math.max(0, getDaysDifference(todayStr, goal.target_date));
  const successRate = calculateSuccessRate(goal);
  const streak = getStreak(completionHistory, totalTasksCount, createdAtDate);

  // Auto-evaluation hook
  useEffect(() => {
    async function evaluateStatus() {
      if (goal.status !== "active") return;
      const evaluated = evaluateGoalStatus(goal);
      if (evaluated !== goal.status) {
        const supabase = getSupabase();
        await supabase
          .from("goals")
          .update({ status: evaluated })
          .eq("id", goal.id);
        router.refresh();
      }
    }
    evaluateStatus();
  }, [goal, router]);

  async function toggleTask(taskId, e) {
    if (e) e.stopPropagation();

    let newDayCompletions = [];
    if (todayCompletions.includes(taskId)) {
      newDayCompletions = todayCompletions.filter((id) => id !== taskId);
    } else {
      newDayCompletions = [...todayCompletions, taskId];
    }

    const newHistory = {
      ...completionHistory,
      [todayStr]: newDayCompletions,
    };

    // Calculate new progress pct
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

    const supabase = getSupabase();
    await supabase
      .from("goals")
      .update({
        description: newDescription,
        progress_pct: newProgress,
      })
      .eq("id", goal.id);

    router.refresh();
  }

  async function handleSaveExtension() {
    if (!newTargetDate) return;
    if (newTargetDate <= todayStr) {
      setError("New target date must be in the future.");
      return;
    }

    showLoading("Updating goal deadline...");
    setError("");

    const supabase = getSupabase();
    const { error: err } = await supabase
      .from("goals")
      .update({
        target_date: newTargetDate,
        status: "active",
      })
      .eq("id", goal.id);

    hideLoading();
    if (err) {
      setError("Failed to extend deadline.");
    } else {
      setExtending(false);
      router.refresh();
    }
  }

  async function handleRestart() {
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

    const supabase = getSupabase();
    await supabase
      .from("goals")
      .update({
        description: newDescription,
        progress_pct: 0,
        status: "active",
      })
      .eq("id", goal.id);

    hideLoading();
    router.refresh();
  }

  async function handleArchive() {
    if (!confirm("Archive this goal? It will be moved to history and will no longer show as active.")) return;

    showLoading("Archiving goal...");
    const supabase = getSupabase();
    await supabase
      .from("goals")
      .update({ status: "archived" })
      .eq("id", goal.id);

    hideLoading();
    router.refresh();
  }

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

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant={variant} className="capitalize">
            {label}
          </Badge>
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

      {/* Daily Metrics (Streak + Success Rate) */}
      {goal.status === "active" && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-bento-border/30 text-xs">
          <div className="flex items-center gap-1.5 text-bento-text">
            <Flame className="w-4 h-4 text-stryde-fire" />
            <div>
              <p className="text-[10px] text-bento-muted">Current Streak</p>
              <p className="font-bold">{streak} {streak === 1 ? "day" : "days"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-bento-text">
            <TrendingUp className="w-4 h-4 text-stryde-success" />
            <div>
              <p className="text-[10px] text-bento-muted">Daily Success Rate</p>
              <p className="font-bold">{successRate}%</p>
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
                className="flex flex-col items-center gap-1 py-2 rounded-xl border border-bento-border text-[10px] font-semibold text-bento-text hover:bg-bento-bg transition-all"
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
