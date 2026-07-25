"use client";

import { useEffect, useMemo, useCallback } from "react";
import useAppStore from "@/stores/useAppStore";
import ProgressRing from "@/components/ui/ProgressRing";
import StreakBadge from "@/components/streaks/StreakBadge";
import HabitCard from "@/components/habits/HabitCard";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardClient({ userId, initialHabits, initialCheckedIds }) {
  const habits            = useAppStore((state) => state.habits);
  const todayCheckIns     = useAppStore((state) => state.todayCheckIns);
  const setHabits         = useAppStore((state) => state.setHabits);
  const markPageVisited   = useAppStore((state) => state.markPageVisited);
  const hasSeededHabits   = useAppStore((state) => state.hasSeededHabits);

  // ── Seed Zustand on first mount only ────────────────────────────────────
  useEffect(() => {

    if (!hasSeededHabits && initialHabits?.length) {
      setHabits(initialHabits);
    }

    const currentCheckIns = useAppStore.getState().todayCheckIns;
    if (Object.keys(currentCheckIns).length === 0 && initialCheckedIds?.length) {
      const initialMap = {};
      initialHabits.forEach((h) => {
        initialMap[h.id] = initialCheckedIds.includes(h.id);
      });
      useAppStore.setState({ todayCheckIns: initialMap });
    }
  // We deliberately run only when initialHabits/initialCheckedIds change
  }, [initialHabits, initialCheckedIds, setHabits, hasSeededHabits]);

  // ── Page-visit cache (skeleton loader suppression) ───────────────────────
  useEffect(() => {
    markPageVisited("/dashboard");
  }, [markPageVisited]);

  // ── Stable set for O(1) "was this habit checked?" lookups ───────────────
  const initialCheckedSet = useMemo(
    () => new Set(initialCheckedIds),
    [initialCheckedIds]
  );

  // ── Derived display values ────────────────────────────────────────────────
 

  const dailyHabits = useMemo(
    () => {
      const currentHabits = hasSeededHabits ? habits : (initialHabits ?? []);
      return currentHabits.filter((h) => h.frequency === "daily" && !h.archived);
    },
    [hasSeededHabits, habits, initialHabits]
  );

  const totalHabits = dailyHabits.length;

  const completedCount = useMemo(
    () => dailyHabits.filter((h) => todayCheckIns[h.id] ?? initialCheckedSet.has(h.id)).length,
    [dailyHabits, todayCheckIns, initialCheckedSet]
  );

  const isLocked = totalHabits > 0 && completedCount === totalHabits;

  // ── Stable isChecked resolver (avoids anonymous fn in map) ───────────────
  const getIsChecked = useCallback(
    (habitId) => todayCheckIns[habitId] ?? initialCheckedSet.has(habitId),
    [todayCheckIns, initialCheckedSet]
  );

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
          {/* trigger re-fetches streak whenever completed count changes */}
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
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
            {dailyHabits.slice(0, 4).map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                userId={userId}
                isChecked={getIsChecked(habit.id)}
                isLocked={isLocked}
              />
              
            ))}
          <div className="flex justify-center">
          {isLocked && (<p className="text-bento-muted/90"> { totalHabits == 1  ? "Task" : ` Tasks`} Completed, Come back and Check in Tomorrow</p>)}
          </div>
          </div>
          
        )}
      </section>
    </div>
  );
}