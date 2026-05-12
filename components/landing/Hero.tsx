"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTextSplitter, type SplitLine } from "@/hooks/useTextSplitter";
import { HABIT_ICONS } from "./HabitIcons";

gsap.registerPlugin(ScrollTrigger);

const HEADLINE_LINES: SplitLine[] = [
  { text: "Build habits" },
  { text: "that" },
  { text: "stick.", italic: true },
];

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const { charsByLine, charRefs } = useTextSplitter(HEADLINE_LINES);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSignedIn(!!user);
    });
  }, []);

  useEffect(() => {
    const els = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    const iconEls = iconRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length || !sectionRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(els, { opacity: 1, x: 0, y: 0, rotation: 0 });
      setContentVisible(true);
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Pre-generate letter scatter landing positions
      const scatter = els.map(() => ({
        x: (Math.random() - 0.5) * 500,
        y: Math.random() * 80 + 60,
        rotation: (Math.random() - 0.5) * 100,
      }));

      // Pre-generate icon explosion data so Phase 3a and 3b share the same
      // target coordinates. Angles are evenly distributed around a full circle,
      // offset by -90° so the burst starts from the top.
      const iconData = iconEls.map((_, i) => {
        const angle = ((i / iconEls.length) * Math.PI * 2) - Math.PI / 2;
        const radius = 220 + Math.random() * 160;
        return {
          explodeX: Math.cos(angle) * radius,
          explodeY: Math.sin(angle) * radius,
          fallExtra: 220 + Math.random() * 180,
          rotation: (Math.random() - 0.5) * 340,
          scale: 0.7 + Math.random() * 0.55,
        };
      });

      // Letters start off-screen above the viewport
      gsap.set(els, {
        x: (i) => scatter[i].x * 0.3,
        y: -window.innerHeight * 1.1,
        rotation: (i) => scatter[i].rotation,
        opacity: 1,
      });

      // Icons start hidden at center (behind the headline)
      gsap.set(iconEls, { opacity: 0, scale: 0, x: 0, y: 0 });

      const tl = gsap.timeline({ paused: true });

      // ── Phase 1 (0 → ~38 %): letters fall from sky → scattered pile ───
      tl.to(els, {
        x: (i) => scatter[i].x,
        y: (i) => scatter[i].y,
        rotation: (i) => scatter[i].rotation,
        ease: "power2.in",
        duration: 1.2,
        stagger: { each: 0.03, from: "random" },
      });

      // ── Phase 2 (~38 → ~72 %): pile → assembled heading ───────────────
      tl.to(els, {
        x: 0,
        y: 0,
        rotation: 0,
        ease: "power3.out",
        duration: 1.3,
        stagger: { each: 0.035, from: "random" },
      });

      // ── Phase 3a (~72 → ~90 %): habit icons explode radially ──────────
      // Icons shoot out from behind the assembled text in all directions.
      tl.to(
        iconEls,
        {
          x: (i) => iconData[i].explodeX,
          y: (i) => iconData[i].explodeY,
          scale: (i) => iconData[i].scale,
          rotation: (i) => iconData[i].rotation,
          opacity: 1,
          ease: "power3.out",
          duration: 0.8,
          stagger: { each: 0.025, from: "random" },
        },
        // Start right after Phase 2 finishes
        ">"
      );

      // ── Phase 3b (~90 → 100 %): icons arc downward and fade out ───────
      tl.to(iconEls, {
        y: (i) => iconData[i].explodeY + iconData[i].fallExtra,
        opacity: 0,
        ease: "power1.in",
        duration: 0.7,
        stagger: { each: 0.015, from: "random" },
      });

      // ── ScrollTrigger: pin for 3 × viewport height ─────────────────────
      // Phase 1 + 2 covers the first two viewport-heights of scroll;
      // Phase 3 takes the third.
      ScrollTrigger.create({
        animation: tl,
        trigger: sectionRef.current,
        start: "top top",
        end: () => "+=" + window.innerHeight * 3,
        scrub: 1.5,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onLeave: (self) => {
          tl.progress(1, true);
          gsap.set(els, { x: 0, y: 0, rotation: 0, clearProps: "willChange" });
          setContentVisible(true);
          setTimeout(() => {
            self.kill();
            gsap.set(els, { x: 0, y: 0, rotation: 0 });
          }, 50);
        },
      });
    });

    return () => mm.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* ── Habit icon confetti layer ─────────────────────────────────── */}
      {/* Absolutely centred on the headline; icons burst outward from here */}
      <div
        className="absolute pointer-events-none"
        style={{ left: "50%", top: "42%", transform: "translate(-50%, -50%)" }}
        aria-hidden="true"
      >
        {HABIT_ICONS.map((icon, i) => (
          <div
            key={icon.name}
            ref={(el) => {
              iconRefs.current[i] = el;
            }}
            style={{
              position: "absolute",
              color: icon.color,
              willChange: "transform",
              transform: "translate(-50%, -50%) scale(2)",
            }}
          >
            {icon.svg}
          </div>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto text-center relative">
        {/* Overline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={contentVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-sm tracking-[0.25em] uppercase text-[var(--text-secondary)] mb-8 font-medium"
        >
          AI-powered habit formation
        </motion.p>

        {/* Main headline — individual letters driven by GSAP + ScrollTrigger */}
        <h1
          aria-label="Build habits that stick."
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-[var(--text-primary)] mb-8"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          {HEADLINE_LINES.map((line, li) => (
            <span
              key={li}
              aria-hidden="true"
              className={`block${line.italic ? " italic" : ""}`}
            >
              {charsByLine[li].map((c) => (
                <span
                  key={c.globalIndex}
                  ref={(el) => {
                    charRefs.current[c.globalIndex] = el;
                  }}
                  style={{
                    display: "inline-block",
                    opacity: 0,
                    willChange: "transform",
                  }}
                >
                  {c.isSpace ? " " : c.char}
                </span>
              ))}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={contentVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Personalized habit plans grounded in behavioral psychology, crafted by
          AI, gamified to keep you going.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={contentVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
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
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
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
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-[var(--text-secondary)]/40">
            <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-[var(--text-secondary)]/20">
            <path d="M1 1l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
