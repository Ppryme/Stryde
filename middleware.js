// src/middleware.js  ← must be at src/ root, NOT inside /app
// ─────────────────────────────────────────────
// MIDDLEWARE — route protection
// Runs on every request BEFORE the page loads
// Redirects unauthenticated users to /sign-in
// ─────────────────────────────────────────────
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Routes that DON'T need a logged-in user
const PUBLIC_ROUTES = ["/sign-in", "/sign-up", "/auth/callback", "/terms", "/privacy"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without checking auth
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Create a Supabase client that can read/write cookies in middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name)              { return request.cookies.get(name)?.value; },
        set(name, value, opts) { response.cookies.set({ name, value, ...opts }); },
        remove(name, opts)     { response.cookies.set({ name, value: "", ...opts }); },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → send to onboarding/login
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return response;
}

// Which routes this middleware runs on
export const config = {
  matcher: [
    // Run on everything EXCEPT static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)",
  ],
};
