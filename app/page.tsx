"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Subtle ember glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-2xl text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1
            className="text-7xl font-bold text-[var(--text-primary)] mb-4 leading-tight"
            style={{ fontFamily: "Fraunces" }}
          >
            Habit<span className="text-[var(--accent-ember)]">Forge</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] font-light max-w-lg mx-auto">
            Build habits that stick. Grounded in behavioral psychology, personalized for your life.
          </p>
        </div>

        {/* Problem → Solution */}
        <div className="my-16 space-y-6">
          <div className="p-6 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg">
            <p className="text-[var(--text-secondary)] text-sm mb-2">THE PROBLEM</p>
            <p className="text-[var(--text-primary)] font-semibold">
              90% of people abandon their habits by January 2nd. Good intentions ≠ lasting change.
            </p>
          </div>

          <div className="p-6 bg-[var(--bg-raised)] border border-[var(--border)] rounded-lg">
            <p className="text-[var(--accent-ember)] text-sm mb-2 font-semibold">THE FORGE APPROACH</p>
            <p className="text-[var(--text-primary)]">
              AI-powered habit plans crafted for <em>your</em> constraints, built on proven psychology, gamified to keep you motivated.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link
            href="/auth?tab=signup"
            className="px-8 py-3 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] transition-colors text-lg"
          >
            Get Started →
          </Link>
          <Link
            href="/auth?tab=login"
            className="px-8 py-3 bg-[var(--bg-raised)] text-[var(--text-primary)] rounded-lg font-bold border border-[var(--border)] hover:border-[var(--accent-ember)] transition-colors text-lg"
          >
            Sign In
          </Link>
        </div>

        {/* Social Proof */}
        <div className="mt-16 space-y-4 text-[var(--text-secondary)] text-sm">
          <p>Built on behavioral psychology from researchers:</p>
          <p className="text-xs">
            Atomic Habits (James Clear) • Temptation Bundling (Katy Milkman) •
            Implementation Intentions (Peter Gollwitzer)
          </p>
        </div>
      </div>

      {/* Subtle footer */}
      <div className="absolute bottom-8 text-center text-[var(--text-secondary)] text-xs">
        <p>✦ Habits forged under pressure become permanent ✦</p>
      </div>
    </main>
  );
}
