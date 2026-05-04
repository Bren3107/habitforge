/**
 * POST /api/plan/refine
 * Regenerates a habit plan with updated constraints
 *
 * Request body:
 * {
 *   sessionId: string          - Original session ID
 *   updated_constraints?: object - Updated constraint values
 * }
 *
 * This allows users to adjust difficulty ("make it easier/harder") and regenerate
 * the plan while preserving the conversation context.
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/llm";
import { getPrinciplesByCategory } from "@/lib/ai/knowledge-graph";
import { embed, initEmbeddings } from "@/lib/ai/embeddings";
import { type SuccessCase } from "@/lib/ai/semantic-search";
import { getSession, updateSessionContext } from "@/app/api/conversation/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, updated_constraints = {}, category = "fitness" } = body;

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

    // Update constraints if provided
    if (Object.keys(updated_constraints).length > 0) {
      user_context.constraints = {
        ...user_context.constraints,
        ...updated_constraints,
      };
      updateSessionContext(sessionId, user_context);
    }

    // Validate conversation is complete
    if (!user_context.lifestyle_summary) {
      return NextResponse.json(
        { error: "Conversation not complete" },
        { status: 400 }
      );
    }

    // Get applicable psychology principles
    const applicable_principles = await getPrinciplesByCategory(category);

    if (!applicable_principles || applicable_principles.length === 0) {
      return NextResponse.json(
        { error: `No principles found for category: ${category}` },
        { status: 500 }
      );
    }

    // Compute embedding and find similar cases
    let similar_cases: SuccessCase[] = [];
    try {
      await initEmbeddings();
      const conversationEmbedding = await embed(
        user_context.lifestyle_summary.substring(0, 512)
      );
      console.log(
        "[plan/refine] Embedding computed (Supabase search deferred)"
      );
    } catch (error) {
      console.warn("[plan/refine] Embedding computation failed, continuing");
    }

    // Generate refined plan
    const refined_plan = await generatePlan(
      user_context,
      applicable_principles,
      similar_cases,
      category
    );

    return NextResponse.json({
      plan: refined_plan,
      category,
      principles_used: refined_plan.psychology_principles_used,
      message: "Plan refined with updated constraints",
    });
  } catch (error) {
    console.error("[POST /api/plan/refine] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    if (errorMessage.includes("API request failed")) {
      return NextResponse.json(
        { error: "Claude API error. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Failed to refine plan: ${errorMessage}` },
      { status: 500 }
    );
  }
}
