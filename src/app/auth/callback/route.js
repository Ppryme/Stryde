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

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

       console.log("EXCHANGE ERROR:", error);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

        console.log("CALLBACK USER:", user);

      if (user?.user_metadata?.onboarded) {
        console.log(
          "REDIRECT TARGET:",
          user?.user_metadata?.onboarded ? "/" : "/onboarding"
        );
        return NextResponse.redirect(`${origin}/`);
        
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(
    `${origin}/sign-in?error=auth_failed`
  );
}

