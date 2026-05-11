"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OnboardWizard } from "@/components/onboard/OnboardWizard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OnboardPage() {
  const router = useRouter();
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/auth?tab=signup");
        return;
      }
      setAuthReady(true);
      try {
        const raw = localStorage.getItem("habitforge_session");
        if (raw) {
          const { planId } = JSON.parse(raw) as { planId: string; userId: string };
          if (planId) setExistingPlanId(planId);
        }
      } catch { /* ignore */ }
    });
  }, [router]);

  const handleConversationComplete = (sessionId: string) => {
    sessionStorage.setItem("habitforge_session", sessionId);
    router.push(`/results?session=${sessionId}`);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--accent-ember)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {existingPlanId && (
          <div className="mb-6 p-4 bg-[var(--bg-surface)] border border-[var(--accent-ember)]/40 rounded-xl flex items-center justify-between gap-4">
            <p className="text-[var(--text-secondary)] text-sm">You already have a plan.</p>
            <div className="flex gap-4 shrink-0">
              <Link
                href={`/results?plan=${existingPlanId}`}
                className="text-sm text-[var(--accent-ember)] hover:underline"
              >
                View it
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-[var(--accent-ember)] hover:underline"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}

        <div className="mb-12">
          <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: "var(--font-instrument-serif)" }}>
            Forge Your Habit
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Let's build a personalized habit plan grounded in behavioral psychology.
          </p>
        </div>

        <OnboardWizard onConversationComplete={handleConversationComplete} />
      </div>
    </div>
  );
}
