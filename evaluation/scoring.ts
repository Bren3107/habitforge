import type { Persona } from "./personas";
import type { HabitPlan } from "@/lib/ai/llm";

export interface PersonaMetrics {
  personalizationScore: number;    // 1–10: how well plan text matches persona's constraint keywords
  principleCoverage: number;       // 0–1: fraction of known principles that appear in the plan
  confidenceScore: number;         // 0–1: pre-calculated by the generate pipeline
  confidenceLabel: string;         // "Very High" | "High" | "Medium" | "Low" | "Very Low"
  difficultyAppropriate: boolean;  // plan's first mentioned minute count ≤ persona.maxDailyMinutes
}

/**
 * Personalization score 1–10.
 * Searches plan text for keywords from each of the persona's constraint strings.
 * A constraint is "mentioned" if any word >3 chars from that constraint appears in the plan.
 * Personas with no constraints score 9 (plan can still be personalised to their profile).
 */
export function scorePersonalization(plan: HabitPlan, persona: Persona): number {
  if (persona.constraints.length === 0) return 9;

  const planText = [
    plan.plan_title ?? "",
    plan.explanation ?? "",
    ...(plan.daily_actions ?? []).flatMap((a) => [a.cue ?? "", ...(a.actions ?? []), a.reward ?? ""]),
    ...(plan.week_progression ?? []).map((w) => w.focus ?? ""),
  ]
    .join(" ")
    .toLowerCase();

  const matchCount = persona.constraints.filter((constraint) =>
    constraint
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .some((word) => planText.includes(word))
  ).length;

  return Math.max(1, Math.round((matchCount / persona.constraints.length) * 10));
}

/**
 * Principle coverage 0–1.
 * availablePrincipleIds: all principle IDs for the category (from knowledge graph).
 * planPrinciples: the psychology_principles_used array from the generated plan.
 * Matching is case-insensitive.
 */
export function scorePrincipleCoverage(
  planPrinciples: string[],
  availablePrincipleIds: string[]
): number {
  if (availablePrincipleIds.length === 0) return 0;
  const planSet = new Set(planPrinciples.map((p) => p.toLowerCase().replace(/\s+/g, "_")));
  const matched = availablePrincipleIds.filter((id) => planSet.has(id.toLowerCase())).length;
  return matched / availablePrincipleIds.length;
}

/**
 * Difficulty appropriateness check.
 * Extracts the first "N min" reference from any daily action's text.
 * Returns true if N ≤ persona.maxDailyMinutes, or true if no minute reference found.
 */
export function isDifficultyAppropriate(plan: HabitPlan, persona: Persona): boolean {
  const allText = (plan.daily_actions ?? [])
    .flatMap((a) => [a.cue ?? "", ...(a.actions ?? []), a.reward ?? ""])
    .join(" ");

  const match = allText.match(/(\d+)\s*(?:min|minute)/i);
  if (!match) return true;
  return parseInt(match[1], 10) <= persona.maxDailyMinutes;
}
