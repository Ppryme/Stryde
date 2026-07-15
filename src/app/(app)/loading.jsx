/**
 * App Router loading state for the (app) route group.
 * Shown while any page inside (app) is streaming its initial data.
 * Matches the app shell layout: pb-16 bottom padding from BottomTabBar.
 */
export default function AppLoading() {
  return (
    <div className="min-h-screen bg-bento-bg pb-16 px-4 pt-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 rounded-full bg-bento-card animate-pulse" />
          <div className="h-6 w-40 rounded-full bg-bento-card animate-pulse" />
        </div>
        <div className="h-8 w-8 rounded-full bg-bento-card animate-pulse" />
      </div>

      {/* Progress bar skeleton */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div className="h-3 w-20 rounded-full bg-bento-card animate-pulse" />
          <div className="h-3 w-8 rounded-full bg-bento-card animate-pulse" />
        </div>
        <div className="h-1.5 rounded-full bg-bento-card animate-pulse" />
      </div>

      {/* Card skeletons */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[72px] rounded-2xl bg-bento-card border border-bento-border animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
