// stores/useAppStore.js
import { create } from "zustand";

const useAppStore = create((set) => ({
  user: null,
  habits: [],
  todayCheckIns: {},
  isOnline: true,

  // Global Loading Overlay
  loading: false,
  loadingMessage: "",

  setUser: (user) => set({ user }),
  setHabits: (habits) => set({ habits }),

  markCheckedIn: (habitId, completed) =>
    set((state) => ({
      todayCheckIns: {
        ...state.todayCheckIns,
        [habitId]: completed,
      },
    })),

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
}));

export default useAppStore;