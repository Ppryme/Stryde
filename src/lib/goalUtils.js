// src/lib/goalUtils.js
// ─────────────────────────────────────────────
// GOALS UTILITIES — progress, streaks, success rates, status evaluation
// ─────────────────────────────────────────────
import { getLocalDateString } from "./date";

export function getDaysDifference(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function parseGoal(goal) {
  let tasks = [];
  let reminders = [];
  let completionHistory = {};
  let createdAtDate = goal.created_at ? goal.created_at.split("T")[0] : getLocalDateString();
  let finishedDate = null;

  try {
    if (goal.description && goal.description.startsWith("{")) {
      const data = JSON.parse(goal.description);
      tasks = data.tasks || [];
      reminders = data.reminders || [];
      completionHistory = data.completion_history || {};
      if (data.created_at_date) createdAtDate = data.created_at_date;
      finishedDate = data.finished_date || null;
    }
  } catch (e) {
    console.error("Failed to parse goal details JSON", e);
  }

  return { tasks, reminders, completionHistory, createdAtDate, finishedDate };
}

export function getStreak(history, tasksLength, createdDate) {
  if (tasksLength === 0) return 0;
  let streak = 0;
  let curr = new Date();
  const todayStr = getLocalDateString();

  while (true) {
    const dateStr = getLocalDateString(curr);
    if (dateStr < createdDate) break;

    const dayCompletions = history[dateStr] ?? [];
    if (dayCompletions.length === tasksLength) {
      streak++;
    } else {
      // If we are looking at today, it's allowed to be incomplete without breaking the streak
      if (dateStr === todayStr) {
        // Just continue to yesterday
      } else {
        break; // Streak broken
      }
    }
    curr.setDate(curr.getDate() - 1);
  }
  return streak;
}

export function calculateProgress(goal) {
  const { tasks, completionHistory, createdAtDate } = parseGoal(goal);
  const tasksPerDay = tasks.length;
  if (tasksPerDay === 0) return 0;

  const totalDays = Math.max(1, getDaysDifference(createdAtDate, goal.target_date));
  const maxCompletions = totalDays * tasksPerDay;

  let totalCompleted = 0;
  Object.values(completionHistory).forEach((list) => {
    totalCompleted += list.length;
  });

  return maxCompletions > 0 
    ? Math.min(100, Math.round((totalCompleted / maxCompletions) * 100)) 
    : 0;
}

export function calculateSuccessRate(goal) {
  const { tasks, completionHistory, createdAtDate } = parseGoal(goal);
  const tasksLength = tasks.length;
  if (tasksLength === 0) return 0;

  const todayStr = getLocalDateString();
  const elapsedDays = Math.max(1, getDaysDifference(createdAtDate, todayStr) + 1);

  const completedDaysCount = Object.keys(completionHistory).filter((date) => {
    return (completionHistory[date] ?? []).length === tasksLength;
  }).length;

  return elapsedDays > 0 
    ? Math.min(100, Math.round((completedDaysCount / elapsedDays) * 100)) 
    : 0;
}

export function evaluateGoalStatus(goal) {
  if (goal.status !== "active") return goal.status;

  const todayStr = getLocalDateString();
  // Target date has arrived or passed (deadline reached)
  if (goal.target_date < todayStr) {
    const progress = calculateProgress(goal);
    if (progress >= 100) {
      return "completed";
    } else if (progress >= 70) {
      return "almost-there";
    } else {
      return "missed";
    }
  }
  return "active";
}
