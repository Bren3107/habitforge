import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { generatePlan } from "@/lib/ai/llm";
import { getPrinciplesByCategory } from "@/lib/ai/knowledge-graph";
import type { SuccessCase } from "@/lib/ai/semantic-search";
import type { UserContext } from "@/lib/ai/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, planId, direction } = body;

    if (!userId || !planId || !direction) {
      return NextResponse.json(
        { error: "userId, planId, and direction are required" },
        { status: 400 }
      );
    }

    if (!["simplify", "level_up"].includes(direction)) {
      return NextResponse.json(
        { error: "direction must be 'simplify' or 'level_up'" },
        { status: 400 }
      );
    }

    // Fetch original plan from Supabase
    const { data: planRow, error: planError } = await supabaseServer
      .from("habit_plans")
      .select("habit_goal, motivation, constraints, lifestyle_context, conversation_history, category")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (planError || !planRow) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Reconstruct user context with adapted constraints
    const baseConstraints = (planRow.constraints as Record<string, unknown>) ?? {};
    const adaptedConstraints: Record<string, unknown> =
      direction === "simplify"
        ? { ...baseConstraints, low_time: true, difficulty: "easy", max_daily_minutes: 10 }
        : { ...baseConstraints, low_time: false, difficulty: "hard", challenge_level: "increased" };

    const userContext: UserContext = {
      goal: planRow.habit_goal,
      motivation: planRow.motivation ?? "",
      constraints: adaptedConstraints,
      lifestyle_summary:
        planRow.lifestyle_context +
        (direction === "simplify"
          ? " (User is struggling — simplify the plan, fewer actions, shorter duration)"
          : " (User is excelling — increase the challenge, add more actions or duration)"),
      conversation_history: planRow.conversation_history ?? [],
    };

    const category = planRow.category as "fitness" | "productivity" | "learning";
    const applicable_principles = await getPrinciplesByCategory(category);
    const similar_cases: SuccessCase[] = [];

    const newPlan = await generatePlan(userContext, applicable_principles, similar_cases, category);

    // Save the adapted plan with parent_plan_id linking back to original
    const { data: newPlanData, error: insertError } = await supabaseServer
      .from("habit_plans")
      .insert({
        user_id: userId,
        category,
        habit_goal: planRow.habit_goal,
        motivation: planRow.motivation,
        constraints: adaptedConstraints,
        lifestyle_context: userContext.lifestyle_summary,
        conversation_history: planRow.conversation_history,
        generated_plan: newPlan,
        psychology_principles: newPlan.psychology_principles_used,
        parent_plan_id: planId,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Failed to save adapted plan: ${insertError.message}`);
    }

    // Update the user's session to point to new plan
    await supabaseServer.from("user_gamification").upsert({
      user_id: userId,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      badges: ["first_step"],
      level: "rookie",
    }, { onConflict: "user_id" });

    return NextResponse.json({
      plan: newPlan,
      planId: newPlanData.id,
      direction,
      message: direction === "simplify"
        ? "Plan simplified — a fresh start with a more achievable approach"
        : "Plan levelled up — ready for a bigger challenge",
    });
  } catch (error) {
    console.error("[POST /api/plan/adapt] Error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    if (msg.includes("API request failed")) {
      return NextResponse.json({ error: "Claude API error. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ error: `Failed to adapt plan: ${msg}` }, { status: 500 });
  }
}
