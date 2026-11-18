// src/app/habits/new/page.jsx
// ─────────────────────────────────────────────
// NEW HABIT PAGE — wraps the HabitCreateForm
// Server component shell — client form inside
// ─────────────────────────────────────────────
import { requireOnboardedUser } from "@/lib/auth-server";
import HabitCreateForm from "@/components/habits/HabitCreateForm";

export const metadata = { title: "New Habit" };

export default async function NewHabitPage() {
  const user = await requireOnboardedUser();

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
