"use client";

import type { EvaluationResultItem } from "@/app/api/evaluation/run/route";

interface PersonaCardProps {
  result: EvaluationResultItem;
  index: number;
}

const DIFFICULTY_COLOURS: Record<string, string> = {
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  hard: "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

export function PersonaCard({ result, index }: PersonaCardProps) {
  const { metrics } = result;

  return (
    <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[var(--text-secondary)] text-xs font-mono">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="text-[var(--text-primary)] font-semibold">{result.personaName}</h3>
          </div>
          <p className="text-[var(--text-secondary)] text-xs line-clamp-1">{result.planTitle || "—"}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full border capitalize text-[var(--accent-ember)] bg-[var(--accent-ember)]/10 border-[var(--accent-ember)]/30">
            {result.category}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_COLOURS[result.difficulty] ?? ""}`}>
            {result.difficulty}
          </span>
        </div>
      </div>

      {result.error && (
        <p className="text-xs text-[var(--error)] bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg px-3 py-2">
          Error: {result.error}
        </p>
      )}

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Personalization" value={`${metrics.personalizationScore}/10`} fill={metrics.personalizationScore / 10} />
        <Metric label="Principle Coverage" value={`${Math.round(metrics.principleCoverage * 100)}%`} fill={metrics.principleCoverage} />
        <Metric label="Confidence" value={`${Math.round(metrics.confidenceScore * 100)}%`} fill={metrics.confidenceScore} sublabel={metrics.confidenceLabel} />
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-secondary)] text-xs">Difficulty OK?</span>
          <span className={`text-sm font-semibold ${metrics.difficultyAppropriate ? "text-emerald-400" : "text-rose-400"}`}>
            {metrics.difficultyAppropriate ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Principles used */}
      {result.principlesUsed.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.principlesUsed.map((p) => (
            <span
              key={p}
              className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-raised)] text-[var(--text-secondary)] border border-[var(--border)]"
            >
              {p.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, fill, sublabel }: { label: string; value: string; fill: number; sublabel?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[var(--text-secondary)] text-xs">{label}</span>
      <span className="text-[var(--text-primary)] text-sm font-semibold">
        {value}
        {sublabel && <span className="text-[var(--text-secondary)] text-xs font-normal ml-1">({sublabel})</span>}
      </span>
      <div className="h-1.5 bg-[var(--bg-raised)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.round(fill * 100))}%`,
            background: "linear-gradient(90deg, var(--accent-ember), var(--accent-fire))",
          }}
        />
      </div>
    </div>
  );
}
