import type { PatternAnalysis } from "./pattern-analysis";
import type { HabitPlan } from "./llm";

let anthropicClient: ReturnType<typeof import("@anthropic-ai/sdk")["default"]["prototype"]["constructor"]> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAnthropicClient(): Promise<any> {
  if (!anthropicClient) {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function formatAnalysisSummary(analysis: PatternAnalysis): string {
  const pct = (r: number) => `${Math.round(r * 100)}%`;
  const lines: string[] = [
    `Overall completion: ${pct(analysis.overallCompletionRate)} over ${analysis.totalDays} days`,
    `Last 7 days: ${pct(analysis.last7DayRate)}`,
  ];
  if (analysis.totalDays >= 14) {
    lines.push(`Previous 7 days: ${pct(analysis.prev7DayRate)}`);
    lines.push(`Trend: ${analysis.trend}`);
  }
  if (analysis.bestDayOfWeek) lines.push(`Best day: ${analysis.bestDayOfWeek}`);
  if (analysis.worstDayOfWeek && analysis.worstDayOfWeek !== analysis.bestDayOfWeek) {
    lines.push(`Hardest day: ${analysis.worstDayOfWeek}`);
  }
  return lines.join("\n");
}

export async function generateCoachingMessage(
  analysis: PatternAnalysis,
  plan: HabitPlan,
  goal: string,
  weekNumber: number
): Promise<string> {
  const anthropic = await getAnthropicClient();

  const systemPrompt = `You are a warm, encouraging habit coach. Write a brief weekly check-in message (2–3 sentences max) for a user working on their habit goal.

Structure: one specific insight from their data, one word of genuine encouragement, one concrete suggestion.
Tone: supportive, direct, never preachy. Use "you" not "one". No emojis.`;

  const userPrompt = `Week ${weekNumber} coaching for: "${goal}"
Plan title: ${plan.plan_title}

Their stats this week:
${formatAnalysisSummary(analysis)}

Write the coaching message.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");
  return content.text.trim();
}
