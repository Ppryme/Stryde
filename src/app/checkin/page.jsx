// src/app/checkin/page.jsx
// ─────────────────────────────────────────────
// CHECK-IN PAGE — daily habit completion screen
// The core loop: user opens this and taps habits done
// Server fetches habits + today's check-ins
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import CheckInList from "@/components/checkin/checkInList";

export const metadata = { title: "Check in" };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function CheckInPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const today = new Date().toISOString().split("T")[0];

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .eq("frequency", "daily")
    .order("order_index", { ascending: true });

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("habit_id, completed, note")
    .eq("user_id", user.id)
    .eq("date", today);

  // Build a map: { habitId: { completed, note } }
  const checkInMap = {};
  (checkIns ?? []).forEach((c) => {
    checkInMap[c.habit_id] = { completed: c.completed, note: c.note };
  });

  const totalHabits    = habits?.length ?? 0;
  const completedCount = Object.values(checkInMap).filter((c) => c.completed).length;

  return (
    <div className="px-4 pt-10 pb-6">

      {/* Header */}
      <p className="text-sm mb-0.5" style={{ color: "var(--color-bento-muted)" }}>
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
      </p>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-bento-text)" }}>
        {getGreeting()}
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-bento-muted)" }}>
        Your streak is on the line.
      </p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--color-bento-muted)" }}>
          <span>{completedCount} of {totalHabits} done</span>
          <span>{totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bento-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:      `${totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0}%`,
              background: "var(--color--stryde-primary)",
            }}
          />
        </div>
      </div>

      {/* Habit list — client component handles toggling */}
      <CheckInList
        habits={habits ?? []}
        checkInMap={checkInMap}
        userId={user.id}
        today={today}
      />
    </div>
  );
}
