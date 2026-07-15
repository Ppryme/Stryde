import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getLocalDateString, getGreeting } from "@/lib/date";
import DashboardClient from "@/components/dasboard/DashboardClient";
import GoalCard from "@/components/goals/GoalCard";
import SignOutButton from "@/components/ui/Reusable/SignOutButton";

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const today = getLocalDateString();

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

  const checkedIds = (checkIns ?? [])
    .filter((c) => c.completed)
    .map((c) => c.habit_id);

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(2);

  return (
    <div className="px-4 pt-10 pb-6 flex flex-col gap-6 mx-auto max-w-6xl sm:px-6 lg:px-8">
      <div>
        <div className="flex justify-between">
          <p className="text-sm text-bento-muted">{getGreeting()}</p>
          <SignOutButton />
        </div>

        <h1 className="text-2xl font-bold mt-0.5 text-bento-text">
          {user.user_metadata?.name ?? "Let's get to work."}
        </h1>
      </div>

      {/* Unified Interactive Client Section */}
      <DashboardClient
        userId={user.id}
        initialHabits={habits ?? []}
        initialCheckedIds={checkedIds}
      />

      {goals && goals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-bento-text">
              Active goals
            </h2>
            <div className="flex items-center gap-2">
              <a
                href="/goals/new"
                className="flex items-center justify-center p-1 rounded-md text-bento-muted hover:text-stryde-primary hover:bg-bento-border transition-all"
                aria-label="Create a goal"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </a>
              <a href="/goals" className="text-xs text-stryde-primary">
                See all
              </a>
            </div>
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