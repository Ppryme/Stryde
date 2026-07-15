"use client";

import { useEffect } from "react";

/**
 * App Router error boundary for the (app) route group.
 * Catches errors thrown during rendering in any child route.
 */
export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("[AppError boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-bento-bg">
      <div className="w-14 h-14 mb-6 rounded-2xl bg-bento-card border border-bento-border flex items-center justify-center">
        <svg className="w-7 h-7 text-stryde-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-bento-text mb-2">Something went wrong</h1>
      <p className="text-sm text-bento-muted max-w-xs mb-8">
        An unexpected error occurred. Your data is safe — try again or reload the app.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="w-full py-3 rounded-xl bg-stryde-primary text-white text-sm font-semibold hover:bg-stryde-primary-dark active:scale-[0.98] transition-all"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="w-full py-3 rounded-xl border border-bento-border text-bento-muted text-sm font-semibold text-center hover:bg-bento-card transition-all"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
