"use client";

import Spinner from "@/components/ui/Reusable/Spinner";
import useAppStore from "@/stores/useAppStore";

export default function GlobalLoadingOverlay() {
  const loading = useAppStore((state) => state.loading);
  const message = useAppStore((state) => state.loadingMessage);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-bento-border bg-bento-card px-6 py-5 shadow-xl">
        <Spinner />

        <p className="text-sm font-medium text-bento-text">
          {message}
        </p>
      </div>
    </div>
  );
}