"use client";

import { motion } from "framer-motion";

const principles = [
  "Habit Stacking",
  "Implementation Intentions",
  "Temptation Bundling",
  "Two-Minute Rule",
  "Identity-Based Habits",
  "Reward Scheduling",
  "Environment Design",
  "Atomic Habits",
  "Cue-Routine-Reward",
  "Self-Determination Theory",
  "Behavioral Activation",
  "Growth Mindset",
];

export function PsychologyMarquee() {
  // Double the array for seamless looping
  const doubled = [...principles, ...principles];

  return (
    <section className="py-24 border-y border-[var(--border)] overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Section label */}
        <p className="text-center text-sm tracking-[0.25em] uppercase text-[var(--text-secondary)] mb-12 font-medium px-6">
          Grounded in behavioral psychology
        </p>

        {/* Marquee track */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {/* Scrolling content */}
          <div className="animate-marquee flex items-center gap-12 whitespace-nowrap w-max">
            {doubled.map((principle, i) => (
              <span
                key={`${principle}-${i}`}
                className="text-2xl sm:text-3xl tracking-tight text-[var(--text-primary)]/15 font-medium select-none"
                style={{ fontFamily: "var(--font-instrument-serif)" }}
              >
                {principle}
              </span>
            ))}
          </div>
        </div>

        {/* Sources */}
        <p className="text-center text-xs text-[var(--text-secondary)]/60 mt-10 px-6">
          James Clear · Katy Milkman · Peter Gollwitzer · BJ Fogg · Carol Dweck
        </p>
      </motion.div>
    </section>
  );
}
