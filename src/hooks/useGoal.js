import { useState } from "react";
import useAppStore from "@/stores/useAppStore";
import { GoalRepository } from "@/repositories/goalRepository";

export function useGoal() {
  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const createGoal = async (goalData) => {
    setSaving(true);
    showLoading("Saving goal...");
    setError("");

    try {
      await GoalRepository.createGoal(goalData);
      setSaving(false);
      hideLoading();
      return true; // indicates success
    } catch (err) {
      console.error("Failed to save goal:", err);
      setError("Failed to save goal. Please try again.");
      setSaving(false);
      hideLoading();
      return false; // indicates failure
    }
  };

  const updateGoal = async (goalId, updates) => {
    try {
      await GoalRepository.updateGoal(goalId, updates);
      return true;
    } catch (err) {
      console.error("Failed to update goal:", err);
      return false;
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await GoalRepository.deleteGoal(goalId);
      return true;
    } catch (err) {
      console.error("Failed to delete goal:", err);
      return false;
    }
  };

  return { createGoal, updateGoal, deleteGoal, saving, error, setError };
}
