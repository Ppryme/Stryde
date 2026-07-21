import { useState } from "react";
import useAppStore from "@/stores/useAppStore";
import { HabitRepository } from "@/repositories/habitRepository";

export function useHabit() {
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createHabit = async (habitData) => {
    setSaving(true);
    showLoading("Saving habit...");
    setError("");

    try {
      await HabitRepository.createHabit(habitData);
      setSaving(false);
      hideLoading();
      return true; // indicates success
    } catch (err) {
      console.error("Failed to save habit:", err);
      setError("Failed to save habit. Please try again.");
      setSaving(false);
      hideLoading();
      return false; // indicates failure
    }
  };

  const updateHabit = async (habitId, updates) => {
    try {
      await HabitRepository.updateHabit(habitId, updates);
      return true;
    } catch (err) {
      console.error("Failed to update habit:", err);
      return false;
    }
  };

  const archiveHabit = async (habitId) => {
    try {
      await HabitRepository.archiveHabit(habitId);
      return true;
    } catch (err) {
      console.error("Failed to archive habit:", err);
      return false;
    }
  };

  return { createHabit, updateHabit, archiveHabit, saving, error, setError };
}
