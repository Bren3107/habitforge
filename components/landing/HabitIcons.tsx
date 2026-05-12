// Placeholder SVG habit icons for the Phase 3 confetti explosion.
// Swap out the SVG content here whenever you have final assets.

export interface HabitIcon {
  name: string;
  color: string;
  svg: React.ReactNode;
}

export const HABIT_ICONS: HabitIcon[] = [
  {
    name: "book",
    color: "#f59e0b",
    svg: (
      <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
        <rect x="2" y="1" width="22" height="30" rx="2" stroke="currentColor" strokeWidth="2.5" />
        <rect x="2" y="1" width="5" height="30" rx="2" fill="currentColor" opacity="0.35" />
        <line x1="11" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "dumbbell",
    color: "#0a0a0a",
    svg: (
      <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
        <rect x="0" y="5" width="7" height="10" rx="2" fill="currentColor" />
        <rect x="33" y="5" width="7" height="10" rx="2" fill="currentColor" />
        <rect x="5" y="3" width="5" height="14" rx="1.5" fill="currentColor" />
        <rect x="30" y="3" width="5" height="14" rx="1.5" fill="currentColor" />
        <rect x="10" y="8" width="20" height="4" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "headphones",
    color: "#6366f1",
    svg: (
      <svg width="32" height="30" viewBox="0 0 32 30" fill="none">
        <path d="M4 18 C4 8 28 8 28 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <rect x="0" y="15" width="8" height="11" rx="3" fill="currentColor" />
        <rect x="24" y="15" width="8" height="11" rx="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "lightning",
    color: "#f97316",
    svg: (
      <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
        <path d="M13 1L1 20h9l-3 13L21 14h-9l3-13z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "star",
    color: "#eab308",
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 2l3.8 8 8.2 1.2-6 5.8 1.4 8.4L16 21.2l-7.4 4.2 1.4-8.4-6-5.8 8.2-1.2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "target",
    color: "#ef4444",
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "drop",
    color: "#38bdf8",
    svg: (
      <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
        <path d="M11 1C11 1 1 14 1 20a10 10 0 0 0 20 0C21 14 11 1 11 1z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "heart",
    color: "#f43f5e",
    svg: (
      <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
        <path d="M16 26C16 26 2 17 2 9a7 7 0 0 1 14 0 7 7 0 0 1 14 0c0 8-14 17-14 17z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "moon",
    color: "#a78bfa",
    svg: (
      <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
        <path d="M22 15A11 11 0 1 1 9 2a9 9 0 0 0 13 13z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "music",
    color: "#34d399",
    svg: (
      <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
        <path d="M10 26V8l16-4v18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="6" cy="26" r="5" fill="currentColor" />
        <circle cx="22" cy="22" r="5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "apple",
    color: "#0a0a0a",
    svg: (
      <svg width="26" height="32" viewBox="0 0 26 32" fill="none">
        <path d="M13 9C8 9 3 13 3 20c0 6 4 11 8 11 2 0 3-1 4-1s2 1 4 1c4 0 8-5 8-11 0-7-5-11-10-11z" fill="currentColor" />
        <path d="M13 9C13 9 15 3 20 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    name: "clock",
    color: "#737373",
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" />
        <line x1="16" y1="7" x2="16" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="16" x2="23" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];
