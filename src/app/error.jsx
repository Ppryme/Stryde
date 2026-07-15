"use client";

import { useEffect } from "react";

/**
 * Root-level App Router error boundary.
 * Catches errors thrown outside the (app) route group — e.g. sign-in, sign-up, intro.
 */
export default function RootError({ error, reset }) {
  useEffect(() => {
    console.error("[RootError boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-bento-bg antialiased flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-14 h-14 mb-6 mx-auto rounded-2xl bg-bento-card border border-bento-border flex items-center justify-center">
            <svg className="w-7 h-7 text-stryde-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-bento-text mb-2">Oops — something broke</h1>
          <p className="text-sm text-bento-muted mb-8">
            A critical error occurred. Please try again.
          </p>

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-stryde-primary text-white text-sm font-semibold hover:bg-stryde-primary-dark transition-all"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
