// src/components/analytics/HeatmapCalendar.jsx
// ─────────────────────────────────────────────
// HEATMAP CALENDAR — GitHub-style 365 day grid
// Color intensity = completion rate for that day
// ─────────────────────────────────────────────
"use client";
import { HEATMAP_COLORS } from "@/lib/design-token";

export default function HeatmapCalendar({ checkIns }) {
  // Build a map of { 'YYYY-MM-DD': completionRate }
  const byDate = {};
  checkIns.forEach((c) => {
    if (!byDate[c.date]) byDate[c.date] = { total: 0, done: 0 };
    byDate[c.date].total++;
    if (c.completed) byDate[c.date].done++;
  });

  // Generate last 364 days
  const days = [];
  for (let i = 363; i >= 0; i--) {
    const d    = new Date(Date.now() - i * 86_400_000);
    const key  = d.toISOString().split("T")[0];
    const data = byDate[key];
    const rate = data ? data.done / data.total : 0;
    days.push({ key, rate });
  }

  function colorForRate(rate) {
    if (rate === 0) return "var(--color-bento-border)";
    if (rate <= 0.25) return HEATMAP_COLORS[0];
    if (rate <= 0.5)  return HEATMAP_COLORS[1];
    if (rate <= 0.75) return HEATMAP_COLORS[2];
    if (rate < 1)     return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
  }

  return (
    <div
      className="p-4 rounded-2xl overflow-x-auto"
      style={{ background: "var(--color-bento-card)", border: "1px solid var(--color-bento-border)" }}
    >
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(52, 12px)", gridTemplateRows: "repeat(7, 12px)" }}
      >
        {days.map((day) => (
          <div
            key={day.key}
            title={`${day.key} — ${Math.round(day.rate * 100)}% complete`}
            className="rounded-sm"
            style={{ width: 12, height: 12, background: colorForRate(day.rate) }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px]" style={{ color: "var(--color-bento-muted)" }}>Less</span>
        {[..."01234"].map((_, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{ width: 10, height: 10, background: i === 0 ? "var(--color-bento-border)" : HEATMAP_COLORS[i - 1] }}
          />
        ))}
        <span className="text-[10px]" style={{ color: "var(--color-bento-muted)" }}>More</span>
      </div>
    </div>
  );
}
