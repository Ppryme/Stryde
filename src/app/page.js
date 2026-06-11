// src/app/page.jsx
// ─────────────────────────────────────────────
// DASHBOARD — home screen (returning user)
// Shows: greeting, progress ring, today's habits preview, streak summary
// This is a SERVER component — data fetching happens here
// ─────────────────────────────────────────────
import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ProgressRing from "@/components/ui/ProgressRing";
import StreakBadge from "@/components/streaks/StreakBadge";
import HabitCard from "@/components/habits/HabitCard";
import EmptyState from "@/components/ui/EmptyState";
import GoalCard from "@/components/goals/GoalCard";

// Helper — returns "Good morning" / "afternoon" / "evening"
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = createServerClient();

  // ── Auth check ──────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  // ── Fetch today's habits ────────────────────
  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .eq("frequency", "daily")
    .order("order_index", { ascending: true });

  // ── Fetch today's check-ins ─────────────────
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("habit_id, completed")
    .eq("user_id", user.id)
    .eq("date", today);

  const checkedIds = new Set(
    (checkIns ?? []).filter((c) => c.completed).map((c) => c.habit_id)
  );

  const totalHabits    = habits?.length ?? 0;
  const completedCount = checkedIds.size;

  // ── Fetch active goals (max 2 for dashboard) ─
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(2);

  return (
    <div className="px-4 pt-10 pb-6 flex flex-col gap-6">

      {/* ── Greeting header ─────────────────── */}
      <div>
        <p className="text-sm" style={{ color: "var(--color-bento-muted)" }}>
          {getGreeting()}
        </p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: "var(--color-bento-text)" }}>
          {user.user_metadata?.name ?? "Let's get to work."}
        </h1>
      </div>

      {/* ── Progress ring + streak row ───────── */}
      <div
        className="flex items-center justify-between rounded-2xl p-5"
        style={{ background: "var(--color-bento-card)", border: "1px solid var(--color-bento-border)" }}
      >
        <ProgressRing total={totalHabits} completed={completedCount} size={110} />
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--color-bento-muted)" }}>Today</p>
            <p className="text-lg font-bold" style={{ color: "var(--color-bento-text)" }}>
              {completedCount}/{totalHabits} done
            </p>
          </div>
          <StreakBadge userId={user.id} />
        </div>
      </div>

      {/* ── Today's habits (preview, max 4) ─── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-bento-text)" }}>
            Today's habits
          </h2>
          <a href="/habits" className="text-xs" style={{ color: "var(--color-stryde-primary)" }}>
            See all →
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

      {/* ── Active goals preview ─────────────── */}
      {goals && goals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--color-bento-text)" }}>
              Active goals
            </h2>
            <a href="/goals" className="text-xs" style={{ color: "var(--color-stryde-primary)" }}>
              See all →
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
