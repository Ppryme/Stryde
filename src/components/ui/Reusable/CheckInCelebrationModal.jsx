"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAppStore from "@/stores/useAppStore";
import { Trophy, Calendar } from "lucide-react";

export default function CheckInCelebrationModal() {
  const isOpen = useAppStore((state) => state.celebrationOpen);
  const setOpen = useAppStore((state) => state.setOpenCelebration);

  // Auto-dismiss modal after 8 seconds
 
useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
        setOpen(false);
    }, 8000);

    return () => clearTimeout(timer);
}, [isOpen, setOpen]);


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-sm rounded-3xl bg-bento-card border border-stryde-primary/40 p-6 text-center shadow-2xl shadow-black/80 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -inset-10 bg-stryde-primary/10 blur-3xl rounded-full pointer-events-none" />

            {/* Icon Banner */}
            <div className="w-16 h-16 rounded-full bg-stryde-primary/20 border border-stryde-primary flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-stryde-primary animate-bounce" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold text-bento-text mb-2">
              Day Complete! 🎉
            </h2>

            {/* Description */}
            <p className="text-sm text-bento-muted mb-6 leading-relaxed">
              You&apos;ve successfully checked off all your habits for today. Excellent work keeping your streak alive! Get some rest, come back tomorrow, and let&apos;s keep the momentum going.
            </p>

            {/* Action Button */}
            <button
              onClick={() => setOpen(false)}
              className="w-full py-3 rounded-xl bg-stryde-primary hover:bg-stryde-primary-dark text-white font-semibold text-sm transition-all"
            >
              Awesome, thank you!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
