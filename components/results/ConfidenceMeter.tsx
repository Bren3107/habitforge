"use client";
import { motion } from "framer-motion";

interface Props {
  score: number;   // 0.0 – 1.0
  label: string;   // "High", "Very High", etc.
}

export function ConfidenceMeter({ score, label }: Props) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const percentage = Math.round(score * 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="overflow-visible">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--accent-ember)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          style={{ transformOrigin: "50px 50px", rotate: "-90deg" }}
        />
        <text
          x="50" y="55"
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="20"
          fontWeight="700"
        >
          {percentage}%
        </text>
      </svg>
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--accent-ember)" }}
      >
        {label} Confidence
      </p>
    </div>
  );
}
