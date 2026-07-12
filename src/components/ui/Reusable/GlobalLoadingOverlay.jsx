"use client";

import Spinner from "@/components/ui/Reusable/Spinner";
import useAppStore from "@/stores/useAppStore";

export default function GlobalLoadingOverlay() {
  const loading = useAppStore((state) => state.loading);
  const message = useAppStore((state) => state.loadingMessage);

  if (!loading) return null;

  return (
    
      <div className="flex items-center gap-3 rounded-2xl border border-bento-border px-6 py-5 shadow-xl">
        <Spinner />

        <p className="text-sm font-medium text-white">
          {message}
        </p>
      </div>
    
  );
}