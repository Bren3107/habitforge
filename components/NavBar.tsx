"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface Session {
  planId: string;
  userId: string;
}

export function NavBar() {
  const [session, setSession] = useState<Session | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("habitforge_session");
      if (raw) setSession(JSON.parse(raw) as Session);
      else setSession(null);
    } catch {
      setSession(null);
    }
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "Fraunces" }}
        >
          Habit<span className="text-[var(--accent-ember)]">Forge</span>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {session?.planId ? (
            <>
              <Link
                href={`/results?plan=${session.planId}`}
                className="text-[var(--text-secondary)] hover:text-[var(--accent-ember)] transition-colors"
              >
                My Plan
              </Link>
              <Link
                href="/dashboard"
                className="text-[var(--text-secondary)] hover:text-[var(--accent-ember)] transition-colors"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/onboard"
              className="text-[var(--text-secondary)] hover:text-[var(--accent-ember)] transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
