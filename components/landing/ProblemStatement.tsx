"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function AnimatedCounter({ target, suffix = "%" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, target, {
      duration: 2,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(value) {
        setDisplay(Math.round(value));
      },
    });
    return () => controls.stop();
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}{suffix}
    </span>
  );
}

export function ProblemStatement() {
  return (
    <section className="py-32 px-6 border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left: stat */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <p
              className="text-8xl sm:text-9xl font-normal tracking-tight text-[var(--text-primary)] mb-4"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
            >
              <AnimatedCounter target={90} />
            </p>
            <p className="text-[var(--text-secondary)] text-lg">
              of people abandon their habits
              <br />
              within the first two weeks.
            </p>
          </motion.div>

          {/* Right: solution cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--text-secondary)] mb-3">
                The problem
              </p>
              <p className="text-[var(--text-primary)] font-medium leading-relaxed">
                Good intentions aren&apos;t enough. Generic advice doesn&apos;t account for your schedule, energy, or what&apos;s failed before.
              </p>
            </div>

            <div className="p-6 rounded-2xl border-2 border-[var(--text-primary)]">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--text-primary)] mb-3">
                The HabitForge approach
              </p>
              <p className="text-[var(--text-primary)] font-medium leading-relaxed">
                AI-powered plans crafted for <em>your</em> constraints, built on proven psychology, gamified to keep you motivated.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
