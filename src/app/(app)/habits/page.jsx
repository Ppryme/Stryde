// src/app/habits/page.jsx
// ─────────────────────────────────────────────
// HABITS LIST PAGE — shows all user habits
// Server component — fetches from Supabase
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import HabitsClient from "@/components/habits/HabitsClient";

export const metadata = { title: "Habits" };

export default async function HabitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const today = new Date().toISOString().split("T")[0];

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("order_index", { ascending: true });

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("habit_id, completed")
    .eq("user_id", user.id)
    .eq("date", today);

  const checkedIds = (checkIns ?? [])
    .filter((c) => c.completed)
    .map((c) => c.habit_id);

  return (
    <div className="px-4 pt-10 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bento-text">
          Habits
        </h1>
        <Link
          href="/habits/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors"
        >
          <i className="ti ti-plus text-sm" aria-hidden="true" />
          Add
        </Link>
      </div>

      {/* List (Reactive Client Component) */}
      <HabitsClient
        initialHabits={habits ?? []}
        userId={user.id}
        initialCheckedIds={checkedIds}
      />
    </div>
  );
}
