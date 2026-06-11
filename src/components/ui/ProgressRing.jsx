// src/components/ui/ProgressRing.jsx
// ─────────────────────────────────────────────
// PROGRESS RING — circular SVG progress indicator
// Used on dashboard to show today's habit completion %
// Props: total (number), completed (number), size (px), stroke (px)
// ─────────────────────────────────────────────
export default function ProgressRing({ total, completed, size = 120, stroke = 8 }) {
  const radius       = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct          = total === 0 ? 0 : Math.round((completed / total) * 100);
  const offset       = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* SVG ring — rotated so progress starts from top */}
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--color--stryde-primary-light)"
          strokeWidth={stroke}
        />
        {/* Filled progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--color--stryde-primary)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>

      {/* Center text — absolute overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold leading-none"
          style={{ color: "var(--color--stryde-primary)" }}
        >
          {pct}%
        </span>
        <span className="text-[11px] mt-0.5" style={{ color: "var(--color-bento-muted)" }}>
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}
