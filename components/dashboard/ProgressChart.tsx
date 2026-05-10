"use client";

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { HistoryEntry } from "@/lib/api";

interface ProgressChartProps {
  history: HistoryEntry[];
  planCreatedAt: string;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function localStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return localStr(new Date());
}

function buildChartData(history: HistoryEntry[], planCreatedAt: string) {
  const start = new Date(planCreatedAt);
  start.setHours(0, 0, 0, 0);
  const today = todayStr();

  return Array.from({ length: 28 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = localStr(d);

    const entry = history.find((h) => h.date === dateStr);
    const isFuture = dateStr > today;
    const isToday = dateStr === today;
    const completed = entry?.completed ?? false;
    const xp = entry?.xp_earned ?? 0;
    const isMissed = !isFuture && !isToday && !completed;
    const isPending = isToday && !completed;

    return {
      date: dateStr,
      dayLetter: DAY_LETTERS[d.getDay()],
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      month: MONTH_NAMES[d.getMonth()],
      dayIndex: i,
      xp,
      displayXp: isFuture || isPending ? 3 : xp > 0 ? xp : isMissed ? 5 : 3,
      completed,
      isFuture: isFuture || isPending,
      isToday,
      isMissed,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTick({ x, y, payload, data }: any) {
  const entry = data[payload.index];
  if (!entry) return null;

  // Show letter for every day, but only show date number on week boundaries (every 7th)
  const showDate = entry.dayIndex % 7 === 0;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fontSize={9}
        fill={entry.isToday ? "var(--accent-ember)" : "var(--text-secondary)"}
        fontWeight={entry.isToday ? "700" : "400"}
        opacity={entry.isFuture ? 0.35 : 0.7}
      >
        {entry.dayLetter}
      </text>
      {showDate && (
        <text
          x={0}
          y={0}
          dy={22}
          textAnchor="middle"
          fontSize={8}
          fill="var(--text-secondary)"
          opacity={0.45}
        >
          {entry.dayNum}
        </text>
      )}
    </g>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const label = `${d.dayName}, ${d.month} ${d.dayNum}`;
  const status = d.isFuture && !d.isToday
    ? "Upcoming"
    : d.isToday && !d.completed
    ? "Today — not yet done"
    : d.completed
    ? `Completed · +${d.xp} XP`
    : "Missed";

  return (
    <div
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 11,
        color: "var(--text-primary)",
        lineHeight: 1.6,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p
        style={{
          color: d.completed
            ? "var(--accent-ember)"
            : d.isFuture
            ? "var(--text-secondary)"
            : "var(--error)",
        }}
      >
        {status}
      </p>
    </div>
  );
}

export function ProgressChart({ history, planCreatedAt }: ProgressChartProps) {
  const data = buildChartData(history, planCreatedAt);
  const completedCount = data.filter((d) => d.completed).length;
  const totalPast = data.filter((d) => !d.isFuture).length;

  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">28-day overview</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--accent-ember)", fontWeight: 600 }}>{completedCount}</span>
          {" / "}{totalPast} days completed
        </p>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={data} barSize={7} barCategoryGap="18%" margin={{ bottom: 20 }}>
          <XAxis
            dataKey="dayLetter"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={(props) => <CustomTick {...props} data={data} />}
            height={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="displayXp" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isToday && !entry.completed
                    ? "var(--accent-ember)"
                    : entry.isFuture
                    ? "var(--border)"
                    : entry.completed
                    ? "var(--accent-ember)"
                    : "var(--error)"
                }
                fillOpacity={entry.isFuture ? 0.25 : entry.isToday && !entry.completed ? 0.4 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span><span style={{ color: "var(--accent-ember)" }}>■</span> Completed</span>
        <span><span style={{ color: "var(--error)" }}>■</span> Missed</span>
        <span style={{ opacity: 0.4 }}>■ Upcoming</span>
      </div>
    </div>
  );
}
