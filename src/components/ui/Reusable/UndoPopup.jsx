"use client";

import useAppStore from "@/stores/useAppStore";
import { useEffect, useRef } from "react";
import { X, Undo2 } from "lucide-react";

export default function UndoPopup() {
  const undoAction = useAppStore((state) => state.undoAction);
  const clearUndo = useAppStore((state) => state.clearUndo);
  const timerRef = useRef(null);

  useEffect(() => {
    if (undoAction) {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      // Auto-dismiss after 5 seconds
      timerRef.current = setTimeout(() => {
        try {
          const result = undoAction.onDismiss?.();
          if (result instanceof Promise) result.catch(console.error);
        } finally {
          clearUndo();
        }
      }, 5000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [undoAction, clearUndo]);

  if (!undoAction) return null;

  const handleUndoClick = (e) => {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (undoAction.onUndo) undoAction.onUndo();
    clearUndo();
  };

  const handleClose = (e) => {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const result = undoAction.onDismiss?.();
      if (result instanceof Promise) result.catch(console.error);
    } finally {
      clearUndo();
    }
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-fadeIn">
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border bg-bento-card border-stryde-primary shadow-xl shadow-black/40">
        <p className="text-sm font-medium text-bento-text">
          {undoAction.message}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleUndoClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-bento-muted hover:text-bento-text hover:bg-bento-border transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
