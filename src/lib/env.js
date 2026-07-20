// src/lib/env.js
// ─────────────────────────────────────────────
// ENV VALIDATOR — validates critical environment variables on startup.
//
// IMPORTANT: Next.js statically replaces process.env.NEXT_PUBLIC_* only when
// accessed as literal string keys. Dynamic bracket access (process.env[key])
// always returns undefined in client bundles. We MUST use static literals here.
// ─────────────────────────────────────────────

export function validateEnv() {
  const isServer = typeof window === "undefined";

  // ── Static literal access (required for Next.js client bundles) ──────────
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing = [];
  if (!supabaseUrl  || supabaseUrl.trim()  === "") missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseKey  || supabaseKey.trim()  === "") missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    const msg =
      `[Stryde] Missing required environment variables:\n  ${missing.join("\n  ")}` +
      `\n\nSet them in .env.local and restart the dev server.`;

    if (isServer) {
      // Hard-fail on the server so broken deploys surface immediately.
      throw new Error(msg);
    } else {
      console.error(msg);
      // Alert only in development — production should show a proper error page.
      if (process.env.NODE_ENV === "development") {
        alert(`Configuration error:\n${msg}`);
      }
    }
    return false;
  }

  // ── Server-only security check ───────────────────────────────────────────
  // Catch accidental NEXT_PUBLIC_ prefix on the service-role key, which would
  // expose full DB access to every browser that visits the site.
  if (isServer && process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[Stryde] SECURITY: SUPABASE_SERVICE_ROLE_KEY is exposed as a public env var. " +
      "Remove the NEXT_PUBLIC_ prefix immediately."
    );
  }

  return true;
}
