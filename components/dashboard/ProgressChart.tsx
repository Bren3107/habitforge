"use client";

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { HistoryEntry } from "@/lib/api";

interface ProgressChartProps {
  history: HistoryEntry[];
}

function buildChartData(history: HistoryEntry[]) {
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (27 - i));
    return d.toISOString().split("T")[0];
  });

  return days.map((date) => {
    const entry = history.find((h) => h.date === date);
    const isPast = new Date(date) < new Date(today.toISOString().split("T")[0]);
    return {
      date,
      xp: entry?.xp_earned ?? 0,
      completed: entry?.completed ?? false,
      isFuture: !entry && !isPast,
    };
  });
}

export function ProgressChart({ history }: ProgressChartProps) {
  const data = buildChartData(history);

  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <p className="text-sm font-bold text-[var(--text-primary)] mb-4">28-day overview</p>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} barSize={8} barCategoryGap="20%">
          <Tooltip
            formatter={(value: number) => [`${value} XP`, "XP"]}
            labelFormatter={(label: string) => label}
            contentStyle={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 11,
            }}
          />
          <Bar dataKey="xp" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isFuture
                    ? "var(--bg-raised)"
                    : entry.completed
                    ? "var(--accent-ember)"
                    : "var(--error)"
                }
                fillOpacity={entry.isFuture ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 text-xs text-[var(--text-secondary)]">
        <span><span style={{ color: "var(--accent-ember)" }}>■</span> Completed</span>
        <span><span style={{ color: "var(--error)" }}>■</span> Missed</span>
        <span className="opacity-40">■ Upcoming</span>
      </div>
    </div>
  );
}
