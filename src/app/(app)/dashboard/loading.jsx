"use client";

import useAppStore from "@/stores/useAppStore";

/** Dashboard page-level loading skeleton */
export default function DashboardLoading() {
  const visitedPages = useAppStore((state) => state.visitedPages);

  // If page was already visited in this session, skip the skeleton loader
  if (visitedPages.has("/dashboard")) {
    return null;
  }

  return (
    <div className="px-4 pt-10 pb-6 flex flex-col gap-6 mx-auto max-w-6xl sm:px-6 lg:px-8 bg-bento-bg min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded-full bg-bento-card animate-pulse" />
          <div className="h-6 w-36 rounded-full bg-bento-card animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded-full bg-bento-card animate-pulse" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-bento-card border border-bento-border animate-pulse" />
        ))}
      </div>

      {/* Habit cards */}
      <div>
        <div className="h-4 w-20 rounded-full bg-bento-card animate-pulse mb-3" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[66px] rounded-2xl bg-bento-card border border-bento-border animate-pulse" />
          ))}
        </div>
      </div>

      {/* Goals section */}
      <div>
        <div className="h-4 w-24 rounded-full bg-bento-card animate-pulse mb-3" />
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-bento-card border border-bento-border animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
