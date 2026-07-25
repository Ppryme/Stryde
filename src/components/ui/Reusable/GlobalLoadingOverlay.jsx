"use client";

import Spinner from "@/components/ui/Reusable/Spinner";
import useAppStore from "@/stores/useAppStore";

export default function GlobalLoadingOverlay() {
  const loading = useAppStore((state) => state.loading);
  const message = useAppStore((state) => state.loadingMessage);



  if (!loading) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-55 w-[calc(100%-2rem)] max-w-xs animate-fadeIn">
      <div className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-full border bg-bento-card border-stryde-primary/40 shadow-xl shadow-black/50">
        <Spinner className="w-4 h-4 text-stryde-primary flex-shrink-0" />
        <p className="text-xs font-semibold text-bento-text truncate whitespace-nowrap">
          {message || "Loading..."}
        </p>
      </div>
    </div>
  );
}