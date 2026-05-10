"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2
            className="text-4xl sm:text-5xl md:text-6xl tracking-tight text-[var(--text-primary)] mb-8 leading-[1.1]"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            Your habits.
            <br />
            Your plan.
            <br />
            <span className="italic">Your forge.</span>
          </h2>

          <p className="text-lg text-[var(--text-secondary)] mb-12 max-w-md mx-auto leading-relaxed">
            Start with a 5-minute conversation. Walk away with a science-backed plan built for your life.
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/auth?tab=signup"
              className="group inline-flex items-center gap-2 px-10 py-4 bg-[var(--text-primary)] text-white rounded-full font-medium text-lg hover:scale-105 active:scale-[0.98] transition-transform duration-200 cursor-pointer"
            >
              Start Building
              <svg
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-xs text-[var(--text-secondary)]/50 tracking-wider uppercase"
          >
            Habits forged under pressure become permanent
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
