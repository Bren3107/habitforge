"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTextSplitter, type SplitLine } from "@/hooks/useTextSplitter";

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

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSignedIn(!!user);
    });
  }, []);

  useEffect(() => {
    const els = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!els.length || !sectionRef.current) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(els, { opacity: 1, x: 0, y: 0, rotation: 0 });
      setContentVisible(true);
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Pre-generate each letter's pile position once so both timeline phases
      // share the exact same scatter coordinates.
      const scatter = els.map(() => ({
        x: (Math.random() - 0.5) * 500,
        y: Math.random() * 80 + 60,
        rotation: (Math.random() - 0.5) * 100,
      }));

      // Letters start above the viewport — they become visible (opacity 1) but
      // are off-screen until the user starts scrolling.
      gsap.set(els, {
        x: (i) => scatter[i].x * 0.3,
        y: -window.innerHeight * 1.1,
        rotation: (i) => scatter[i].rotation,
        opacity: 1,
      });

      const tl = gsap.timeline({ paused: true });

      // ── Phase 1 (0 → ~45 % of scroll): fall from sky → pile ───────────
      tl.to(els, {
        x: (i) => scatter[i].x,
        y: (i) => scatter[i].y,
        rotation: (i) => scatter[i].rotation,
        ease: "power2.in",
        duration: 1.2,
        stagger: { each: 0.03, from: "random" },
      });

      // ── Phase 2 (~45 → 100 % of scroll): pile → assembled heading ─────
      tl.to(els, {
        x: 0,
        y: 0,
        rotation: 0,
        ease: "power3.out",
        duration: 1.3,
        stagger: { each: 0.035, from: "random" },
      });

      // ── ScrollTrigger: pin the section for 2 × viewport scroll distance ─
      // "scrub: 1.5" makes the letters feel heavy — they lag slightly behind
      // the scroll wheel, then coast into place.
      ScrollTrigger.create({
        animation: tl,
        trigger: sectionRef.current,
        start: "top top",
        end: () => "+=" + window.innerHeight * 2,
        scrub: 1.5,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onLeave: (self) => {
          // User has scrolled all the way through. Snap to fully assembled,
          // then permanently kill the trigger so scrolling back never
          // re-scatters the letters for the rest of this session.
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
      <div className="max-w-4xl mx-auto text-center">
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
                    // Hidden until GSAP repositions above viewport on mount.
                    opacity: 0,
                    willChange: "transform",
                  }}
                >
                  {c.isSpace ? " " : c.char}
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
          <svg
            width="14"
            height="10"
            viewBox="0 0 14 10"
            fill="none"
            className="text-[var(--text-secondary)]/40"
          >
            <path
              d="M1 1l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            width="14"
            height="10"
            viewBox="0 0 14 10"
            fill="none"
            className="text-[var(--text-secondary)]/20"
          >
            <path
              d="M1 1l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
