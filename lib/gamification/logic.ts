export interface LevelProgress {
  level: string;
  nextLevel: string;
  current: number;
  threshold: number;
}

export interface BadgeStats {
  current_streak: number;
  total_checkins: number;
}

const LEVELS = [
  { name: "rookie", min: 0 },
  { name: "explorer", min: 100 },
  { name: "achiever", min: 300 },
  { name: "master", min: 700 },
  { name: "legend", min: 1500 },
];

export function calculateXP(newStreak: number): number {
  let xp = 10;
  if (newStreak >= 2) xp += 5;
  if (newStreak === 7) xp += 20;
  if (newStreak === 30) xp += 50;
  return xp;
}

export function calculateLevel(totalXP: number): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].min) return LEVELS[i].name;
  }
  return "rookie";
}

export function getLevelProgress(totalXP: number): LevelProgress {
  let levelIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].min) {
      levelIdx = i;
      break;
    }
  }
  const current = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1];
  if (!next) {
    return { level: "legend", nextLevel: "legend", current: totalXP - current.min, threshold: 500 };
  }
  return {
    level: current.name,
    nextLevel: next.name,
    current: totalXP - current.min,
    threshold: next.min - current.min,
  };
}

export function checkBadgeUnlocks(currentBadges: string[], stats: BadgeStats): string[] {
  const newBadges: string[] = [];
  if (!currentBadges.includes("day_1") && stats.total_checkins >= 1) {
    newBadges.push("day_1");
  }
  if (!currentBadges.includes("week_warrior") && stats.current_streak >= 7) {
    newBadges.push("week_warrior");
  }
  if (!currentBadges.includes("consistency_champion") && stats.current_streak >= 30) {
    newBadges.push("consistency_champion");
  }
  return newBadges;
}
