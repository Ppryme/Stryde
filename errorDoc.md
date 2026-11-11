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
