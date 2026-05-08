const ALL_BADGES = [
  { id: "first_step", name: "First Step", icon: "⭐", description: "Plan generated" },
  { id: "day_1", name: "Day 1", icon: "🏁", description: "First check-in" },
  { id: "week_warrior", name: "Week Warrior", icon: "🗡️", description: "7-day streak" },
  { id: "habit_scientist", name: "Habit Scientist", icon: "🔬", description: "Run evaluation" },
  { id: "consistency_champion", name: "Champion", icon: "🏆", description: "30-day streak" },
  { id: "triple_threat", name: "Triple Threat", icon: "⚡", description: "3 categories" },
  { id: "habit_master", name: "Habit Master", icon: "🔱", description: "5 plans" },
];

interface BadgeGridProps {
  earnedBadges: string[];
}

export function BadgeGrid({ earnedBadges }: BadgeGridProps) {
  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-4">Badges</p>
      <div className="flex flex-wrap gap-2">
        {ALL_BADGES.map((badge) => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <div
              key={badge.id}
              title={badge.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-opacity ${
                earned
                  ? "border-[var(--accent-ember)] text-[var(--text-primary)] bg-[var(--accent-ember)] bg-opacity-10"
                  : "border-[var(--border)] text-[var(--text-secondary)] opacity-40"
              }`}
            >
              <span>{badge.icon}</span>
              <span>{badge.name}</span>
              {!earned && <span className="ml-0.5">🔒</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
