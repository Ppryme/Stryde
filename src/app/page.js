
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { createClient } from "@/lib/supabase-server";
import LandingPage from "./Intro/page";


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
