import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getLocalDateString, getGreeting } from "@/lib/date";
import CheckInList from "@/components/checkin/checkInList";
import SignOutButton from "@/components/ui/Reusable/SignOutButton";

export const metadata = { title: "Check in" };

export default async function CheckInPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    .select("habit_id, completed, note")
    .eq("user_id", user.id)
    .eq("date", today);

  const checkInMap = {};
  (checkIns ?? []).forEach((c) => {
    checkInMap[c.habit_id] = { completed: c.completed, note: c.note };
  });

  return (
    <div className="px-4 pt-10 pb-6 mx-auto max-w-6xl sm:px-6 lg:px-8">
      {/* Header */}
      <p className="text-sm mb-0.5 text-bento-muted">
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
      </p>
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-1 text-bento-text">
          {getGreeting()}
        </h1>
        <span>
          <SignOutButton />
        </span>
      </div>

      <p className="text-sm mb-6 text-bento-muted">
        Your streak is on the line.
      </p>

      {/* Habit list handles both the progress bar and toggling interactively */}
      <CheckInList
        habits={habits ?? []}
        checkInMap={checkInMap}
        userId={user.id}
        today={today}
      />
    </div>
  );
}