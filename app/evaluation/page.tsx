"use client";

import { useState } from "react";
import type { EvaluationRunResponse } from "@/app/api/evaluation/run/route";
import { PersonaCard } from "@/components/evaluation/PersonaCard";
import { MetricsTable } from "@/components/evaluation/MetricsTable";

type RunState = "idle" | "running" | "done" | "error";

export default function EvaluationPage() {
  const [runState, setRunState] = useState<RunState>("idle");
  const [data, setData] = useState<EvaluationRunResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function runEvaluation() {
    setRunState("running");
    setData(null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/evaluation/run", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const json: EvaluationRunResponse = await res.json();
      setData(json);
      setRunState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setRunState("error");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl text-[var(--text-primary)] mb-2">
            Synthetic Evaluation
          </h1>
          <p className="text-[var(--text-secondary)] max-w-2xl">
            Runs all 9 synthetic personas (3 categories × 3 difficulty tiers) through the full AI pipeline and scores
            each plan on personalization, principle coverage, confidence, and difficulty appropriateness.
          </p>
        </div>

        {/* Run control */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={runEvaluation}
            disabled={runState === "running"}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "linear-gradient(135deg, var(--accent-ember), var(--accent-fire))" }}
          >
            {runState === "running" ? "Running…" : "Run Evaluation"}
          </button>
          {runState === "running" && (
            <p className="text-[var(--text-secondary)] text-sm animate-pulse">
              Generating 9 plans via Claude Sonnet — this takes ~60 seconds…
            </p>
          )}
          {data && (
            <p className="text-[var(--text-secondary)] text-xs">
              Last run: {new Date(data.ranAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Error state */}
        {runState === "error" && (
          <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl text-[var(--error)] text-sm">
            {errorMsg}
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-8">
            {/* Aggregate summary */}
            <MetricsTable summary={data.summary} />

            {/* Per-persona cards */}
            <div>
              <h2 className="text-[var(--text-primary)] font-semibold mb-4">Per-Persona Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.results.map((result, i) => (
                  <PersonaCard key={result.personaId} result={result} index={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty idle state */}
        {runState === "idle" && (
          <div className="py-24 flex flex-col items-center gap-3 text-[var(--text-secondary)]">
            <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm">Click "Run Evaluation" to begin the synthetic test suite.</p>
          </div>
        )}
      </div>
    </div>
  );
}
