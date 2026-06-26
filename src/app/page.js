import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { createClient } from "@/lib/supabase-server";

const LANDING_SEEN_COOKIE = "stryde_landing_seen";

async function getStarted() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set(LANDING_SEEN_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.user_metadata?.onboarded) {
    redirect("/onboarding");
  }

  redirect("/");
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-bento-bg text-bento-text flex items-center justify-center px-6">
      <section className="w-full max-w-sm flex flex-col items-center text-center gap-8">
        <img
          src="/stryde-logo%20.png"
          alt="Stryde logo"
          className="h-20 w-20 rounded-2xl object-contain"
        />

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold">Welcome to Stryde</h1>
          <p className="text-base font-medium text-bento-muted">
            Build streaks. Not excuses.
          </p>
        </div>

        <form action={getStarted} className="w-full">
          <button
            type="submit"
            className="w-full rounded-xl bg-stryde-primary px-5 py-4 text-sm font-semibold text-white"
          >
            Get Started
          </button>
        </form>
      </section>
    </main>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.user_metadata?.onboarded) {
    return <DashboardHome user={user} />;
  }

  if (user) {
    return <LandingPage />;
  }

  const cookieStore = await cookies();
  const hasSeenLanding = cookieStore.get(LANDING_SEEN_COOKIE)?.value === "true";

  if (hasSeenLanding) {
    redirect("/sign-in");
  }

  return <LandingPage />;
}
