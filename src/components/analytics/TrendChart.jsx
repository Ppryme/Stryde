// src/components/analytics/TrendChart.jsx
// ─────────────────────────────────────────────
// TREND CHART — weekly completion rate line chart
// Uses Recharts (already in your package.json from prompt 4)
// ─────────────────────────────────────────────
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrendChart({ checkIns }) {
  // Group check-ins by week
  const byWeek = {};
  checkIns.forEach((c) => {
    const d    = new Date(c.date);
    const week = getWeekKey(d);
    if (!byWeek[week]) byWeek[week] = { total: 0, done: 0, label: week };
    byWeek[week].total++;
    if (c.completed) byWeek[week].done++;
  });

  const data = Object.values(byWeek)
    .slice(-12) // last 12 weeks
    .map((w) => ({
      week: w.label,
      rate: w.total === 0 ? 0 : Math.round((w.done / w.total) * 100),
    }));

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: "var(--color-bento-card)", border: "1px solid var(--color-bento-border)" }}
    >
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bento-border)" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#8E9299" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#8E9299" }} unit="%" />
          <Tooltip
            contentStyle={{
              background: "var(--color-bento-card)",
              border:     "1px solid var(--color-bento-border)",
              borderRadius: 8,
              fontSize:   12,
              color:      "var(--color-bento-text)",
            }}
            formatter={(val) => [`${val}%`, "Completion"]}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#534AB7"
            strokeWidth={2}
            dot={{ fill: "#534AB7", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // start of week (Sunday)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
