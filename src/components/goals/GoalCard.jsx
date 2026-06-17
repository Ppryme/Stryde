import Badge from "@/components/ui/badge";

const STATUS_VARIANT = {
  active: "info",
  completed: "success",
  paused: "warning",
  abandoned: "danger",
};

export default function GoalCard({ goal }) {
  const variant = STATUS_VARIANT[goal.status] ?? "info";

  return (
    <div className="p-4 rounded-2xl bg-bento-card border border-bento-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold truncate pr-2 text-bento-text">
          {goal.title}
        </p>
        <Badge variant={variant} className="capitalize flex-shrink-0">
          {goal.status}
        </Badge>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-2 bg-bento-border">
        <div
          className="h-full rounded-full transition-all duration-500 bg-stryde-primary"
          style={{ width: `${goal.progress_pct ?? 0}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-bento-muted">
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
