import { NextResponse } from "next/server";
import { PERSONAS, type Persona } from "@/evaluation/personas";
import {
  scorePersonalization,
  scorePrincipleCoverage,
  isDifficultyAppropriate,
  type PersonaMetrics,
} from "@/evaluation/scoring";
import { generatePlan, type UserContext } from "@/lib/ai/llm";
import { getPrinciplesByCategory } from "@/lib/ai/knowledge-graph";
import type { SuccessCase } from "@/lib/ai/semantic-search";
import {
  calculateConfidence,
  estimateMotivationSentiment,
  calculateConstraintFit,
  confidenceLevel,
} from "@/lib/ai/confidence";

// Allow up to 60 seconds — 9 sequential Claude Sonnet calls take ~45-60s
export const maxDuration = 60;

export interface EvaluationResultItem {
  personaId: string;
  personaName: string;
  category: string;
  difficulty: string;
  planTitle: string;
  principlesUsed: string[];
  metrics: PersonaMetrics;
  error?: string;
}

export interface EvaluationRunResponse {
  results: EvaluationResultItem[];
  summary: {
    avgPersonalizationScore: number;
    avgPrincipleCoverage: number;
    avgConfidenceScore: number;
    difficultyAppropriateCount: number;
    totalPersonas: number;
    completedPersonas: number;
  };
  ranAt: string;
}

async function runSinglePersona(persona: Persona): Promise<EvaluationResultItem> {
  try {
    // 1. Load applicable principles for this category
    const applicable_principles = await getPrinciplesByCategory(persona.category);
    const availablePrincipleIds = applicable_principles.map((p) => p.id);

    // 2. No semantic search in evaluation — mirrors current main pipeline
    const similar_cases: SuccessCase[] = [];

    // 3. Build a UserContext from persona data
    const user_context: UserContext = {
      goal: persona.goal,
      motivation: persona.motivation,
      constraints: Object.fromEntries(
        persona.constraints.map((c, i) => [`constraint_${i}`, c])
      ),
      lifestyle_summary: persona.lifestyle_summary,
      conversation_history: [
        { role: "user", content: persona.goal },
        { role: "assistant", content: "What motivates you to build this habit?" },
        { role: "user", content: persona.motivation },
        { role: "assistant", content: "What constraints do you face day-to-day?" },
        {
          role: "user",
          content:
            persona.constraints.length > 0
              ? persona.constraints.join("; ")
              : "No major constraints.",
        },
      ],
    };

    // 4. Generate plan via Claude Sonnet
    const plan = await generatePlan(user_context, applicable_principles, similar_cases, persona.category);

    // 5. Score confidence (mirrors generate route logic)
    const lifestyleText = persona.lifestyle_summary.toLowerCase();
    const constraintTags: string[] = [];
    if (/15\s*min|no.time|very.busy/.test(lifestyleText)) constraintTags.push("low_time");
    if (/30\s*min|limited.time|busy/.test(lifestyleText)) constraintTags.push("low_time");
    if (/tired|exhaust|low.energy/.test(lifestyleText)) constraintTags.push("low_energy");
    if (/unmotivat|struggling|can.t/.test(lifestyleText)) constraintTags.push("low_motivation");
    if (constraintTags.length === 0) constraintTags.push("general");

    const principleApplicableWhen = applicable_principles.flatMap((p) => p.applicable_when);
    const constraintFit = calculateConstraintFit(constraintTags, principleApplicableWhen);
    const motivationSentiment = estimateMotivationSentiment(persona.motivation);
    const confScore = calculateConfidence(constraintFit, 0.5, motivationSentiment);

    // 6. Calculate all 5 metrics
    const metrics: PersonaMetrics = {
      personalizationScore: scorePersonalization(plan, persona),
      principleCoverage: scorePrincipleCoverage(
        plan.psychology_principles_used ?? [],
        availablePrincipleIds
      ),
      confidenceScore: confScore,
      confidenceLabel: confidenceLevel(confScore),
      difficultyAppropriate: isDifficultyAppropriate(plan, persona),
    };

    return {
      personaId: persona.id,
      personaName: persona.name,
      category: persona.category,
      difficulty: persona.difficulty,
      planTitle: plan.plan_title ?? "Untitled",
      principlesUsed: plan.psychology_principles_used ?? [],
      metrics,
    };
  } catch (err) {
    return {
      personaId: persona.id,
      personaName: persona.name,
      category: persona.category,
      difficulty: persona.difficulty,
      planTitle: "",
      principlesUsed: [],
      metrics: {
        personalizationScore: 0,
        principleCoverage: 0,
        confidenceScore: 0,
        confidenceLabel: "Unknown",
        difficultyAppropriate: false,
      },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function POST() {
  const results: EvaluationResultItem[] = [];

  // Run sequentially to avoid rate limits
  for (const persona of PERSONAS) {
    const result = await runSinglePersona(persona);
    results.push(result);
  }

  const completed = results.filter((r) => !r.error);

  const summary = {
    avgPersonalizationScore:
      completed.reduce((s, r) => s + r.metrics.personalizationScore, 0) / (completed.length || 1),
    avgPrincipleCoverage:
      completed.reduce((s, r) => s + r.metrics.principleCoverage, 0) / (completed.length || 1),
    avgConfidenceScore:
      completed.reduce((s, r) => s + r.metrics.confidenceScore, 0) / (completed.length || 1),
    difficultyAppropriateCount: completed.filter((r) => r.metrics.difficultyAppropriate).length,
    totalPersonas: PERSONAS.length,
    completedPersonas: completed.length,
  };

  return NextResponse.json({
    results,
    summary,
    ranAt: new Date().toISOString(),
  } satisfies EvaluationRunResponse);
}
