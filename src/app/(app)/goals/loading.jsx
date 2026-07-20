"use client";

import useAppStore from "@/stores/useAppStore";

/** Goals page loading skeleton */
export default function GoalsLoading() {
  const visitedPages = useAppStore((state) => state.visitedPages);

  // Skip loading skeleton if goals page has been loaded previously in session
  if (visitedPages.has("/goals")) {
    return null;
  }

  return (
    <div className="px-4 pt-10 pb-6 max-w-2xl mx-auto bg-bento-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-16 rounded-full bg-bento-card animate-pulse" />
        <div className="h-9 w-16 rounded-full bg-bento-card animate-pulse" />
      </div>

      {/* Section label */}
      <div className="h-3 w-24 rounded-full bg-bento-card animate-pulse mb-3" />

      {/* Goal cards */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-bento-card border border-bento-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
