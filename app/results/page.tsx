"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { planAPI } from "@/lib/api";
import type { HabitPlan } from "@/lib/ai/llm";
import { ConfidenceMeter } from "@/components/results/ConfidenceMeter";
import { PrincipleBadges } from "@/components/results/PrincipleBadges";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#22c55e",
  moderate: "var(--accent-ember)",
  hard: "var(--accent-fire)",
  challenging: "var(--error)",
};

function diffColor(d: string) {
  return DIFFICULTY_COLOR[d.toLowerCase()] ?? "var(--accent-ember)";
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const planId = searchParams.get("plan");
  const [plan, setPlan] = useState<HabitPlan | null>(null);
  const [planMeta, setPlanMeta] = useState<{ confidenceScore: number; confidenceLevel: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanationExpanded, setExplanationExpanded] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      if (!sessionId && !planId) {
        try {
          const raw = localStorage.getItem("habitforge_session");
          if (raw) {
            const { planId: savedId } = JSON.parse(raw) as { planId: string; userId: string };
            if (savedId) { router.replace(`/results?plan=${savedId}`); return; }
          }
        } catch { /* ignore */ }
        setError("No session found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (planId) {
          const res = await planAPI.get(planId);
          setPlan(res.plan);
          setPlanMeta({ confidenceScore: res.confidenceScore, confidenceLevel: res.confidenceLevel });
        } else {
          const res = await planAPI.generate({ sessionId: sessionId!, category: "fitness" });
          setPlan(res.plan);
          setPlanMeta({ confidenceScore: res.confidenceScore, confidenceLevel: res.confidenceLevel });
          localStorage.setItem("habitforge_session", JSON.stringify({ planId: res.planId, userId: res.userId }));
          router.replace(`/results?plan=${res.planId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate plan");
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [sessionId, planId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--border)] border-t-[var(--accent-ember)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] text-lg">Forging your personalized plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Something went wrong</h1>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <a href="/onboard" className="inline-block px-6 py-2 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] transition-colors">
            Start Over
          </a>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const isNewUser = !!sessionId && !planId;
  const ctaText = isNewUser
    ? "🔥 Light the Forge — Begin Day 1"
    : "Continue Your Journey";
  const ctaSubtext = isNewUser
    ? "Your streak starts now. Don't break it."
    : "Pick up where you left off.";

  const dayOne = plan.daily_actions[0];
  const isLongExplanation = plan.explanation.length > 130;
  const shortExplanation = isLongExplanation
    ? plan.explanation.slice(0, 130).trimEnd() + "…"
    : plan.explanation;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">

      {/* ── Hero ── */}
      <motion.div
        className="relative overflow-hidden px-4 pt-16 pb-12 text-center"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {/* ambient glow behind hero */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.13) 0%, transparent 70%)" }}
        />

        <motion.p
          variants={fadeUp}
          className="text-xs uppercase tracking-widest font-bold mb-3"
          style={{ color: "var(--accent-ember)" }}
        >
          Your Plan is Ready
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight mb-4"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          {plan.plan_title}
        </motion.h1>

        <motion.p variants={fadeUp} className="text-[var(--text-secondary)] text-base max-w-md mx-auto mb-6 leading-relaxed">
          {explanationExpanded ? plan.explanation : shortExplanation}
          {isLongExplanation && (
            <button
              onClick={() => setExplanationExpanded((v) => !v)}
              className="ml-1 underline underline-offset-2 text-sm"
              style={{ color: "var(--accent-ember)" }}
            >
              {explanationExpanded ? "less" : "read more"}
            </button>
          )}
        </motion.p>

        {/* XP teaser pill */}
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
          style={{
            borderColor: "var(--accent-ember)",
            color: "var(--accent-ember)",
            backgroundColor: "rgba(245,158,11,0.08)",
          }}
        >
          <span>⚡</span>
          <span>Earn XP every day you check in</span>
        </motion.div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 space-y-5">

        {/* ── 4-Week Journey ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl"
        >
          <p
            className="text-xs uppercase tracking-widest font-bold mb-5"
            style={{ color: "var(--accent-ember)" }}
          >
            Your 4-Week Journey
          </p>

          <div className="relative">
            {/* vertical connector */}
            <div
              className="absolute top-4 bottom-4 w-px"
              style={{ left: "15px", backgroundColor: "var(--border)" }}
            />
            <div className="space-y-5">
              {plan.week_progression.map((week, i) => (
                <div key={week.week} className="flex gap-4 items-start">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                    style={{
                      backgroundColor: i === 0 ? "var(--accent-ember)" : "var(--bg-raised)",
                      color: i === 0 ? "var(--bg-base)" : "var(--text-secondary)",
                      border: `2px solid ${i === 0 ? "var(--accent-ember)" : "var(--border)"}`,
                    }}
                  >
                    {week.week}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-[var(--text-primary)] text-sm leading-snug">{week.focus}</p>
                    <span
                      className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full"
                      style={{
                        color: diffColor(week.expected_difficulty),
                        backgroundColor: "var(--bg-raised)",
                      }}
                    >
                      {week.expected_difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Day 1 Spotlight ── */}
        {dayOne && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="p-6 rounded-2xl border-2"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--accent-ember)",
            }}
          >
            <p
              className="text-xs uppercase tracking-widest font-bold mb-5"
              style={{ color: "var(--accent-ember)" }}
            >
              Day 1 — Your First Mission
            </p>

            <div className="relative">
              {/* vertical connector between steps */}
              <div
                className="absolute top-8 bottom-8 w-px"
                style={{ left: "11px", backgroundColor: "var(--border)" }}
              />
              <div className="space-y-5">
                {/* Cue */}
                <div className="flex gap-4 items-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                    style={{ backgroundColor: "var(--accent-ember)", color: "var(--bg-base)" }}
                  >
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-secondary)" }}>Cue</p>
                    <p className="text-[var(--text-primary)] text-sm">{dayOne.cue}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 items-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                    style={{ backgroundColor: "var(--accent-fire)", color: "var(--bg-base)" }}
                  >
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-secondary)" }}>Do</p>
                    <p className="text-[var(--text-primary)] text-sm">{dayOne.actions.join(" + ")}</p>
                  </div>
                </div>

                {/* Reward */}
                <div className="flex gap-4 items-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      color: "var(--accent-ember)",
                      border: "2px solid var(--accent-ember)",
                    }}
                  >
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-secondary)" }}>Reward</p>
                    <p className="text-[var(--text-primary)] text-sm">{dayOne.reward}</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs mt-5 text-center" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
              Days 2–28 unlock as you check in on your dashboard
            </p>
          </motion.div>
        )}

        {/* ── The Science ── */}
        {planMeta && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl"
          >
            <p
              className="text-xs uppercase tracking-widest font-bold mb-4"
              style={{ color: "var(--accent-ember)" }}
            >
              The Science Behind It
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <ConfidenceMeter score={planMeta.confidenceScore} label={planMeta.confidenceLevel} />
              <div className="flex-1">
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Built on proven principles:</p>
                <PrincipleBadges principles={plan.psychology_principles_used} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="pt-2"
        >
          <Link
            href="/dashboard"
            className="block w-full py-4 text-center rounded-2xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "var(--accent-ember)", color: "var(--bg-base)" }}
          >
            {ctaText}
          </Link>
          <p className="text-center text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
            {ctaSubtext}
          </p>
        </motion.div>

      </div>
    </div>
  );
}
