"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"signup" | "login">(
    searchParams.get("tab") === "login" ? "login" : "signup"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/auth/complete");
      else setCheckingSession(false);
    });
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/onboard");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/auth/complete");
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--accent-ember)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ember glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(245,158,11,0.07) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="block text-center mb-8 text-3xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "Fraunces" }}
        >
          Habit<span className="text-[var(--accent-ember)]">Forge</span>
        </Link>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => { setTab("signup"); setError(null); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "signup"
                  ? "text-[var(--accent-ember)] border-b-2 border-[var(--accent-ember)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setTab("login"); setError(null); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                tab === "login"
                  ? "text-[var(--accent-ember)] border-b-2 border-[var(--accent-ember)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Sign In
            </button>
          </div>

          <div className="p-6 space-y-4">
            {tab === "signup" ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:border-[var(--accent-ember)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:border-[var(--accent-ember)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:border-[var(--accent-ember)] transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-[var(--error)] text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-[var(--bg-base)]/40 border-t-[var(--bg-base)] rounded-full animate-spin" />
                  )}
                  Create Account
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:border-[var(--accent-ember)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-3 py-2.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:border-[var(--accent-ember)] transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-[var(--error)] text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-[var(--bg-base)]/40 border-t-[var(--bg-base)] rounded-full animate-spin" />
                  )}
                  Sign In
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-secondary)]">or</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              className="w-full py-2.5 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm font-semibold hover:border-[var(--accent-ember)] transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--accent-ember)] rounded-full animate-spin" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
