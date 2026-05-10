"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, Brain, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Tell us your goal",
    description:
      "Have a quick conversation with our AI coach. Share your habit goal, schedule, and what's held you back before.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI crafts your plan",
    description:
      "Using behavioral psychology principles and semantic matching, we build a personalized habit plan just for you.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Track & level up",
    description:
      "Check in daily, earn XP, unlock badges, and watch your streak grow. Gamification keeps you coming back.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm tracking-[0.25em] uppercase text-[var(--text-secondary)] mb-4 font-medium">
            How it works
          </p>
          <h2
            className="text-4xl sm:text-5xl tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            Three steps to a
            <br />
            <span className="italic">better you.</span>
          </h2>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="group"
            >
              {/* Step number */}
              <p className="text-xs font-mono text-[var(--text-secondary)]/60 mb-6 tracking-wider">
                {step.number}
              </p>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-raised)] flex items-center justify-center mb-5 group-hover:bg-[var(--text-primary)] group-hover:text-white transition-all duration-300">
                <step.icon className="w-5 h-5" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
