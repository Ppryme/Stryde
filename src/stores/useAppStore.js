// stores/useAppStore.js
import { create } from "zustand";

const initialState = {
  user: null,
  habits: [],
  hasSeededHabits: false,
  todayCheckIns: {},
  isOnline: true,
  loading: false,
  loadingMessage: "",
  undoAction: null,
  milestone: null,
  celebrationOpen: false,
  celebratedTodayCount: 0,
  visitedPages: new Set(),
};

const useAppStore = create((set) => ({
  ...initialState,

  resetStore: () => set(initialState),

  setUser: (user) => set({ user }),
  setHabits: (habits) => set({ habits, hasSeededHabits: true }),

  markCheckedIn: (habitId, completed) =>
    set((state) => {
      const prevCheckIns = state.todayCheckIns;
      const newCheckIns = {
        ...prevCheckIns,
        [habitId]: completed,
      };

      const activeDailyHabits = state.habits.filter(
        (h) => (h.frequency === "daily" || !h.frequency) && !h.archived
      );
      const totalHabits = activeDailyHabits.length;

      if (totalHabits > 0 && completed) {
        const prevCompletedCount = activeDailyHabits.filter(
          (h) => !!prevCheckIns[h.id]
        ).length;
        const newCompletedCount = activeDailyHabits.filter(
          (h) => !!newCheckIns[h.id]
        ).length;

        if (prevCompletedCount < totalHabits && newCompletedCount === totalHabits) {
          return {
            todayCheckIns: newCheckIns,
            celebrationOpen: true,
          };
        }
      }

      return { todayCheckIns: newCheckIns };
    }),

  setOnline: (isOnline) => set({ isOnline }),

  showLoading: (message = "Loading...") =>
    set({
      loading: true,
      loadingMessage: message,
    }),

  hideLoading: () =>
    set({
      loading: false,
      loadingMessage: "",
    }),

  // Undo Notification state
  undoAction: null,
  showUndo: (message, onUndo, onDismiss) =>
    set({
      undoAction: { message, onUndo, onDismiss },
    }),
  clearUndo: () => set({ undoAction: null }),

  // Milestone Celebration state
  milestone: null, // { streak: number, message: string }
  showMilestone: (streak) => {
    const messages = {
      7:   "7 Day Streak 🔥 You're building a real habit!",
      30:  "30 Day Streak 💪 One month of consistency!",
      100: "100 Day Streak 🏆 You're unstoppable!",
    };
    const message = messages[streak] ?? `${streak} Day Streak! Keep it up!`;
    set({ milestone: { streak, message } });
  },
  clearMilestone: () => set({ milestone: null }),

  // Daily Check-In Celebration Modal
  celebrationOpen: false,
  setOpenCelebration: (val) => set({ celebrationOpen: val }),
  celebratedTodayCount: 0,
  setCelebratedTodayCount: (val) => set({ celebratedTodayCount: val }),

  // Page Load Cache for Skeletons
  visitedPages: new Set(),
  markPageVisited: (page) =>
    set((state) => {
      const updated = new Set(state.visitedPages);
      updated.add(page);
      return { visitedPages: updated };
    }),
}));

export default useAppStore;