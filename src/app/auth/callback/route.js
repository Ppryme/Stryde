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
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const authPage = next === "sign-up" ? "sign-up" : "sign-in";

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

if (!error) {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        `${origin}/sign-in?error=auth_failed`
      );
    }

    if (user.user_metadata?.onboarded) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    return NextResponse.redirect(`${origin}/onboarding`);

  } catch (err) {
    console.error("Failed to retrieve authenticated user:", err);

    return NextResponse.redirect(
       `${origin}/${authPage}?error=auth_failed`
    );
  }

} } }