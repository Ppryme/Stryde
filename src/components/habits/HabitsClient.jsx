"use client";

import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";
import HabitCard from "@/components/habits/HabitCard";
import EmptyState from "@/components/ui/EmptyState";

export default function HabitsClient({ initialHabits, userId, initialCheckedIds }) {
  const habits = useAppStore((state) => state.habits);
  const setHabits = useAppStore((state) => state.setHabits);
  const todayCheckIns = useAppStore((state) => state.todayCheckIns);

  useEffect(() => {
    const hasSeededHabits = useAppStore.getState().hasSeededHabits;
    if (!hasSeededHabits && initialHabits) {
      setHabits(initialHabits);
    }
  }, [initialHabits, setHabits]);

  const currentHabits = habits.length > 0 ? habits : initialHabits;
  const activeHabits = currentHabits.filter((h) => !h.archived);

  return (
    <>
      {activeHabits.length === 0 ? (
        <EmptyState
          icon="target"
          message="Nothing to track yet. Add your first habit and start your streak today."
          ctaLabel="+ Add a habit"
          ctaHref="/habits/new"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {activeHabits.map((habit) => {
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
    </>
  );
}
