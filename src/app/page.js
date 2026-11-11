
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import LandingPage from "@/components/intro/LandingPage"


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

  let user;

  try {
    const supabase = await createClient();

    const {
      data: { user: authenticatedUser },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    user = authenticatedUser;

  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  if (!user) {
    redirect("/sign-up");
  }
}



export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user?.user_metadata?.onboarded) {
   redirect("/dashboard") ;
  }

  const cookieStore = await cookies();
  const hasSeenLanding = cookieStore.get(LANDING_SEEN_COOKIE)?.value === "true";

  if (hasSeenLanding) {
    redirect("/sign-in");
  }

  return <LandingPage getStarted={getStarted} />;
}
