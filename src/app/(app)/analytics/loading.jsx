"use client";

import useAppStore from "@/stores/useAppStore";

/** Analytics page loading skeleton */
export default function AnalyticsLoading() {
  const visitedPages = useAppStore((state) => state.visitedPages);

  // Skip loading skeleton if analytics page was visited
  if (visitedPages.has("/analytics")) {
    return null;
  }

  return (
    <div className="px-4 pt-10 pb-6 mx-auto max-w-6xl sm:px-6 lg:px-8 bg-bento-bg min-h-screen">
      {/* Header */}
      <div className="h-7 w-28 rounded-full bg-bento-card animate-pulse mb-6" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-bento-card border border-bento-border animate-pulse" />
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="h-48 rounded-2xl bg-bento-card border border-bento-border animate-pulse mb-4" />

      {/* Habit rows */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-bento-card border border-bento-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
