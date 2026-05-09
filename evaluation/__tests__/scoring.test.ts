import { scorePersonalization, scorePrincipleCoverage, isDifficultyAppropriate } from "../scoring";
import { PERSONAS } from "../personas";
import type { HabitPlan } from "@/lib/ai/llm";

function makePlan(overrides: Partial<HabitPlan> = {}): HabitPlan {
  return {
    plan_title: "Test Plan",
    explanation: "A generic plan",
    daily_actions: [{ day: 1, cue: "morning alarm", actions: ["10 min walk"], reward: "coffee" }],
    week_progression: [{ week: 1, focus: "Foundation", expected_difficulty: "easy" }],
    psychology_principles_used: [],
    ...overrides,
  } as HabitPlan;
}

describe("scorePersonalization", () => {
  it("returns 9 for a persona with no constraints (F1 Maria)", () => {
    const maria = PERSONAS.find((p) => p.id === "F1")!;
    expect(scorePersonalization(makePlan(), maria)).toBe(9);
  });

  it("returns lower score when constraint keywords are absent from plan", () => {
    const sofia = PERSONAS.find((p) => p.id === "F3")!;
    expect(scorePersonalization(makePlan({ explanation: "Do a workout" }), sofia)).toBeLessThan(9);
  });

  it("returns higher score when constraint keywords appear in plan text", () => {
    const sofia = PERSONAS.find((p) => p.id === "F3")!;
    const score = scorePersonalization(
      makePlan({
        explanation: "Designed for a single parent with only 15 minutes and low energy levels.",
      }),
      sofia
    );
    expect(score).toBeGreaterThan(4);
  });

  it("never returns 0 (minimum is 1)", () => {
    const james = PERSONAS.find((p) => p.id === "F2")!;
    expect(scorePersonalization(makePlan({ explanation: "xyz" }), james)).toBeGreaterThanOrEqual(1);
  });
});

describe("scorePrincipleCoverage", () => {
  it("returns 0 when no available principles", () => {
    expect(scorePrincipleCoverage(["habit_stacking"], [])).toBe(0);
  });

  it("returns 1 when all available principles appear in plan", () => {
    expect(scorePrincipleCoverage(["a", "b", "c"], ["a", "b", "c"])).toBe(1);
  });

  it("returns 0.5 when half the principles are covered", () => {
    expect(scorePrincipleCoverage(["a"], ["a", "b"])).toBe(0.5);
  });

  it("normalises case and underscores", () => {
    expect(scorePrincipleCoverage(["Habit Stacking"], ["habit_stacking"])).toBe(1);
  });
});

describe("isDifficultyAppropriate", () => {
  it("returns true when plan mentions fewer minutes than persona max (F3 Sofia, max 15)", () => {
    const sofia = PERSONAS.find((p) => p.id === "F3")!;
    expect(
      isDifficultyAppropriate(
        makePlan({ daily_actions: [{ day: 1, cue: "", actions: ["10 minute walk"], reward: "" }] }),
        sofia
      )
    ).toBe(true);
  });

  it("returns false when plan mentions more minutes than persona max (F3 Sofia, max 15)", () => {
    const sofia = PERSONAS.find((p) => p.id === "F3")!;
    expect(
      isDifficultyAppropriate(
        makePlan({ daily_actions: [{ day: 1, cue: "", actions: ["30 min run"], reward: "" }] }),
        sofia
      )
    ).toBe(false);
  });

  it("returns true when no minute reference found (cannot determine — assume ok)", () => {
    const marcus = PERSONAS.find((p) => p.id === "L3")!;
    expect(
      isDifficultyAppropriate(
        makePlan({ daily_actions: [{ day: 1, cue: "", actions: ["Practice guitar"], reward: "" }] }),
        marcus
      )
    ).toBe(true);
  });
});
