// src/components/ui/EmptyState.jsx
// ─────────────────────────────────────────────
// EMPTY STATE — shown when a list has no items
// Props:
//   icon      — Tabler icon name (without "ti-" prefix)
//   message   — text to display
//   ctaLabel  — optional button label
//   ctaHref   — optional link (uses <a>) OR
//   onCta     — optional click handler (uses <button>)
// ─────────────────────────────────────────────
import Link from "next/link";

export default function EmptyState({ icon, message, ctaLabel, ctaHref, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
      <i
        className={`ti ti-${icon} text-4xl`}
        style={{ color: "var(--color-bento-muted)" }}
        aria-hidden="true"
      />
      <p
        className="text-sm max-w-[220px] leading-relaxed"
        style={{ color: "var(--color-bento-muted)" }}
      >
        {message}
      </p>

      {/* CTA — renders as Link if href given, otherwise button */}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "var(--color--stryde-primary)", color: "#fff" }}
        >
          {ctaLabel}
        </Link>
      )}

      {ctaLabel && onCta && !ctaHref && (
        <button
          onClick={onCta}
          className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "var(--color--stryde-primary)", color: "#fff" }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
