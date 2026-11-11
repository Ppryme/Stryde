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

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without checking auth
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }



  // Create a Supabase client that can read/write cookies in middleware
let response = NextResponse.next({ request });

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        // Update cookies on the incoming request
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Recreate the response with the updated request
        response = NextResponse.next({ request });

        // Send updated cookies back to the browser
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
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
