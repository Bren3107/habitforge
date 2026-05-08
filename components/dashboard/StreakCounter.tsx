interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-center">
      <div className="text-4xl mb-2">🔥</div>
      <div className="text-5xl font-bold text-[var(--accent-ember)]" style={{ fontFamily: "Fraunces" }}>
        {currentStreak}
      </div>
      <div className="text-[var(--text-secondary)] text-sm mt-1">day streak</div>
      <div className="text-[var(--text-secondary)] text-xs mt-3">
        longest: {longestStreak} days
      </div>
    </div>
  );
}
