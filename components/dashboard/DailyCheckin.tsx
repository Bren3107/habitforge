"use client";

import { useState } from "react";
import type { HabitPlan } from "@/lib/ai/llm";

function clean(text: string): string {
  return text
    .replace(/ — /g, ", ")
    .replace(/—/g, ", ")
    .replace(/ \+ /g, ", then ");
}

interface DailyCheckinProps {
  plan: HabitPlan;
  planCreatedAt: string;
  todayCheckedIn: boolean;
  xpEarned?: number;
  onCheckin: (notes?: string) => Promise<void>;
}

function getDayNumber(planCreatedAt: string): number {
  const created = new Date(planCreatedAt);
  const today = new Date();
  const diffMs = today.setHours(0, 0, 0, 0) - created.setHours(0, 0, 0, 0);
  const daysSince = Math.floor(diffMs / 86400000);
  return Math.min(Math.max(daysSince + 1, 1), 28);
}

export function DailyCheckin({
  plan,
  planCreatedAt,
  todayCheckedIn,
  xpEarned,
  onCheckin,
}: DailyCheckinProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(todayCheckedIn);
  const [earnedXP, setEarnedXP] = useState(xpEarned ?? 0);

  const dayNumber = getDayNumber(planCreatedAt);
  const todayAction = plan.daily_actions[dayNumber - 1] ?? plan.daily_actions[0];

  const handleCheckin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onCheckin(notes.trim() || undefined);
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[var(--bg-surface)] border-2 border-[var(--accent-ember)] border-opacity-40 rounded-xl">
      <div className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-4">
        Day {dayNumber} · Today&apos;s Habit
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex gap-3 items-start">
          <span className="text-xs font-bold text-[var(--accent-ember)] uppercase min-w-[44px] pt-0.5">Cue</span>
          <span className="text-sm text-[var(--text-primary)]">{clean(todayAction.cue)}</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-xs font-bold text-[var(--accent-ember)] uppercase min-w-[44px] pt-0.5">Do</span>
          <span className="text-sm text-[var(--text-primary)]">{todayAction.actions.map(clean).join(", then ")}</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-xs font-bold text-[var(--accent-ember)] uppercase min-w-[44px] pt-0.5">Reward</span>
          <span className="text-sm text-[var(--text-primary)]">{clean(todayAction.reward)}</span>
        </div>
      </div>

      {confirmed ? (
        <div className="text-center py-4 bg-[var(--bg-raised)] rounded-lg border border-[var(--border)]">
          <p className="text-[var(--accent-ember)] font-bold text-lg">✓ Done for today</p>
          {earnedXP > 0 && (
            <p className="text-[var(--text-secondary)] text-sm mt-1">+{earnedXP} XP earned</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note..."
            className="w-full px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ember)]"
          />
          <button
            onClick={handleCheckin}
            disabled={isLoading}
            className="w-full py-3 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Saving..." : "✓ Mark Today Complete  +10 XP"}
          </button>
          {error && <p className="text-[var(--error)] text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
}
