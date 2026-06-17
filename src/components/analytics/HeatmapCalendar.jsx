"use client";

import { useState } from "react";
import { HEATMAP_COLORS } from "@/lib/design-token";

export default function HeatmapCalendar({ checkIns }) {
  const [todayMs] = useState(() => Date.now());
  const byDate = {};
  checkIns.forEach((c) => {
    if (!byDate[c.date]) byDate[c.date] = { total: 0, done: 0 };
    byDate[c.date].total++;
    if (c.completed) byDate[c.date].done++;
  });

  const days = [];
  for (let i = 363; i >= 0; i--) {
    const d = new Date(todayMs - i * 86_400_000);
    const key = d.toISOString().split("T")[0];
    const data = byDate[key];
    const rate = data ? data.done / data.total : 0;
    days.push({ key, rate });
  }

  function colorForRate(rate) {
    if (rate <= 0.25) return HEATMAP_COLORS[0];
    if (rate <= 0.5) return HEATMAP_COLORS[1];
    if (rate <= 0.75) return HEATMAP_COLORS[2];
    if (rate < 1) return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
  }

  return (
    <div className="p-4 rounded-2xl overflow-x-auto bg-bento-card border border-bento-border scrollbar-thin">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(52, 12px)", gridTemplateRows: "repeat(7, 12px)" }}
      >
        {days.map((day) => (
          <div
            key={day.key}
            title={`${day.key} - ${Math.round(day.rate * 100)}% complete`}
            className={`w-3 h-3 rounded-sm ${day.rate === 0 ? "bg-bento-border" : ""}`}
            style={day.rate === 0 ? undefined : { background: colorForRate(day.rate) }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-bento-muted">Less</span>
        {[..."01234"].map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-sm ${i === 0 ? "bg-bento-border" : ""}`}
            style={i === 0 ? undefined : { background: HEATMAP_COLORS[i - 1] }}
          />
        ))}
        <span className="text-[10px] text-bento-muted">More</span>
      </div>
    </div>
  );
}
