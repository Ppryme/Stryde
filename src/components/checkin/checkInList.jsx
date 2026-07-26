"use client";

import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";
import CheckInCard from "./CheckInCard";

const MILESTONE_THRESHOLDS = new Set([7, 14, 21, 30, 60, 100, 200, 365]);

export default function CheckInList({ habits, checkInMap, userId, today }) {
  const todayCheckIns = useAppStore((state) => state.todayCheckIns);
  const markCheckedIn = useAppStore((state) => state.markCheckedIn);
  const storeHabits = useAppStore((state) => state.habits);
  const showMilestone = useAppStore((state) => state.showMilestone);
   const hasSeededHabits = useAppStore((state) => state.hasSeededHabits);
   
 

  // Initialize Zustand with current DB values on mount
  useEffect(() => {
    const currentCheckIns = useAppStore.getState().todayCheckIns;
    if (Object.keys(currentCheckIns).length === 0) {
      const initialMap = {};
      Object.keys(checkInMap).forEach((id) => {
        initialMap[id] = checkInMap[id].completed;
      });
      useAppStore.setState({ todayCheckIns: initialMap });
    }
    
    if (habits?.length) {
      const hasSeededHabits = useAppStore.getState().hasSeededHabits;
      if (!hasSeededHabits) {
        useAppStore.setState({ habits, hasSeededHabits: true });
      }
    }
  }, [checkInMap, habits]);

  // Page Load Cache logic
  const markPageVisited = useAppStore((state) => state.markPageVisited);
  useEffect(() => {
    markPageVisited("/checkin");
  }, [markPageVisited]);

  // Read habits from Zustand store (if populated), filtering out archived habits
  const currentHabits = hasSeededHabits ? storeHabits : (habits ?? []);
  const activeHabits = currentHabits.filter((h) => !h.archived);
  const totalHabits = activeHabits.length;
  const completedCount = activeHabits.filter((habit) => !!todayCheckIns[habit.id]).length;
  const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  const isLocked = totalHabits > 0 && completedCount === totalHabits;

  function handleToggle(habitId, completed) {
    markCheckedIn(habitId, completed);
  }

  function handleMilestone(streak) {
    if (MILESTONE_THRESHOLDS.has(streak)) {
      showMilestone(streak);
    }
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
        {activeHabits.map((habit) => {
          const isChecked = !!todayCheckIns[habit.id];
          return (
            <CheckInCard
              key={habit.id}
              habit={habit}
              userId={userId}
              today={today}
              isChecked={isChecked}
              onToggle={handleToggle}
              onMilestone={handleMilestone}
              isLocked={isLocked}
            />

            
          );
        })}

          <div className="flex justify-center">
          {isLocked && (<p className="text-bento-muted/90"> { totalHabits == 1  ? "Task" : ` Tasks`} Completed, Come back and Check in Tomorrow</p>)}
          </div>
          
        
      </div>

      {/* Floating Add Habit Button */}
      <a
        href="/habits/new"
        className="fixed bottom-20 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-stryde-primary text-white shadow-lg shadow-stryde-primary/30 hover:scale-110 active:scale-95 hover:bg-stryde-primary-dark transition-all duration-200 cursor-pointer"
        aria-label="Add habit"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </a>
    </div>
  );
}