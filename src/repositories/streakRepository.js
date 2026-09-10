/**
 * @file streakRepository.js
 * @deprecated Per-habit streaks have been removed under Option A (Overall Perfect-Day Streak).
 * UserStreakRepository is the single source of truth for streaks.
 * UI components should access streak data via the `useStreak` hook.
 */
import { UserStreakRepository } from "./userStreakRepository";

export const StreakRepository = {
  /**
   * Computes the user's overall streak dynamically across historical check-ins.
   * Delegates to UserStreakRepository.getOverallStreak.
   *
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getOverallStreak(userId) {
    return UserStreakRepository.getOverallStreak(userId);
  },
};

export default StreakRepository;

