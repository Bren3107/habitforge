"use client";

import { analyzePatterns, type PatternAnalysis } from "@/lib/ai/pattern-analysis";
import type { HistoryEntry } from "@/lib/api";

interface PatternInsightsProps {
  history: HistoryEntry[];
}

function TrendChip({ trend }: { trend: PatternAnalysis["trend"] }) {
  const map: Record<PatternAnalysis["trend"], { label: string; color: string }> = {
    improving: { label: "Improving", color: "text-[var(--success)]" },
    declining: { label: "Declining", color: "text-[var(--error)]" },
    flat: { label: "Steady", color: "text-[var(--text-secondary)]" },
    insufficient_data: { label: "Early days", color: "text-[var(--text-secondary)]" },
  };
  const { label, color } = map[trend];
  return <span className={color}>{label}</span>;
}

export function PatternInsights({ history }: PatternInsightsProps) {
  if (history.length < 3) return null;

  const analysis = analyzePatterns(history);

  return (
    <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">
        Your Patterns
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--accent-ember)]" style={{ fontFamily: "Fraunces" }}>
            {Math.round(analysis.overallCompletionRate * 100)}%
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Overall rate</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            {analysis.bestDayOfWeek ?? "—"}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Best day</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold">
            <TrendChip trend={analysis.trend} />
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Trend</div>
        </div>
      </div>
    </div>
  );
}
