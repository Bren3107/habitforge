"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { planAPI, trackingAPI, gamificationAPI } from "@/lib/api";
import type { GamificationResponse, GetPlanResponse } from "@/lib/api";
import type { HabitPlan } from "@/lib/ai/llm";
import { getLevelProgress } from "@/lib/gamification/logic";
import { DailyCheckin } from "@/components/dashboard/DailyCheckin";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { XPBar } from "@/components/dashboard/XPBar";
import { BadgeGrid } from "@/components/dashboard/BadgeGrid";
import { ProgressChart } from "@/components/dashboard/ProgressChart";

interface Session {
  planId: string;
  userId: string;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("habitforge_session");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<HabitPlan | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string>("");
  const [planCategory, setPlanCategory] = useState<string>("fitness");
  const [gamification, setGamification] = useState<GamificationResponse | null>(null);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/onboard");
      return;
    }
    setSession(s);

    async function fetchData() {
      try {
        const [planRes, gamRes]: [GetPlanResponse, GamificationResponse] = await Promise.all([
          planAPI.get(s!.planId),
          gamificationAPI.getStats(s!.userId),
        ]);

        setPlan(planRes.plan);
        setPlanCreatedAt(planRes.planCreatedAt);
        setPlanCategory(planRes.category);
        setGamification(gamRes);

        const alreadyCheckedIn = gamRes.history.some(
          (h) => h.date === todayISO() && h.completed
        );
        setTodayCheckedIn(alreadyCheckedIn);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleCheckin = async (notes?: string) => {
    if (!session) return;
    try {
      const res = await trackingAPI.checkin({
        userId: session.userId,
        planId: session.planId,
        date: todayISO(),
        completed: true,
        notes,
      });
      setTodayCheckedIn(true);
      setGamification((prev) =>
        prev
          ? {
              ...prev,
              total_xp: res.total_xp,
              current_streak: res.current_streak,
              longest_streak: res.longest_streak,
              badges: [...prev.badges, ...res.new_badges],
              level: res.level,
              level_progress: getLevelProgress(res.total_xp),
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent-ember)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-[var(--text-primary)] font-bold text-xl mb-3">Something went wrong</p>
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

  if (!plan || !gamification) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs text-[var(--accent-ember)] uppercase tracking-widest font-bold">
            {planCategory}
          </span>
          <h1
            className="text-4xl font-bold text-[var(--text-primary)] mt-1"
            style={{ fontFamily: "Fraunces" }}
          >
            {plan.plan_title}
          </h1>
        </div>

        {/* Check-in hero */}
        <DailyCheckin
          plan={plan}
          planCreatedAt={planCreatedAt}
          todayCheckedIn={todayCheckedIn}
          onCheckin={handleCheckin}
        />

        {/* XP bar */}
        <XPBar
          totalXP={gamification.total_xp}
          levelProgress={gamification.level_progress}
        />

        {/* Streak + Badges */}
        <div className="grid grid-cols-2 gap-6">
          <StreakCounter
            currentStreak={gamification.current_streak}
            longestStreak={gamification.longest_streak}
          />
          <BadgeGrid earnedBadges={gamification.badges} />
        </div>

        {/* Progress chart */}
        <ProgressChart history={gamification.history} />

        {/* CTA */}
        <div className="text-center pt-4">
          <a
            href={`/results?plan=${session?.planId}`}
            className="text-[var(--text-secondary)] text-sm hover:text-[var(--accent-ember)] transition-colors"
          >
            View your full plan →
          </a>
        </div>
      </div>
    </div>
  );
}
