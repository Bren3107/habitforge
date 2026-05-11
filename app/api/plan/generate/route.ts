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

export const maxDuration = 60;
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generatePlan } from "@/lib/ai/llm";
import { getPrinciplesByCategory } from "@/lib/ai/knowledge-graph";
import type { SuccessCase } from "@/lib/ai/semantic-search";
import { getSession, deleteSession } from "@/app/api/conversation/session";
import { supabaseServer } from "@/lib/supabase/server";
import {
  calculateConfidence,
  distanceToSuccessScore,
  estimateMotivationSentiment,
  calculateConstraintFit,
  confidenceLevel,
} from "@/lib/ai/confidence";

export async function POST(req: NextRequest) {
  try {
    // Verify authenticated user
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Calculate confidence score from available signals
    const topCaseScore = similar_cases.length > 0 && similar_cases[0].similarity_distance !== undefined
      ? distanceToSuccessScore(similar_cases[0].similarity_distance)
      : 0.5;

    const lifestyleText = (user_context.lifestyle_summary + " " + JSON.stringify(user_context.constraints)).toLowerCase();
    const constraintTags: string[] = [];
    if (/15\s*min|no.time|very.busy|tight.schedule/.test(lifestyleText)) constraintTags.push("low_time");
    if (/30\s*min|limited.time|busy/.test(lifestyleText)) constraintTags.push("low_time");
    if (/tired|exhaust|low.energy|fatigue/.test(lifestyleText)) constraintTags.push("low_energy");
    if (/unmotivat|struggling|can.t|hard.time/.test(lifestyleText)) constraintTags.push("low_motivation");
    if (constraintTags.length === 0) constraintTags.push("general");

    const principleApplicableWhen = applicable_principles.flatMap(
      (p: { applicable_when: string[] }) => p.applicable_when
    );
    const constraintFit = calculateConstraintFit(constraintTags, principleApplicableWhen);
    const motivationSentiment = estimateMotivationSentiment(user_context.lifestyle_summary);
    const confidenceScore = calculateConfidence(constraintFit, topCaseScore, motivationSentiment);
    const confidenceLevelLabel = confidenceLevel(confidenceScore);

    // Step 5: Clean up session (plan is generated)
    await deleteSession(sessionId);

    // Step 6: Upsert authenticated user and save plan to Supabase
    const { error: userError } = await supabaseServer
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          display_name:
            user.user_metadata?.display_name ??
            user.user_metadata?.full_name ??
            null,
          session_token: null,
        },
        { onConflict: "id" }
      );

    if (userError) {
      throw new Error(`Failed to upsert user: ${userError.message}`);
    }

    const userId = user.id;

    const { data: planData, error: planError } = await supabaseServer
      .from("habit_plans")
      .insert({
        user_id: userId,
        category,
        habit_goal: user_context.goal,
        motivation: user_context.motivation,
        constraints: user_context.constraints || {},
        lifestyle_context: user_context.lifestyle_summary,
        conversation_history: user_context.conversation_history,
        generated_plan: habit_plan,
        psychology_principles: habit_plan.psychology_principles_used,
        confidence_score: confidenceScore,
      })
      .select("id")
      .single();

    if (planError) {
      throw new Error(`Failed to save plan: ${planError.message}`);
    }

    // Seed user_gamification only if no record exists yet — never overwrite existing progress
    const { data: existingGam } = await supabaseServer
      .from("user_gamification")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (!existingGam) {
      await supabaseServer.from("user_gamification").insert({
        user_id: userId,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        badges: [],
        level: "rookie",
      });
    }

    // Step 7: Return plan with persisted ID
    return NextResponse.json({
      plan: habit_plan,
      planId: planData.id,
      userId: userId,
      category,
      principles_used: habit_plan.psychology_principles_used,
      message: "Plan generated and saved successfully",
      confidenceScore,
      confidenceLevel: confidenceLevelLabel,
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
