import {
  calculateXP,
  calculateLevel,
  getLevelProgress,
  checkBadgeUnlocks,
} from "../logic";

describe("calculateXP", () => {
  it("returns 10 XP for first check-in (streak = 1)", () => {
    expect(calculateXP(1)).toBe(10);
  });

  it("returns 15 XP on streak day 2", () => {
    expect(calculateXP(2)).toBe(15);
  });

  it("returns 35 XP on streak day 7 (10 + 5 + 20 bonus)", () => {
    expect(calculateXP(7)).toBe(35);
  });

  it("returns 65 XP on streak day 30 (10 + 5 + 50 bonus)", () => {
    expect(calculateXP(30)).toBe(65);
  });
});

describe("calculateLevel", () => {
  it("returns rookie for 0 XP", () => {
    expect(calculateLevel(0)).toBe("rookie");
  });

  it("returns explorer at 100 XP", () => {
    expect(calculateLevel(100)).toBe("explorer");
  });

  it("returns achiever at 300 XP", () => {
    expect(calculateLevel(300)).toBe("achiever");
  });

  it("returns master at 700 XP", () => {
    expect(calculateLevel(700)).toBe("master");
  });

  it("returns legend at 1500 XP", () => {
    expect(calculateLevel(1500)).toBe("legend");
  });
});

describe("getLevelProgress", () => {
  it("returns correct progress within explorer tier", () => {
    const result = getLevelProgress(150);
    expect(result.level).toBe("explorer");
    expect(result.current).toBe(50); // 150 - 100
    expect(result.threshold).toBe(200); // 300 - 100
    expect(result.nextLevel).toBe("achiever");
  });

  it("handles legend tier (max level)", () => {
    const result = getLevelProgress(2000);
    expect(result.level).toBe("legend");
  });
});

describe("checkBadgeUnlocks", () => {
  it("awards day_1 on first check-in", () => {
    const newBadges = checkBadgeUnlocks(["first_step"], {
      current_streak: 1,
      total_checkins: 1,
    });
    expect(newBadges).toContain("day_1");
  });

  it("awards week_warrior at 7-day streak", () => {
    const newBadges = checkBadgeUnlocks(["first_step", "day_1"], {
      current_streak: 7,
      total_checkins: 7,
    });
    expect(newBadges).toContain("week_warrior");
  });

  it("does not re-award already earned badges", () => {
    const newBadges = checkBadgeUnlocks(
      ["first_step", "day_1", "week_warrior"],
      { current_streak: 7, total_checkins: 7 }
    );
    expect(newBadges).toHaveLength(0);
  });

  it("awards consistency_champion at 30-day streak", () => {
    const newBadges = checkBadgeUnlocks(
      ["first_step", "day_1", "week_warrior"],
      { current_streak: 30, total_checkins: 30 }
    );
    expect(newBadges).toContain("consistency_champion");
  });
});
