/**
 * LLM Orchestration Service for HabitForge
 *
 * Orchestrates Claude API calls for two core functions:
 * 1. generateQuestion() - Uses Claude Haiku to generate follow-up questions during onboarding
 * 2. generatePlan() - Uses Claude Sonnet to synthesize personalized habit plans
 */

import type { Principle } from "./knowledge-graph";
import type { SuccessCase } from "./semantic-search";

/**
 * Represents a single turn in a conversation
 */
export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Response from generateQuestion()
 */
export interface QuestionResponse {
  question: string | null;
  context_complete: boolean;
  suggestions: string[];
}

/**
 * User context gathered during onboarding
 */
export interface UserContext {
  goal: string;
  motivation: string;
  constraints: Record<string, unknown>;
  lifestyle_summary: string;
  conversation_history: ConversationTurn[];
}

/**
 * A daily action segment in the habit plan
 */
export interface DailyAction {
  day: number;
  actions: string[];
  cue: string;
  reward: string;
}

/**
 * A week's progression in the habit plan
 */
export interface WeekProgression {
  week: number;
  focus: string;
  expected_difficulty: string;
}

/**
 * The complete habit plan
 */
export interface HabitPlan {
  plan_title: string;
  daily_actions: DailyAction[];
  psychology_principles_used: string[];
  week_progression: WeekProgression[];
  explanation: string;
}

// Initialize Anthropic client lazily
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let anthropicClient: any = null;

