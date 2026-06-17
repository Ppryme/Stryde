import Link from "next/link";
import Button from "@/components/ui/button";

export default function EmptyState({ icon, message, ctaLabel, ctaHref, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
      <i className={`ti ti-${icon} text-4xl text-bento-muted`} aria-hidden="true" />
      <p className="text-sm max-w-[220px] leading-relaxed text-bento-muted">
        {message}
      </p>

      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-2 inline-flex min-h-[44px] items-center px-6 py-2.5 rounded-full text-sm font-semibold bg-stryde-primary text-white hover:bg-stryde-primary-dark transition-colors"
        >
          {ctaLabel}
        </Link>
      )}

      {ctaLabel && onCta && !ctaHref && (
        <Button onClick={onCta} className="mt-2 px-6 py-2.5 rounded-full text-sm">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
