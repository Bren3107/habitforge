import type { HistoryEntry } from "@/lib/api";

export interface WeekStats {
  week: number;
  completedDays: number;
  totalDays: number;
  completionRate: number;
}

export interface PatternAnalysis {
  totalDays: number;
  completedDays: number;
  overallCompletionRate: number;
  weekStats: WeekStats[];
  bestDayOfWeek: string | null;
  worstDayOfWeek: string | null;
  trend: "improving" | "declining" | "flat" | "insufficient_data";
  last7DayRate: number;
  prev7DayRate: number;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function analyzePatterns(history: HistoryEntry[]): PatternAnalysis {
  if (history.length === 0) {
    return {
      totalDays: 0,
      completedDays: 0,
      overallCompletionRate: 0,
      weekStats: [],
      bestDayOfWeek: null,
      worstDayOfWeek: null,
      trend: "insufficient_data",
      last7DayRate: 0,
      prev7DayRate: 0,
    };
  }

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const totalDays = sorted.length;
  const completedDays = sorted.filter((e) => e.completed).length;
  const overallCompletionRate = totalDays > 0 ? completedDays / totalDays : 0;

  // Week stats (group by 7-day chunks from the start)
  const weekStats: WeekStats[] = [];
  for (let i = 0; i < sorted.length; i += 7) {
    const chunk = sorted.slice(i, i + 7);
    const done = chunk.filter((e) => e.completed).length;
    weekStats.push({
      week: Math.floor(i / 7) + 1,
      completedDays: done,
      totalDays: chunk.length,
      completionRate: chunk.length > 0 ? done / chunk.length : 0,
    });
  }

  // Day-of-week completion rates
  const dayCompletions: Record<number, { completed: number; total: number }> = {};
  for (const entry of sorted) {
    const dow = new Date(entry.date).getDay();
    if (!dayCompletions[dow]) dayCompletions[dow] = { completed: 0, total: 0 };
    dayCompletions[dow].total++;
    if (entry.completed) dayCompletions[dow].completed++;
  }

  let bestDow: number | null = null;
  let worstDow: number | null = null;
  let bestRate = -1;
  let worstRate = 2;

  for (const [dow, stats] of Object.entries(dayCompletions)) {
    if (stats.total < 2) continue; // need at least 2 data points
    const rate = stats.completed / stats.total;
    if (rate > bestRate) { bestRate = rate; bestDow = Number(dow); }
    if (rate < worstRate) { worstRate = rate; worstDow = Number(dow); }
  }

  // Trend: compare last 7 days vs previous 7 days
  const last7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);
  const last7DayRate = last7.length > 0 ? last7.filter((e) => e.completed).length / last7.length : 0;
  const prev7DayRate = prev7.length > 0 ? prev7.filter((e) => e.completed).length / prev7.length : 0;

  let trend: PatternAnalysis["trend"] = "insufficient_data";
  if (sorted.length >= 14) {
    const diff = last7DayRate - prev7DayRate;
    if (diff > 0.1) trend = "improving";
    else if (diff < -0.1) trend = "declining";
    else trend = "flat";
  } else if (sorted.length >= 7) {
    trend = "flat";
  }

  return {
    totalDays,
    completedDays,
    overallCompletionRate,
    weekStats,
    bestDayOfWeek: bestDow !== null ? DAY_NAMES[bestDow] : null,
    worstDayOfWeek: worstDow !== null ? DAY_NAMES[worstDow] : null,
    trend,
    last7DayRate,
    prev7DayRate,
  };
}

export function shouldSuggestSimplify(analysis: PatternAnalysis): boolean {
  return analysis.last7DayRate < 0.5 && analysis.totalDays >= 7;
}

export function shouldSuggestLevelUp(analysis: PatternAnalysis): boolean {
  return analysis.last7DayRate >= 0.9 && analysis.totalDays >= 7;
}
