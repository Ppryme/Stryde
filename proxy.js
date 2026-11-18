// proxy.js
// ─────────────────────────────────────────────
// PROXY / MIDDLEWARE — route protection
// Runs on every request BEFORE the page loads
// Redirects unauthenticated users to /sign-in
// ─────────────────────────────────────────────
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Public route prefixes that DON'T need a logged-in user
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/auth/callback", "/terms", "/privacy"];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes through without checking auth:
  // Root "/" is exact (landing / auth dispatch); others match by prefix
  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublic) {
    return NextResponse.next();
  }

  // Create a Supabase client that can read/write cookies in proxy
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

  // Not logged in → send to login
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
