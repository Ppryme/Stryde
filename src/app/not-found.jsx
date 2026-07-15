/**
 * 404 Not Found page — App Router not-found.jsx.
 * Shown when notFound() is called or a route segment has no match.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-bento-bg">
      <div className="mb-6">
        <p className="text-7xl font-black text-stryde-primary/20 select-none">404</p>
      </div>

      <h1 className="text-xl font-bold text-bento-text mb-2">Page not found</h1>
      <p className="text-sm text-bento-muted max-w-xs mb-8">
        This page doesn&apos;t exist or has been moved. Head back to the dashboard and keep your streak alive.
      </p>

      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-stryde-primary text-white text-sm font-semibold hover:bg-stryde-primary-dark active:scale-[0.98] transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 5v6" />
        </svg>
        Back to Dashboard
      </a>
    </div>
  );
}
