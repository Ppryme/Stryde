"use client";

import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";
import ProgressRing from "@/components/ui/ProgressRing";
import StreakBadge from "@/components/streaks/StreakBadge";
import HabitCard from "@/components/habits/HabitCard";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardClient({ userId, initialHabits, initialCheckedIds }) {
  const habits = useAppStore((state) => state.habits);
  const todayCheckIns = useAppStore((state) => state.todayCheckIns);
  const setHabits = useAppStore((state) => state.setHabits);

  // Initialize Zustand store state with server-side fetched data on mount
  useEffect(() => {
    if (habits.length === 0 && initialHabits) {
      setHabits(initialHabits);
    }

    if (Object.keys(todayCheckIns).length === 0 && initialCheckedIds) {
      const initialMap = {};
      initialHabits.forEach((habit) => {
        initialMap[habit.id] = initialCheckedIds.includes(habit.id);
      });
      useAppStore.setState({ todayCheckIns: initialMap });
    }
  }, [initialHabits, initialCheckedIds, habits.length, todayCheckIns, setHabits]);

  // Use store data if present, otherwise fall back to initial props for server-side loading state
  const currentHabits = habits.length > 0 ? habits : initialHabits;
  const dailyHabits = currentHabits.filter((h) => h.frequency === "daily" && !h.archived);
  
  const totalHabits = dailyHabits.length;
  const completedCount = dailyHabits.filter(
    (h) => todayCheckIns[h.id] ?? initialCheckedIds.includes(h.id)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress Section */}
      <div className="flex items-center justify-between rounded-2xl p-5 bg-bento-card border border-bento-border">
        <ProgressRing total={totalHabits} completed={completedCount} size={110} />
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-xs text-bento-muted">Today</p>
            <p className="text-lg font-bold text-bento-text">
              {completedCount}/{totalHabits} done
            </p>
          </div>
          {/* Pass trigger instead of key to prevent unmounting and flickering */}
          <StreakBadge userId={userId} trigger={completedCount} />
        </div>
      </div>

      {/* Habits List Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-bento-text">
            Daily habits
          </h2>
          <div className="flex items-center gap-2">
            <a
              href="/habits/new"
              className="flex items-center justify-center p-1 rounded-md text-bento-muted hover:text-stryde-primary hover:bg-bento-border transition-all"
              aria-label="Create a habit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </a>
            <a href="/habits" className="text-xs text-stryde-primary">
              See all
            </a>
          </div>
        </div>

        {totalHabits === 0 ? (
          <EmptyState
            icon="target"
            message="No habits yet. Add your first habit and start your streak today."
            ctaLabel="+ Add a habit"
            ctaHref="/habits/new"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {dailyHabits.slice(0, 4).map((habit) => {
              const isChecked = todayCheckIns[habit.id] ?? initialCheckedIds.includes(habit.id);
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  userId={userId}
                  isChecked={isChecked}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}