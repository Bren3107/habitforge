"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSignedIn(!!user);
    });
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      <motion.div
        style={{ y, opacity }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-sm tracking-[0.25em] uppercase text-[var(--text-secondary)] mb-8 font-medium"
        >
          AI-powered habit formation
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-[var(--text-primary)] mb-8"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          Build habits
          <br />
          that
          <br />
          <span className="italic">stick.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Personalized habit plans grounded in behavioral psychology,
          crafted by AI, gamified to keep you going.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {isSignedIn ? (
            <Link
              href="/auth/complete"
              className="px-8 py-3.5 bg-[var(--text-primary)] text-white rounded-full font-medium text-base hover:scale-105 active:scale-[0.98] transition-transform duration-200 cursor-pointer inline-flex items-center"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth?tab=signup"
                className="px-8 py-3.5 bg-[var(--text-primary)] text-white rounded-full font-medium text-base hover:scale-105 active:scale-[0.98] transition-transform duration-200 cursor-pointer inline-flex items-center"
              >
                Get Started
              </Link>
              <Link
                href="/auth?tab=login"
                className="px-8 py-3.5 text-[var(--text-secondary)] font-medium text-base hover:text-[var(--text-primary)] transition-colors duration-200 cursor-pointer"
              >
                Sign In
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll indicator — "Scroll" label + two animated chevrons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]/50 font-medium">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center -space-y-1.5"
        >
          <svg
            width="14"
            height="10"
            viewBox="0 0 14 10"
            fill="none"
            className="text-[var(--text-secondary)]/40"
          >
            <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg
            width="14"
            height="10"
            viewBox="0 0 14 10"
            fill="none"
            className="text-[var(--text-secondary)]/20"
          >
            <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
