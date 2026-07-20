// src/app/habits/new/page.jsx
// ─────────────────────────────────────────────
// NEW HABIT PAGE — wraps the HabitCreateForm
// Server component shell — client form inside
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import HabitCreateForm from "@/components/habits/HabitCreateForm";

export const metadata = { title: "New Habit" };

export default async function NewHabitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="px-4 pt-10 pb-6 max-w-2xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-xl font-bold text-bento-text">
          New habit
        </h1>
      </div>

      <HabitCreateForm userId={user.id} />
    </div>
  );
}
