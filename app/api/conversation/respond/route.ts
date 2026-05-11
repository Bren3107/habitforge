/**
 * POST /api/conversation/respond
 * Processes user response and generates the next follow-up question
 *
 * Request body:
 * {
 *   sessionId: string   - Session ID from /start
 *   user_answer: string - User's response to the previous question
 * }
 *
 * Response:
 * {
 *   question: string | null  - Next question, or null if context_complete
 *   context_complete: boolean - True when we have enough context
 * }
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

import { generateQuestion } from "@/lib/ai/llm";
import { getSession, updateSessionContext } from "../session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, user_answer } = body;

    // Validate required fields
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!user_answer || typeof user_answer !== "string") {
      return NextResponse.json(
        { error: "user_answer is required and must be a string" },
        { status: 400 }
      );
    }

    // Get session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Add user answer to conversation history
    session.user_context.conversation_history.push({
      role: "user",
      content: user_answer.trim(),
    });

    // Hard counter: if user has answered 4 questions, skip Claude and complete
    const userMessageCount = session.user_context.conversation_history.filter(
      m => m.role === "user"
    ).length;

    if (userMessageCount >= 4) {
      // Build lifestyle summary from conversation
      const conversationText = session.user_context.conversation_history
        .map((turn) => `${turn.role}: ${turn.content}`)
        .join("\n");
      session.user_context.lifestyle_summary = conversationText;
      await updateSessionContext(sessionId, session.user_context);

      return NextResponse.json({
        question: null,
        context_complete: true,
        suggestions: [],
      });
    }

    // Generate next question
    const questionResponse = await generateQuestion(
      session.user_context.conversation_history,
      session.user_context
    );

    // Add assistant's response to history
    if (questionResponse.question) {
      session.user_context.conversation_history.push({
        role: "assistant",
        content: questionResponse.question,
      });
    } else if (questionResponse.context_complete) {
      // Build lifestyle summary from conversation
      const conversationText = session.user_context.conversation_history
        .map((turn) => `${turn.role}: ${turn.content}`)
        .join("\n");
      session.user_context.lifestyle_summary = conversationText;
    }

    // Update session
    await updateSessionContext(sessionId, session.user_context);

    return NextResponse.json({
      question: questionResponse.question,
      context_complete: questionResponse.context_complete,
      suggestions: questionResponse.suggestions,
    });
  } catch (error) {
    console.error("[POST /api/conversation/respond] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    if (errorMessage.includes("API request failed")) {
      return NextResponse.json(
        { error: "Claude API error. Please try again." },
        { status: 503 }
      );
    }

    if (errorMessage.includes("Session not found")) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: `Failed to process response: ${errorMessage}` },
      { status: 500 }
    );
  }
}
