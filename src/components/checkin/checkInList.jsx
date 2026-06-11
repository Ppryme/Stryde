// src/components/checkin/CheckInList.jsx
// ─────────────────────────────────────────────
// CHECK-IN LIST — client component
// Manages the state of all check-ins for today
// Shows celebration message when all habits complete
// ─────────────────────────────────────────────
"use client";
import { useState } from "react";
import CheckInCard from "./CheckInCard";
import { STREAK_MILESTONES } from "@/lib/design-token";

export default function CheckInList({ habits, checkInMap: initialMap, userId, today }) {
  const [checkInMap, setCheckInMap] = useState(initialMap);
  const [milestoneMsg, setMilestoneMsg] = useState("");

  const total     = habits.length;
  const completed = Object.values(checkInMap).filter((c) => c.completed).length;
  const allDone   = total > 0 && completed === total;

  function handleToggle(habitId, newValue) {
    setCheckInMap((prev) => ({
      ...prev,
      [habitId]: { ...prev[habitId], completed: newValue },
    }));
  }

  function handleMilestone(streakCount) {
    if (STREAK_MILESTONES.includes(streakCount)) {
      const messages = {
        3:   "3 days straight. Momentum is building.",
        7:   "A full week. Most people quit before this. You didn't.",
        14:  "14 days. This is becoming part of who you are.",
        30:  "30 days. You built a habit. That's everything.",
        100: "100 days. You are the 1%.",
      };
      setMilestoneMsg(messages[streakCount] ?? `${streakCount}-day streak!`);
      setTimeout(() => setMilestoneMsg(""), 4000);
    }
  }

  if (habits.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--color-bento-muted)" }}>
        No habits yet.{" "}
        <a href="/habits/new" style={{ color: "var(--color--stryde-primary)" }}>
          Add one →
        </a>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Milestone toast */}
      {milestoneMsg && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium text-center"
          style={{ background: "var(--color--stryde-fire-light)", color: "#633806" }}
        >
          🔥 {milestoneMsg}
        </div>
      )}

      {/* All done message */}
      {allDone && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium text-center"
          style={{ background: "var(--color--stryde-success-light)", color: "var(--color--stryde-success-dark)" }}
        >
          All done. Streak extended. See you tomorrow. ✓
        </div>
      )}

      {/* Check-in cards */}
      {habits.map((habit) => (
        <CheckInCard
          key={habit.id}
          habit={habit}
          userId={userId}
          today={today}
          isChecked={checkInMap[habit.id]?.completed ?? false}
          onToggle={handleToggle}
          onMilestone={handleMilestone}
        />
      ))}
    </div>
  );
}
