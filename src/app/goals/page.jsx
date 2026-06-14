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

export const metadata = { title: "Goals" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Split into active vs completed/other for better organization
  const activeGoals = (goals ?? []).filter((g) => g.status === "active");
  const otherGoals  = (goals ?? []).filter((g) => g.status !== "active");

  return (
    <div className="px-4 pt-10 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-bento-text)" }}>
          Goals
        </h1>
        <Link
          href="/goals/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: "var(--color--stryde-primary)", color: "#fff" }}
        >
          <i className="ti ti-plus text-sm" aria-hidden="true" />
          Add
        </Link>
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
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-bento-muted)" }}>
                Active
              </h2>
              <div className="flex flex-col gap-2">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          {/* Other goals (completed/paused/abandoned) */}
          {otherGoals.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-bento-muted)" }}>
                Other
              </h2>
              <div className="flex flex-col gap-2">
                {otherGoals.map((goal) => (
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