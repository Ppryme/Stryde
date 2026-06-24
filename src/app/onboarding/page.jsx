import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (user.user_metadata?.onboarded) {
    redirect("/");
  }

  return <OnboardingClient />;
}
