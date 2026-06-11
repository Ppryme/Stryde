// src/components/goals/GoalCard.jsx
// ─────────────────────────────────────────────
// GOAL CARD — displays a single long-term goal
// Shows: title, progress bar, status badge, target date
// ─────────────────────────────────────────────
import { BADGE_VARIANTS } from "@/lib/design-token";

const STATUS_VARIANT = {
  active:    "info",
  completed: "success",
  paused:    "warning",
  abandoned: "danger",
};

export default function GoalCard({ goal }) {
  const variant = BADGE_VARIANTS[STATUS_VARIANT[goal.status] ?? "info"];

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: "var(--color-bento-card)", border: "1px solid var(--color-bento-border)" }}
    >
      {/* Title + status */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold truncate pr-2" style={{ color: "var(--color-bento-text)" }}>
          {goal.title}
        </p>
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0"
          style={{ background: variant.background, color: variant.text }}
        >
          {goal.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--color-bento-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${goal.progress_pct ?? 0}%`, background: "var(--color--stryde-primary)" }}
        />
      </div>

      {/* Progress % + target date */}
      <div className="flex justify-between text-[11px]" style={{ color: "var(--color-bento-muted)" }}>
        <span>{goal.progress_pct ?? 0}% complete</span>
        {goal.target_date && (
          <span>
            Due {new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}
