import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "@/components/intro/LandingPage";
import { getUser } from "@/lib/auth-server";

const LANDING_SEEN_COOKIE = "stryde_landing_seen";

async function getStarted() {
  "use server";

  const cookieStore = await cookies();

  cookieStore.set(LANDING_SEEN_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.user_metadata?.onboarded) {
    redirect("/dashboard");
  } else {
    redirect("/onboarding");
  }
}

export default async function HomePage() {
  const user = await getUser();

  if (user?.user_metadata?.onboarded) {
    redirect("/dashboard");
  }

  if (user && !user.user_metadata?.onboarded) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const hasSeenLanding = cookieStore.get(LANDING_SEEN_COOKIE)?.value === "true";

  if (hasSeenLanding) {
    redirect("/sign-in");
  } 

  return <LandingPage getStarted={getStarted} />;
}
