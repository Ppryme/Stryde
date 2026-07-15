"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAppStore from "@/stores/useAppStore";

const MILESTONE_THRESHOLDS = new Set([7, 14, 21, 30, 60, 100, 200, 365]);

/**
 * MilestoneToast
 * Rendered inside AppShell. Shows a brief celebration banner at the top of the
 * screen whenever a meaningful streak threshold is hit. Automatically dismisses
 * after 4 seconds. Only fires on meaningful thresholds (7, 14, 21, 30, 60, 100…).
 */
export default function MilestoneToast() {
  const milestone = useAppStore((state) => state.milestone);
  const clearMilestone = useAppStore((state) => state.clearMilestone);

  useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(clearMilestone, 4000);
    return () => clearTimeout(t);
  }, [milestone, clearMilestone]);

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          key="milestone-toast"
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-xs"
        >
          <div className="relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl border border-stryde-primary/50 bg-bento-card shadow-2xl shadow-black/60">
            {/* Glow accent */}
            <div className="absolute inset-0 bg-stryde-primary/5 pointer-events-none rounded-2xl" />

            {/* Flame icon */}
            <span className="text-2xl select-none flex-shrink-0" aria-hidden>🔥</span>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stryde-primary uppercase tracking-widest leading-none mb-0.5">
                Milestone!
              </p>
              <p className="text-sm font-semibold text-bento-text leading-snug">
                {milestone.message}
              </p>
            </div>

            <button
              onClick={clearMilestone}
              className="flex-shrink-0 p-1 rounded-lg text-bento-muted hover:text-bento-text transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
