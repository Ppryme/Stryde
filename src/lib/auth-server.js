import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

/**
 * Retrieves the current authenticated user on the server.
 * Returns null if not authenticated or on error.
 */
export async function getUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.error("getUser error:", err);
    return null;
  }
}

/**
 * Ensures an authenticated user exists on the server.
 * Redirects to `redirectTo` if unauthenticated.
 */
export async function requireUser(redirectTo = "/sign-in") {
  const user = await getUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Ensures an authenticated AND onboarded user exists on the server.
 * Redirects unauthenticated users to `redirectToAuth`,
 * and authenticated but un-onboarded users to `redirectToOnboarding`.
 */
export async function requireOnboardedUser(
  redirectToAuth = "/sign-in",
  redirectToOnboarding = "/onboarding"
) {
  const user = await requireUser(redirectToAuth);

  if (!user.user_metadata?.onboarded) {
    redirect(redirectToOnboarding);
  }

  return user;
}
