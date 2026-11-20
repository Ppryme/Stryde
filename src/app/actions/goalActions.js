"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { insertGoalRemote } from "@/data/remote/goalRemoteData";

/**
 * Server Action: create a new goal, invalidate the server cache for both
 * /dashboard and /goals, then redirect to /goals.
 *
 * Using a Server Action guarantees that revalidatePath() runs on the server
 * BEFORE the redirect happens, so the dashboard always shows the new goal
 * the next time it is rendered — no client-side race condition.
 */
export async function createGoalAction(payload) {
  const supabase = await createClient();

  try {
    await insertGoalRemote(supabase, payload);
  } catch (error) {
    // Return an error object so the client can display it
    return { error: error.message };
  }

  // Bust the server-side RSC cache for both pages that display goals
  revalidatePath("/dashboard", "page");
  revalidatePath("/goals", "page");

  // redirect() throws internally — must be called outside try/catch
  redirect("/goals");
}
