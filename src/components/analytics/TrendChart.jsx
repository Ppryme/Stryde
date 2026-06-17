"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrendChart({ checkIns }) {
  const byWeek = {};
  checkIns.forEach((c) => {
    const d = new Date(c.date);
    const week = getWeekKey(d);
    if (!byWeek[week]) byWeek[week] = { total: 0, done: 0, label: week };
    byWeek[week].total++;
    if (c.completed) byWeek[week].done++;
  });

  const data = Object.values(byWeek)
    .slice(-12)
    .map((w) => ({
      week: w.label,
      rate: w.total === 0 ? 0 : Math.round((w.done / w.total) * 100),
    }));

  return (
    <div className="p-4 rounded-2xl bg-bento-card border border-bento-border">
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bento-border)" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--color-bento-muted)" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--color-bento-muted)" }} unit="%" />
          <Tooltip content={<ChartTooltip />} formatter={(val) => [`${val}%`, "Completion"]} />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="var(--color-stryde-primary)"
            strokeWidth={2}
            dot={{ fill: "var(--color-stryde-primary)", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-bento-border bg-bento-card px-3 py-2 text-xs text-bento-text shadow-lg">
      <p>{payload[0].value}% Completion</p>
    </div>
  );
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
