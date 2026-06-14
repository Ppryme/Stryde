// stores/useAppStore.js
import { create } from 'zustand';

const useAppStore = create((set) => ({
  user: null,
  habits: [],
  todayCheckIns: {},
  isOnline: true,

  setUser: (user) => set({ user }),
  setHabits: (habits) => set({ habits }),

  // Mark a habit checked in (optimistic)
  markCheckedIn: (habitId, completed) =>
    set((state) => ({
      todayCheckIns: {
        ...state.todayCheckIns,
        [habitId]: completed,
      },
    })),

  setOnline: (isOnline) => set({ isOnline }),
}));

export default useAppStore;