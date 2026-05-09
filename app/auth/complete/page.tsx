"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      try {
        const res = await fetch("/api/user/current-plan");
        if (res.ok) {
          const { planId } = await res.json();
          if (planId) {
            localStorage.setItem(
              "habitforge_session",
              JSON.stringify({ planId, userId: user.id })
            );
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        // ignore — fall through to onboard
      }

      router.replace("/onboard");
    }

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--accent-ember)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-secondary)] text-sm">Setting up your account...</p>
      </div>
    </div>
  );
}
