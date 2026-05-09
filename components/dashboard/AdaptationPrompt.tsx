"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzePatterns, shouldSuggestSimplify, shouldSuggestLevelUp } from "@/lib/ai/pattern-analysis";
import type { HistoryEntry } from "@/lib/api";

interface AdaptationPromptProps {
  userId: string;
  planId: string;
  history: HistoryEntry[];
}

interface AdaptResponse {
  planId: string;
  message: string;
}

export function AdaptationPrompt({ userId, planId, history }: AdaptationPromptProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analysis = analyzePatterns(history);
  const showSimplify = shouldSuggestSimplify(analysis);
  const showLevelUp = shouldSuggestLevelUp(analysis);

  if (!showSimplify && !showLevelUp) return null;

  async function handleAdapt(direction: "simplify" | "level_up") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId, direction }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data: AdaptResponse = await res.json();

      // Update localStorage session with new planId
      const session = JSON.parse(localStorage.getItem("habitforge_session") ?? "{}");
      localStorage.setItem("habitforge_session", JSON.stringify({ ...session, planId: data.planId }));

      router.push(`/results?plan=${data.planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 bg-[var(--bg-surface)] border border-[var(--accent-ember)]/30 rounded-xl">
      <h3 className="text-sm font-semibold text-[var(--accent-ember)] mb-1">
        {showSimplify ? "Your plan might be too challenging" : "You're crushing it!"}
      </h3>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        {showSimplify
          ? `You completed ${Math.round(analysis.last7DayRate * 100)}% of days last week. Want an easier plan to build momentum?`
          : `You completed ${Math.round(analysis.last7DayRate * 100)}% of days last week. Ready for a bigger challenge?`}
      </p>

      {error && <p className="text-xs text-[var(--error)] mb-3">{error}</p>}

      <button
        onClick={() => handleAdapt(showSimplify ? "simplify" : "level_up")}
        disabled={loading}
        className="w-full py-2 px-4 rounded-lg bg-[var(--accent-ember)] text-[var(--bg-base)] text-sm font-semibold disabled:opacity-50 transition-opacity"
      >
        {loading
          ? "Adapting your plan..."
          : showSimplify
          ? "Simplify my plan"
          : "Level up my plan"}
      </button>
    </div>
  );
}
