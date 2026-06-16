// src/app/auth/callback/route.js
// ─────────────────────────────────────────────
// AUTH CALLBACK — handles OAuth redirect from Google
// Supabase sends the user back to this URL after Google login
// We exchange the code for a session, then redirect to dashboard
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, go back to onboarding
  return NextResponse.redirect(`${origin}/onboarding?error=auth_failed`);
}
