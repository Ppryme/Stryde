// src/lib/env.js
// ─────────────────────────────────────────────
// ENV VALIDATOR — validates environment variables on startup
// ─────────────────────────────────────────────

export function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("CRITICAL CONFIGURATION ERROR: Supabase environment variables are missing!");
    if (typeof window !== "undefined") {
      alert("Missing configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env file.");
    }
    return false;
  }
  return true;
}
