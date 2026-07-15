/** Check-in page loading skeleton */
export default function CheckInLoading() {
  return (
    <div className="px-4 pt-10 pb-6 mx-auto max-w-6xl sm:px-6 lg:px-8 bg-bento-bg min-h-screen">
      {/* Header */}
      <div className="h-3 w-32 rounded-full bg-bento-card animate-pulse mb-2" />
      <div className="flex items-center justify-between mb-1">
        <div className="h-7 w-44 rounded-full bg-bento-card animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-bento-card animate-pulse" />
      </div>
      <div className="h-3 w-40 rounded-full bg-bento-card animate-pulse mb-6" />

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div className="h-3 w-20 rounded-full bg-bento-card animate-pulse" />
          <div className="h-3 w-8 rounded-full bg-bento-card animate-pulse" />
        </div>
        <div className="h-1.5 rounded-full bg-bento-card animate-pulse" />
      </div>

      {/* Check-in cards */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[72px] rounded-2xl bg-bento-card border border-bento-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}
