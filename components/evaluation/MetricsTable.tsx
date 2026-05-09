"use client";

import type { EvaluationRunResponse } from "@/app/api/evaluation/run/route";

interface MetricsTableProps {
  summary: EvaluationRunResponse["summary"];
}

export function MetricsTable({ summary }: MetricsTableProps) {
  const rows = [
    { label: "Avg Personalization Score", value: `${summary.avgPersonalizationScore.toFixed(1)} / 10` },
    { label: "Avg Principle Coverage", value: `${Math.round(summary.avgPrincipleCoverage * 100)}%` },
    { label: "Avg Confidence Score", value: `${Math.round(summary.avgConfidenceScore * 100)}%` },
    {
      label: "Difficulty Appropriate",
      value: `${summary.difficultyAppropriateCount} / ${summary.completedPersonas}`,
    },
    {
      label: "Completed",
      value: `${summary.completedPersonas} / ${summary.totalPersonas} personas`,
    },
  ];

  return (
    <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <h2 className="text-[var(--text-primary)] font-semibold mb-4">Aggregate Metrics</h2>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[var(--border)] last:border-0">
              <td className="py-2.5 text-[var(--text-secondary)]">{row.label}</td>
              <td className="py-2.5 text-[var(--text-primary)] font-semibold text-right">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
