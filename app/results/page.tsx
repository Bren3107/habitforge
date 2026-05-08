"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { planAPI } from "@/lib/api";
import type { HabitPlan } from "@/lib/ai/llm";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const planId = searchParams.get("plan");
  const [plan, setPlan] = useState<HabitPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlan() {
      if (!sessionId && !planId) {
        setError("No session found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (planId) {
          // Plan already generated and saved — just fetch it
          const response = await planAPI.get(planId);
          setPlan(response.plan);
        } else {
          // First load: generate the plan, save it, then update the URL
          const response = await planAPI.generate({
            sessionId: sessionId!,
            category: "fitness",
          });
          setPlan(response.plan);
          // Persist session for dashboard (anonymous user identification)
          localStorage.setItem(
            "habitforge_session",
            JSON.stringify({ planId: response.planId, userId: response.userId })
          );
          // Replace URL so refreshing fetches the saved plan instead of regenerating
          router.replace(`/results?plan=${response.planId}`);
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to generate plan";
        setError(errorMsg);
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
          <p className="text-[var(--text-secondary)] text-lg">
            Forging your personalized plan...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Something went wrong
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <a
            href="/onboard"
            className="inline-block px-6 py-2 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] transition-colors"
          >
            Start Over
          </a>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">No plan found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1
            className="text-5xl font-bold text-[var(--text-primary)] mb-2"
            style={{ fontFamily: "Fraunces" }}
          >
            {plan.plan_title}
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Your personalized habit plan, forged in behavioral psychology
          </p>
        </div>

        {/* Plan Overview */}
        <div className="space-y-8">
          {/* Explanation */}
          <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">
              Why this plan works for you
            </h2>
            <p className="text-[var(--text-secondary)]">{plan.explanation}</p>
          </div>

          {/* Week Progression */}
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              4-Week Progression
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {plan.week_progression.map((week) => (
                <div
                  key={week.week}
                  className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg"
                >
                  <p className="text-[var(--accent-ember)] font-bold mb-1">
                    Week {week.week}
                  </p>
                  <p className="text-[var(--text-primary)] font-semibold text-sm mb-2">
                    {week.focus}
                  </p>
                  <p className="text-[var(--text-secondary)] text-xs">
                    Difficulty: {week.expected_difficulty}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Psychology Principles */}
          {plan.psychology_principles_used.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                Behavioral Psychology Principles
              </h2>
              <div className="flex flex-wrap gap-2">
                {plan.psychology_principles_used.map((principle) => (
                  <span
                    key={principle}
                    className="px-3 py-1 bg-[var(--accent-ember)] bg-opacity-20 border border-[var(--accent-ember)] text-[var(--text-primary)] text-sm rounded-full"
                  >
                    {principle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Daily Actions Preview */}
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              Daily Habit Structure
            </h2>
            {plan.daily_actions.slice(0, 3).map((action) => (
              <div key={action.day} className="mb-4 last:mb-0">
                <p className="text-[var(--text-primary)] font-semibold mb-2">
                  Day {action.day}
                </p>
                <div className="space-y-2 text-[var(--text-secondary)] text-sm ml-4">
                  <p>
                    <span className="text-[var(--accent-gold)] font-bold">Cue:</span>{" "}
                    {action.cue}
                  </p>
                  <p>
                    <span className="text-[var(--accent-gold)] font-bold">
                      Actions:
                    </span>{" "}
                    {action.actions.join(", ")}
                  </p>
                  <p>
                    <span className="text-[var(--accent-gold)] font-bold">
                      Reward:
                    </span>{" "}
                    {action.reward}
                  </p>
                </div>
              </div>
            ))}
            <p className="text-[var(--text-secondary)] text-sm mt-6">
              + {Math.max(0, plan.daily_actions.length - 3)} more days...
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              Ready to start your journey?
            </p>
            <a
              href="/dashboard"
              className="inline-block px-8 py-3 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] transition-colors"
            >
              Go to Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
