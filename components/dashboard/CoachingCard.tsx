"use client";

import { useEffect, useState } from "react";

interface CoachingCardProps {
  userId: string;
  planId: string;
  totalCheckins: number;
}

interface CoachingResponse {
  message: string | null;
  weekNumber: number;
  reason?: string;
}

export function CoachingCard({ userId, planId, totalCheckins }: CoachingCardProps) {
  const [data, setData] = useState<CoachingResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (totalCheckins < 7) return;

    setLoading(true);
    fetch(`/api/coaching/weekly?userId=${encodeURIComponent(userId)}&planId=${encodeURIComponent(planId)}`)
      .then((r) => r.json())
      .then((d: CoachingResponse) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, planId, totalCheckins]);

  if (totalCheckins < 7) return null;

  return (
    <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          Weekly Coach
        </span>
        {data && (
          <span className="text-xs text-[var(--text-secondary)]">
            Week {data.weekNumber}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-4 bg-[var(--bg-raised)] rounded animate-pulse w-3/4" />
          <div className="h-4 bg-[var(--bg-raised)] rounded animate-pulse w-full" />
          <div className="h-4 bg-[var(--bg-raised)] rounded animate-pulse w-2/3" />
        </div>
      )}

      {!loading && data?.message && (
        <p className="text-[var(--text-primary)] text-sm leading-relaxed">
          {data.message}
        </p>
      )}

      {!loading && !data?.message && (
        <p className="text-[var(--text-secondary)] text-sm">
          Keep going — your coaching message will appear here after 7 check-ins.
        </p>
      )}
    </div>
  );
}
