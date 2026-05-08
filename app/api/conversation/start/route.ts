/**
 * POST /api/conversation/start
 * Initiates a new conversation session and gets the first follow-up question
 *
 * Request body:
 * {
 *   goal: string          - What habit the user wants to form
 *   motivation: string    - Why it matters to them
 *   constraints?: object  - Time, energy, budget constraints
 *   category?: string     - fitness | productivity | learning
 * }
 *
 * Response:
 * {
 *   sessionId: string
 *   question: string
 *   context_complete: boolean
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { generateQuestion } from "@/lib/ai/llm";
import type { UserContext } from "@/lib/ai/llm";
import { createSession } from "../session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goal, motivation, constraints = {}, category = "fitness" } = body;

    // Validate required fields
    if (!goal || typeof goal !== "string" || goal.trim() === "") {
      return NextResponse.json(
        { error: "goal is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (
      !motivation ||
      typeof motivation !== "string" ||
      motivation.trim() === ""
    ) {
      return NextResponse.json(
        { error: "motivation is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (
      category &&
      !["fitness", "productivity", "learning"].includes(category)
    ) {
      return NextResponse.json(
        {
          error: 'category must be one of: fitness, productivity, learning',
        },
        { status: 400 }
      );
    }

    // Initialize user context
    const user_context: UserContext = {
      goal: goal.trim(),
      motivation: motivation.trim(),
      constraints,
      lifestyle_summary: "",
      conversation_history: [
        {
          role: "assistant",
          content: `Great! I'll help you build a ${category} habit. Let me ask some follow-up questions to personalize your plan.`,
        },
      ],
    };

    // Generate first question
    const questionResponse = await generateQuestion(
      user_context.conversation_history,
      user_context
    );

    // Add assistant's first question to history
    if (questionResponse.question) {
      user_context.conversation_history.push({
        role: "assistant",
        content: questionResponse.question,
      });
    }

    // Create session
    const sessionId = await createSession(user_context);

    return NextResponse.json({
      sessionId,
      question: questionResponse.question,
      context_complete: questionResponse.context_complete,
      suggestions: questionResponse.suggestions,
      greeting: "Let's build something that actually sticks.",
    });
  } catch (error) {
    console.error("[POST /api/conversation/start] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    if (errorMessage.includes("API request failed")) {
      return NextResponse.json(
        { error: "Claude API error. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Failed to start conversation: ${errorMessage}` },
      { status: 500 }
    );
  }
}
