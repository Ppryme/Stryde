import { createClient } from "@/lib/supabase-server";
import ProgressRing from "@/components/ui/ProgressRing";
import StreakBadge from "@/components/streaks/StreakBadge";
import HabitCard from "@/components/habits/HabitCard";
import EmptyState from "@/components/ui/EmptyState";
import GoalCard from "@/components/goals/GoalCard";
import SignOutButton from "@/components/ui/Reusable/SignOutButton";
import GlobalLoadingOverlay from "@/components/ui/Reusable/GlobalLoadingOverlay";


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}



export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .eq("frequency", "daily")
    .order("order_index", { ascending: true });

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("habit_id, completed")
    .eq("user_id", user.id)
    .eq("date", today);

  const checkedIds = new Set(
    (checkIns ?? []).filter((c) => c.completed).map((c) => c.habit_id)
  );

  const totalHabits = habits?.length ?? 0;
  const completedCount = checkedIds.size;

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(2);

  return (
    <div className="px-4 pt-10 pb-6 flex flex-col gap-6">

      <GlobalLoadingOverlay />

      <div>
        <div className="flex justify-between">
          <p className="text-sm text-bento-muted">{getGreeting()}</p>

          <SignOutButton />
        </div>

        <h1 className="text-2xl font-bold mt-0.5 text-bento-text">
          {user.user_metadata?.name ?? "Let's get to work."}
        </h1>
      </div>

      <div className="flex items-center justify-between rounded-2xl p-5 bg-bento-card border border-bento-border">
        <ProgressRing total={totalHabits} completed={completedCount} size={110} />
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-xs text-bento-muted">Today</p>
            <p className="text-lg font-bold text-bento-text">
              {completedCount}/{totalHabits} done
            </p>
          </div>
          <StreakBadge userId={user.id} />
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-bento-text">
            Today&apos;s habits
          </h2>
          <a href="/habits" className="text-xs text-stryde-primary">
            See all
          </a>
        </div>

        {totalHabits === 0 ? (
          <EmptyState
            icon="target"
            message="No habits yet. Add your first habit and start your streak today."
            ctaLabel="+ Add a habit"
            ctaHref="/habits/new"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {(habits ?? []).slice(0, 4).map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                userId={user.id}
                isChecked={checkedIds.has(habit.id)}
              />
            ))}
          </div>
        )}
      </section>

      {goals && goals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-bento-text">
              Active goals
            </h2>
            <a href="/goals" className="text-xs text-stryde-primary">
              See all
            </a>
          </div>
          <div className="flex flex-col gap-2">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
