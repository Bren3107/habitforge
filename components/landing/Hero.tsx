"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
          that actually
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
          <Link
            href="/auth?tab=signup"
            className="group px-8 py-3.5 bg-[var(--text-primary)] text-white rounded-full font-medium text-base hover:scale-105 active:scale-[0.98] transition-transform duration-200 cursor-pointer inline-flex items-center gap-2"
          >
            Get Started
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/auth?tab=login"
            className="px-8 py-3.5 text-[var(--text-secondary)] font-medium text-base hover:text-[var(--text-primary)] transition-colors duration-200 cursor-pointer"
          >
            Sign In
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border-2 border-[var(--text-secondary)]/40 flex justify-center pt-1.5"
        >
          <motion.div className="w-1 h-1.5 rounded-full bg-[var(--text-secondary)]/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
