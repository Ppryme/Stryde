// src/app/goals/page.jsx
// ─────────────────────────────────────────────
// GOALS LIST PAGE — shows all user goals
// Server component — fetches from Supabase
// Same pattern as habits/page.jsx
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import GoalCard from "@/components/goals/GoalCard";
import EmptyState from "@/components/ui/EmptyState";
import SignOutButton from "@/components/ui/Reusable/SignOutButton";

export const metadata = { title: "Goals" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Split into active vs history (completed/almost-there/missed/archived)
  const activeGoals = (goals ?? []).filter((g) => g.status === "active");
  const historyGoals = (goals ?? []).filter((g) => ["completed", "almost-there", "missed", "archived"].includes(g.status));

  return (
    <div className="px-4 pt-10 pb-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bento-text">
          Goals
        </h1>

        <div className="flex items-center gap-3">
          <Link
            href="/goals/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors"
          >
            Add
          </Link>
          <SignOutButton />
        </div>
        
      </div>

      {/* Empty state */}
      {(!goals || goals.length === 0) ? (
        <EmptyState
          icon="target"
          message="No goals set. Give your habits something to build toward."
          ctaLabel="+ Set a goal"
          ctaHref="/goals/new"
        />
      ) : (
        <div className="flex flex-col gap-6">

          {/* Active goals */}
          {activeGoals.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-bento-muted">
                Active Goals
              </h2>
              <div className="flex flex-col gap-2">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          {/* Goal History */}
          {historyGoals.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-bento-muted">
                Goal History
              </h2>
              <div className="flex flex-col gap-2">
                {historyGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
