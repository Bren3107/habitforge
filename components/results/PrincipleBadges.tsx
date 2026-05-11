"use client";
import { motion } from "framer-motion";

interface Props {
  principles: string[];
}

export function PrincipleBadges({ principles }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {principles.map((name, i) => (
        <motion.span
          key={name}
          className="px-3 py-1 text-sm rounded-full border cursor-default"
          style={{
            backgroundColor: "var(--bg-raised)",
            borderColor: "var(--accent-ember)",
            color: "var(--text-primary)",
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ backgroundColor: "#000000", color: "#ffffff", borderColor: "#000000" }}
          transition={{ delay: 0.1 * i, duration: 0.3, type: "spring", stiffness: 300 }}
        >
          {name}
        </motion.span>
      ))}
    </div>
  );
}
