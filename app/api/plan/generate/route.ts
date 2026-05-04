/**
 * POST /api/plan/generate
 * Generates a personalized habit plan using the full AI pipeline
 *
 * Request body:
 * {
 *   sessionId: string  - Session ID from /api/conversation/start
 *   category: string   - fitness | productivity | learning
 * }
 *
 * Pipeline:
 * 1. Retrieve conversation session
 * 2. Load knowledge graph principles for category
 * 3. Compute embedding of conversation summary
 * 4. Find similar success cases via semantic search
 * 5. Generate personalized plan with Claude Sonnet
 * 6. Save to Supabase
 * 7. Return plan with ID
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/llm";
import { getPrinciplesByCategory } from "@/lib/ai/knowledge-graph";
import { embed, initEmbeddings } from "@/lib/ai/embeddings";
import { findSimilarCases, type SuccessCase } from "@/lib/ai/semantic-search";
import { getSession, deleteSession } from "@/app/api/conversation/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, category = "fitness" } = body;

    // Validate required fields
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    if (!["fitness", "productivity", "learning"].includes(category)) {
      return NextResponse.json(
        {
          error: 'category must be one of: fitness, productivity, learning',
        },
        { status: 400 }
      );
    }

    // Get session
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    const { user_context } = session;

    // Validate conversation is complete
    if (!user_context.lifestyle_summary) {
      return NextResponse.json(
        {
          error: 'Conversation not complete. Use /api/conversation/respond until context_complete is true',
        },
        { status: 400 }
      );
    }

    // Step 1: Get applicable psychology principles
    const applicable_principles = await getPrinciplesByCategory(category);

    if (!applicable_principles || applicable_principles.length === 0) {
      return NextResponse.json(
        { error: `No principles found for category: ${category}` },
        { status: 500 }
      );
    }

    // Step 2: Compute embedding of conversation summary
    let similar_cases: SuccessCase[] = [];
    try {
      await initEmbeddings();
      const conversationEmbedding = await embed(
        user_context.lifestyle_summary.substring(0, 512)
      );

      // Step 3: Find similar success cases (requires Supabase)
      // For now, return empty array (Supabase integration in Phase 3)
      // findSimilarCases would require initialized Supabase client
      console.log(
        "[plan/generate] Embedding computed (Supabase search deferred to Phase 3)"
      );
      similar_cases = [];
    } catch (error) {
      console.warn(
        "[plan/generate] Embedding computation failed, continuing without semantic search:",
        error
      );
      similar_cases = [];
    }

    // Step 4: Generate plan with Claude Sonnet
    const habit_plan = await generatePlan(
      user_context,
      applicable_principles,
      similar_cases,
      category
    );

    // Step 5: Clean up session (plan is generated)
    deleteSession(sessionId);

    // Step 6: Return plan (Supabase save deferred to Phase 3)
    return NextResponse.json({
      plan: habit_plan,
      category,
      principles_used: habit_plan.psychology_principles_used,
      message:
        "Plan generated successfully. Save to database and create user_id in Phase 3",
    });
  } catch (error) {
    console.error("[POST /api/plan/generate] Error:", error);

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
      { error: `Failed to generate plan: ${errorMessage}` },
      { status: 500 }
    );
  }
}
