import type { LevelProgressData } from "@/lib/api";

interface XPBarProps {
  totalXP: number;
  levelProgress: LevelProgressData;
}

export function XPBar({ totalXP, levelProgress }: XPBarProps) {
  const fillPercent = Math.min(
    Math.round((levelProgress.current / levelProgress.threshold) * 100),
    100
  );

  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[var(--text-primary)] font-bold capitalize">{levelProgress.level}</span>
        {levelProgress.level !== "legend" && (
          <span className="text-[var(--text-secondary)] text-xs capitalize">{levelProgress.nextLevel}</span>
        )}
      </div>
      <div className="bg-[var(--bg-raised)] rounded-full h-3 mb-2">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{
            width: `${fillPercent}%`,
            background: "linear-gradient(90deg, var(--accent-ember), var(--accent-fire))",
          }}
        />
      </div>
      <div className="text-center text-[var(--text-secondary)] text-xs">
        {totalXP} XP · {levelProgress.current} / {levelProgress.threshold} to next level
      </div>
    </div>
  );
}
