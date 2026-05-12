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
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-lg">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-[var(--text-primary)] cursor-pointer"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          Habit<span className="text-[var(--text-secondary)]">Forge</span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {authUser ? (
            <>
              {localSession?.planId && (
                <Link
                  href={`/results?plan=${localSession.planId}`}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 cursor-pointer"
                >
                  My Plan
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 cursor-pointer"
              >
                Dashboard
              </Link>
              <span className="text-[var(--text-secondary)] text-xs truncate max-w-[120px]">
                {authUser.displayName}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all duration-200 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth?tab=login"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/auth?tab=signup"
                className="px-4 py-1.5 bg-[var(--text-primary)] text-white rounded-full font-medium hover:opacity-80 transition-opacity duration-200 text-xs cursor-pointer"
              >
                Get Started
              </Link>
            </>
          ) }
        </div>
      </div>
    </nav>
  );
}
