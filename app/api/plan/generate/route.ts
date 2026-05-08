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
import type { SuccessCase } from "@/lib/ai/semantic-search";
import { getSession, deleteSession } from "@/app/api/conversation/session";
import { supabaseServer } from "@/lib/supabase/server";

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
    const session = await getSession(sessionId);
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

    // Semantic search deferred to Phase 3 — skip embedding entirely
    const similar_cases: SuccessCase[] = [];

    // Step 4: Generate plan with Claude Sonnet
    const habit_plan = await generatePlan(
      user_context,
      applicable_principles,
      similar_cases,
      category
    );

    // Step 5: Clean up session (plan is generated)
    await deleteSession(sessionId);

    // Step 6: Create anonymous user and save plan to Supabase
    const { data: userData, error: userError } = await supabaseServer
      .from("users")
      .insert({ session_token: sessionId })
      .select("id")
      .single();

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    const { data: planData, error: planError } = await supabaseServer
      .from("habit_plans")
      .insert({
        user_id: userData.id,
        category,
        habit_goal: user_context.goal,
        motivation: user_context.motivation,
        constraints: user_context.constraints || {},
        lifestyle_context: user_context.lifestyle_summary,
        conversation_history: user_context.conversation_history,
        generated_plan: habit_plan,
        psychology_principles: habit_plan.psychology_principles_used,
      })
      .select("id")
      .single();

    if (planError) {
      throw new Error(`Failed to save plan: ${planError.message}`);
    }

    // Seed user_gamification with first_step badge
    await supabaseServer.from("user_gamification").upsert({
      user_id: userData.id,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      badges: ["first_step"],
      level: "rookie",
    }, { onConflict: "user_id" });

    // Step 7: Return plan with persisted ID
    return NextResponse.json({
      plan: habit_plan,
      planId: planData.id,
      userId: userData.id,
      category,
      principles_used: habit_plan.psychology_principles_used,
      message: "Plan generated and saved successfully",
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
