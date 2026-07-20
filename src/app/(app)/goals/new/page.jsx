// src/app/goals/new/page.jsx
// ─────────────────────────────────────────────
// NEW GOAL PAGE — wraps the GoalCreateForm
// Server component shell — client form inside
// Same pattern as habits/new/page.jsx
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import GoalCreateForm from "@/components/goals/GoalCreateForm";

export const metadata = { title: "New Goal" };

export default async function NewGoalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Fetch user's habits so they can optionally link this goal to one
  const { data: habits } = await supabase
    .from("habits")
    .select("id, name, category")
    .eq("user_id", user.id)
    .eq("archived", false);

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
