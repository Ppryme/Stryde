# Stryde Error Log

This document tracks issues, bugs, and errors encountered during development, along with their causes and solutions in concise bullet points.

---

## 1. Next.js Infinite Loading State

* **Issue:** 
  * App got stuck in an infinite loading state (loading spinner / `loading.jsx` never resolving) during navigation and server actions.
* **Root Causes:**
  * **Catching `redirect()`:** In Next.js App Router, `redirect()` intentionally throws an internal `NEXT_REDIRECT` error. Wrapping it in a broad `try...catch` catches this error, swallowing the redirect and freezing navigation in a pending state.
  * **Unresolved Server Component Promises:** Asynchronous calls (e.g. `supabase.auth.getUser()`) awaiting responses without fallback/timeout caused the Suspense boundary (`loading.jsx`) to hang indefinitely.
  * **Global Loading State Leak:** Global loading triggers (`showLoading()`) in state stores (Zustand) not reliably cleared by `hideLoading()` on failed transitions or early exits.
  * **Cookie Mismatch / Redirect Loops:** Mismatch between cookie identifiers (e.g. `stryde_landing_seen` vs `stryde_landingpage_seen`) leading to conflicting redirect conditions between `/`, `/sign-in`, and `/sign-up`.
* **Fix & Prevention:**
  * Never wrap Next.js `redirect()` in a `try...catch` block; if inside a `try`, rethrow the error if `error.digest?.startsWith("NEXT_REDIRECT")` or call `redirect()` outside the `try...catch`.
  * Ensure all server fetch/auth calls have appropriate error handling and timeouts.
  * Always invoke `hideLoading()` inside `finally` blocks or on route change listeners (`ResetGlobalLoading`).
  * Ensure consistent cookie naming and deterministic redirect logic across routes.

---

## 2. Silent Empty States on Supabase Query Errors

* **Issue:**
  * When a network drop, query timeout, or Supabase error/RLS violation occurred, server components silently rendered empty states (e.g., displaying "No goals set" or 0 habits), leading users to believe their data was lost or deleted.
* **Root Causes:**
  * Server components destructured `{ data }` while omitting `{ error }` from Supabase queries without error checking (e.g. `const { data: habits } = await supabase.from(...).select(...)`).
  * On error, `data` was `null`, causing code to fall back to `[]` and render empty states instead of triggering an error boundary.
* **Fix & Prevention:**
  * Always destructure `{ data, error }` from Supabase server queries.
  * Run independent queries in parallel using `Promise.all` and verify the `error` property on each result.
  * Throw explicit descriptive errors on failure so the Next.js `(app)/error.jsx` boundary catches them and displays a user-friendly error UI with a "Try again" action.

---

## 3. Global Loading Overlay on Navigation ("Syncing offline changes...")

* **Issue:**
  * Deleting a habit on the dashboard and then clicking the "+" icon to navigate to `/habits/new` triggered a blocking global loading overlay with "Syncing offline changes..." for over 800ms.
* **Root Causes:**
  * **Unfiltered `user_id` query:** `archiveHabitRemote` unconditionally chained `.eq("user_id", userId)` when `userId` was not provided, generating an invalid query (`user_id=eq.undefined`) that caused Supabase to reject the online delete.
  * **Fallback Queue Pollution:** Because the online call failed, `HabitRepository` enqueued an `ARCHIVE_HABIT` item into IndexedDB `db.queue` even while online.
  * **Hard Navigation:** The "+" button used `<a href="/habits/new">` instead of Next.js `<Link>`, causing a full page remount of `<AppShell>`.
  * **Blocking Sync in AppShell:** `AppShell` checked `db.queue.toArray()` on mount, saw the queued item, and called `showLoading("Syncing offline changes...")` with an artificial 800ms minimum delay, directly violating `ARCHITECTURE.md`'s rule against blocking the UI for background sync.
* **Fix & Prevention:**
  * In `habitRemoteData.js`, conditionally apply the `user_id` filter only when `userId` is defined (`if (userId) query = query.eq("user_id", userId)`).
  * In `AppShell.jsx`, run `syncQueue()` silently in the background without invoking `showLoading()` or artificial timeouts.
  * In `DashboardClient.jsx` and `checkInList.jsx`, replace `<a href="/habits/new">` with Next.js `<Link href="/habits/new">` for smooth client-side routing.

---
