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
}));

export default useAppStore;