// src/lib/auth.js
// ─────────────────────────────────────────────
// AUTH — all authentication actions
// Wraps Supabase auth so pages import from here,
// not directly from supabase (easier to swap later)
// ─────────────────────────────────────────────
import { getSupabase } from "./supabase";
import { db } from "./db";
import { clearLocalHabits } from "@/data/local/habitLocalData";
import { clearQueue } from "@/data/sync/syncQueue";

// Sign up with email + password
export async function signUp(email, password, name) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // stored in user_metadata
    },
  });
  return { data, error };
}

// Sign in with email + password
export async function signIn(email, password) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Sign in with Google OAuth
export async function signInWithGoogle(authType="sign-in") {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
     redirectTo: `${window.location.origin}/auth/callback?next=${authType}`,
    },
  });
  return { error };
}

// Sign up with Google OAuth
export async function signUpWithGoogle(authType="sign-up") {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
     redirectTo: `${window.location.origin}/auth/callback?next=${authType}`,
    },
  });
  return { error };
}

// Sign out
export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();

  try {
    await Promise.all([
      clearLocalHabits(),
      db.goals.clear(),
      db.checkIns.clear(),
      db.streaks.clear(),
      db.userStreaks.clear(),
      clearQueue(),
    ]);
  } catch (dbErr) {
    console.error("Failed to clear local DB on signOut:", dbErr);
  }

  return { error };
}

// Get the current logged-in user (client side)
export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
