// src/app/habits/new/page.jsx
// ─────────────────────────────────────────────
// NEW HABIT PAGE — wraps the HabitCreateForm
// Server component shell — client form inside
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import HabitCreateForm from "@/components/habits/HabitCreateForm";
import Link from "next/link";

export const metadata = { title: "New Habit" };

export default async function NewHabitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  return (
    <div className="px-4 pt-10 pb-6">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/habits"
          className="flex items-center justify-center w-9 h-9 rounded-full"
          style={{ background: "var(--color-bento-card)", border: "1px solid var(--color-bento-border)" }}
        >
          <i className="ti ti-arrow-left" style={{ color: "var(--color-bento-text)" }} aria-hidden="true" />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-bento-text)" }}>
          New habit
        </h1>
      </div>

      <HabitCreateForm userId={user.id} />
    </div>
  );
}
