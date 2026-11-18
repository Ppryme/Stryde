import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const user = await requireUser();

  if (user.user_metadata?.onboarded) {
    redirect("/dashboard");
  }

  return <OnboardingClient />;
}
