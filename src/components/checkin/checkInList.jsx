"use client";

import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";
import CheckInCard from "./CheckInCard";

export default function CheckInList({ habits, checkInMap, userId, today }) {
  const todayCheckIns = useAppStore((state) => state.todayCheckIns);
  const markCheckedIn = useAppStore((state) => state.markCheckedIn);

  // Initialize Zustand with current DB values on mount
  useEffect(() => {
    const initialMap = {};
    Object.keys(checkInMap).forEach((id) => {
      initialMap[id] = checkInMap[id].completed;
    });
    
    if (habits?.length) {
      useAppStore.setState({ habits });
    }
    useAppStore.setState({ todayCheckIns: initialMap });
  }, [checkInMap, habits]);

  const totalHabits = habits?.length ?? 0;
  const completedCount = habits.filter((habit) => !!todayCheckIns[habit.id]).length;
  const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  function handleToggle(habitId, completed) {
    markCheckedIn(habitId, completed);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Reactive Progress Bar inside Client Component */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1.5 text-bento-muted">
          <span>{completedCount} of {totalHabits} done</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-bento-border">
          <div
            className="h-full rounded-full transition-all duration-500 bg-stryde-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Check In Cards */}
      <div className="flex flex-col gap-3">
        {habits.map((habit) => {
          const isChecked = !!todayCheckIns[habit.id];
          return (
            <CheckInCard
              key={habit.id}
              habit={habit}
              userId={userId}
              today={today}
              isChecked={isChecked}
              onToggle={handleToggle}
            />
          );
        })}
      </div>
    </div>
  );
}