async function getAnthropicClient() {
  if (!anthropicClient) {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

/**
 * Reset the Anthropic client (used for testing)
 */
export function resetAnthropicClient(): void {
  anthropicClient = null;
}

/**
 * Validates that a string is non-empty
 */
function validateNonEmptyString(value: unknown, fieldName: string): string {
  if (!value || typeof value !== "string") {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value;
}

/**
 * Extract JSON from markdown code blocks if present, with fallback to brace extraction
 */
function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Fallback: find the outermost { ... } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1).trim();
  return text.trim();
}

/**
 * Validates that an array is non-empty
 */
function validateNonEmptyArray(
  value: unknown,
  fieldName: string
): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty array`);
  }
  return value;
}

/**
 * Generates a follow-up question during onboarding using Claude Haiku
 *
 * Uses Claude Haiku for fast, cost-effective questioning during the intake interview.
 * Asks targeted follow-up questions to gather context for personalization.
 * Stops when enough context is collected (max 7 questions).
 *
 * @param conversation_history - Array of {role, content} representing conversation so far
 * @param user_context - Current user context (goal, motivation, constraints, lifestyle)
 * @returns Promise resolving to {question, context_complete}
 * @throws Error if inputs are invalid or API call fails
 */
export async function generateQuestion(
  conversation_history: ConversationTurn[],
  user_context: Partial<UserContext>
): Promise<QuestionResponse> {
  // Input validation
  validateNonEmptyArray(conversation_history, "conversation_history");
  if (!user_context || typeof user_context !== "object") {
    throw new Error("user_context must be an object");
  }

  const goal = validateNonEmptyString(user_context.goal, "user_context.goal");
  const motivation = validateNonEmptyString(
    user_context.motivation,
    "user_context.motivation"
  );

  // Build conversation context
  const conversationText = conversation_history
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n");

  const systemPrompt = `You are a friendly habit coach conducting a brief intake. Ask exactly 4 compound questions — each one naturally weaves two related topics into a single flowing sentence. Keep each question under 20 words. Sound warm and encouraging, not clinical. Never set context_complete to true — the system handles completion for you.

Topic pairs to draw from (pick the most relevant to the user's goal):
- Schedule + time availability (e.g. "When do you have the most energy during the day, and how much time could you realistically set aside?")
- Existing routines + lifestyle context (e.g. "What does a typical weekday look like for you, and are there habits you already have we could build on?")
- Past attempts + what got in the way (e.g. "Have you tried building this habit before, and if so what usually gets in the way?")
- Commitment depth + accountability preference (e.g. "How important is this goal to you right now, and do you prefer tracking solo or with some accountability?")

Also return 2-3 very short example answers as suggestions to help the user know what to write.

Respond ONLY with valid JSON (no markdown):
{"question": "...", "context_complete": false, "suggestions": ["...", "...", "..."]}`;

  const questionsAsked = conversation_history.filter(m => m.role === "user").length;

  const userPrompt = `Current user context:
Goal: ${goal}
Motivation: ${motivation}
${user_context.lifestyle_summary ? `Lifestyle: ${user_context.lifestyle_summary}` : ""}
${user_context.constraints ? `Constraints: ${JSON.stringify(user_context.constraints)}` : ""}

Conversation so far (question ${questionsAsked + 1} of 4):
${conversationText}

Generate question ${questionsAsked + 1}.`;

  try {
    const anthropic = await getAnthropicClient();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract the response text
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    let result: QuestionResponse;
    try {
      const cleanedText = extractJSON(responseText);
      result = JSON.parse(cleanedText);
    } catch {
      throw new Error(
        `Failed to parse Claude response as JSON: ${responseText}`
      );
    }

    // Validate response structure
    if (typeof result.question !== "string" && result.question !== null) {
      throw new Error(
        `Invalid question field: expected string or null, got ${typeof result.question}`
      );
    }
    if (typeof result.context_complete !== "boolean") {
      throw new Error(
        `Invalid context_complete field: expected boolean, got ${typeof result.context_complete}`
      );
    }
    // Normalize suggestions — default to empty array if missing or malformed
    if (!Array.isArray(result.suggestions)) {
      result.suggestions = [];
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes("API request failed")) {
      throw new Error(
        `Claude API error: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Generates a personalized habit plan using Claude Sonnet
 *
 * Uses Claude Sonnet for more capable synthesis of a complete habit plan.
 * Incorporates psychology principles and similar success cases to ground the plan.
 *
 * @param user_context - Complete user context gathered during onboarding
 * @param applicable_principles - Psychology principles filtered for user's constraints
 * @param similar_cases - Top 3 similar success cases from semantic search
 * @param category - Category (fitness, productivity, or learning)
 * @returns Promise resolving to a complete HabitPlan object
 * @throws Error if inputs are invalid or API call fails
 */
export async function generatePlan(
  user_context: UserContext,
  applicable_principles: Principle[],
  similar_cases: SuccessCase[],
  category: string
): Promise<HabitPlan> {
  // Input validation
  if (!user_context || typeof user_context !== "object") {
    throw new Error("user_context must be an object");
  }

  validateNonEmptyString(user_context.goal, "user_context.goal");
  validateNonEmptyString(user_context.motivation, "user_context.motivation");
  validateNonEmptyArray(
    user_context.conversation_history,
    "user_context.conversation_history"
  );
  validateNonEmptyArray(applicable_principles, "applicable_principles");
  // similar_cases can be empty (semantic search deferred to Phase 3)
  validateNonEmptyString(category, "category");

  // Build conversation summary
  const conversationSummary = user_context.conversation_history
    .slice(-6) // Last 3 exchanges
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n");

  // Format principles for inclusion
  const principlesText = applicable_principles
    .map((p) => `- ${p.name} (${p.id}): ${p.description}. Example: ${p.example}`)
    .join("\n");

  // Format similar cases (empty array is okay - semantic search in Phase 3)
  const casesText =
    similar_cases.length > 0
      ? similar_cases
          .map(
            (c) =>
              `- ${c.category}: ${c.description}. Success principles: ${Array.isArray(c.principle_ids) ? c.principle_ids.join(", ") : "N/A"}`
          )
          .join("\n")
      : "";

  const systemPrompt = `You are an expert habit coach grounded in behavioral psychology.
Generate a personalized habit plan as JSON matching this exact schema:
{
  "plan_title": "string",
  "daily_actions": [{"day": number, "actions": ["string"], "cue": "string", "reward": "string"}],
  "psychology_principles_used": ["string"],
  "week_progression": [{"week": number, "focus": "string", "expected_difficulty": "string"}],
  "explanation": "string"
}

Requirements:
1. Use the provided psychology principles explicitly (include at least 3)
2. Match the user's constraints and lifestyle exactly
3. Progress from simple to complex over 4 weeks
4. Name each cue, routine, and reward explicitly (no generic descriptions)
5. Ground recommendations in the success cases provided
6. Make the plan achievable and personalized

Respond with ONLY valid JSON (no markdown, no extra text).`;

  const userPrompt = `Generate a personalized ${category} habit plan.

User Profile:
Goal: ${user_context.goal}
Motivation: ${user_context.motivation}
Lifestyle: ${user_context.lifestyle_summary}
Constraints: ${JSON.stringify(user_context.constraints)}

Recent Conversation:
${conversationSummary}

Applicable Psychology Principles:
${principlesText}

Similar Success Cases:
${casesText}

Create a 4-week progression plan that uses the principles and is grounded in the success cases.`;

  try {
    const anthropic = await getAnthropicClient();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract response text
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    let result: HabitPlan;
    try {
      const cleanedText = extractJSON(responseText);
      result = JSON.parse(cleanedText);
    } catch {
      throw new Error(
        `Failed to parse Claude response as JSON: ${responseText.substring(0, 200)}...`
      );
    }

    // Validate response structure
    if (!result.plan_title || typeof result.plan_title !== "string") {
      throw new Error("Invalid plan_title in response");
    }
    if (!Array.isArray(result.daily_actions) || result.daily_actions.length === 0) {
      throw new Error("Invalid daily_actions in response");
    }
    if (
      !Array.isArray(result.psychology_principles_used) ||
      result.psychology_principles_used.length === 0
    ) {
      throw new Error("Invalid psychology_principles_used in response");
    }
    if (
      !Array.isArray(result.week_progression) ||
      result.week_progression.length === 0
    ) {
      throw new Error("Invalid week_progression in response");
    }
    if (!result.explanation || typeof result.explanation !== "string") {
      throw new Error("Invalid explanation in response");
    }

    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes("API request failed")) {
      throw new Error(
        `Claude API error: ${error.message}`
      );
    }
    throw error;
  }
}
