"use client";

import { Hero } from "@/components/landing/Hero";
import { ProblemStatement } from "@/components/landing/ProblemStatement";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PsychologyMarquee } from "@/components/landing/PsychologyMarquee";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <main className="bg-[var(--bg-base)] overflow-hidden">
      <Hero />
      <ProblemStatement />
      <HowItWorks />
      <PsychologyMarquee />
      <FinalCTA />
    </main>
  );
}
