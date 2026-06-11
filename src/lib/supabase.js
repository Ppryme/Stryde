// src/lib/supabase.js
// ─────────────────────────────────────────────
// SUPABASE — browser client (used in Client Components)
// Singleton pattern — one instance shared across the app
// ─────────────────────────────────────────────
import { createBrowserClient } from "@supabase/ssr";

let client;

export function getSupabase() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return client;
}
