"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LocalSession {
  planId: string;
  userId: string;
}

interface AuthUser {
  id: string;
  displayName: string | null;
}

export function NavBar() {
  const [localSession, setLocalSession] = useState<LocalSession | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("habitforge_session");
      if (raw) setLocalSession(JSON.parse(raw) as LocalSession);
      else setLocalSession(null);
    } catch {
      setLocalSession(null);
    }

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthUser({
          id: user.id,
          displayName:
            user.user_metadata?.display_name ??
            user.user_metadata?.full_name ??
            user.email ??
            null,
        });
      } else {
        setAuthUser(null);
      }
    });
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    localStorage.removeItem("habitforge_session");
    setLocalSession(null);
    setAuthUser(null);
    router.push("/");
  };

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

        <div className="flex items-center gap-5 text-sm">
          {authUser ? (
            <>
              {localSession?.planId && (
                <Link
                  href={`/results?plan=${localSession.planId}`}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-ember)] transition-colors"
                >
                  My Plan
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-[var(--text-secondary)] hover:text-[var(--accent-ember)] transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-[var(--text-secondary)] text-xs truncate max-w-[120px]">
                {authUser.displayName}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:border-[var(--accent-ember)] hover:text-[var(--text-primary)] transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth?tab=login"
                className="text-[var(--text-secondary)] hover:text-[var(--accent-ember)] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth?tab=signup"
                className="px-3 py-1.5 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-md font-bold hover:bg-[var(--accent-fire)] transition-colors text-xs"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
