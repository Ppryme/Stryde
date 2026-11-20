// src/app/goals/new/page.jsx
// ─────────────────────────────────────────────
// NEW GOAL PAGE — wraps the GoalCreateForm
// Server component shell — client form inside
// Same pattern as habits/new/page.jsx
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { requireOnboardedUser } from "@/lib/auth-server";
import { fetchActiveHabitsForGoalLinking } from "@/data/remote/habitRemoteData";
import GoalCreateForm from "@/components/goals/GoalCreateForm";

export const metadata = { title: "New Goal" };

export default async function NewGoalPage() {
  const user = await requireOnboardedUser();
  const supabase = await createClient();

  // Fetch user's habits so they can optionally link this goal to one
  let habits = [];
  try {
    habits = await fetchActiveHabitsForGoalLinking(supabase, user.id);
  } catch (habitsError) {
    console.error("Error loading habits for new goal page:", habitsError);
    throw new Error(`Failed to load habits: ${habitsError.message}`);
  }

  return (
    <div className="px-4 pt-10 pb-6 max-w-2xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-xl font-bold text-bento-text">
          New goal
        </h1>
      </div>

      <GoalCreateForm userId={user.id} habits={habits ?? []} />
    </div>
  );
}
