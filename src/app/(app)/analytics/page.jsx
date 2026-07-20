
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import HeatmapCalendar from "@/components/analytics/HeatmapCalendar";
import TrendChart from "@/components/analytics/TrendChart";
import { getOneYearAgoDate } from "@/lib/date";
import SignOutButton from "@/components/ui/Reusable/SignOutButton";
import AnalyticsPageTracker from "@/components/analytics/AnalyticsPageTracker";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Last 365 days of check-ins
  const oneYearAgo = getOneYearAgoDate();

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("date, completed, habit_id")
    .eq("user_id", user.id)
    .gte("date", oneYearAgo)
    .order("date", { ascending: true });

  const { data: streaks } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak")
    .eq("user_id", user.id);

  const currentStreak = streaks?.reduce((max, s) => Math.max(max, s.current_streak ?? 0), 0) ?? 0;
  const longestStreak = streaks?.reduce((max, s) => Math.max(max, s.longest_streak ?? 0), 0) ?? 0;

  const totalCompleted = (checkIns ?? []).filter((c) => c.completed).length;
  const totalCheckIns  = (checkIns ?? []).length;
  const completionRate = totalCheckIns === 0 ? 0 : Math.round((totalCompleted / totalCheckIns) * 100);

  return (
    <div className="px-4 pt-10 pb-6 flex flex-col gap-6">
      <AnalyticsPageTracker />

      <div className="flex items-center justify-between">
       <h1 className="text-2xl font-bold text-bento-text">
        Your progress
      </h1>

       <span><SignOutButton /></span> 
      </div>


      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Completion", value: `${completionRate}%` },
          { label: "Streak",     value: `${currentStreak}d` },
          { label: "Best",       value: `${longestStreak}d` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center py-4 rounded-2xl bg-bento-card border border-bento-border"
          >
            <span className="text-2xl font-bold text-stryde-primary">
              {stat.value}
            </span>
            <span className="text-[11px] mt-0.5 text-bento-muted">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <section>
        <h2 className="text-sm font-semibold mb-3 text-bento-text">
          Activity this year
        </h2>
        <HeatmapCalendar checkIns={checkIns ?? []} />
      </section>

      {/* Trend chart */}
      <section>
        <h2 className="text-sm font-semibold mb-3 text-bento-text">
          Weekly completion rate
        </h2>
        <TrendChart checkIns={checkIns ?? []} />
      </section>

    </div>
  );
}
