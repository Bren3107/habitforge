import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { analyzePatterns } from "@/lib/ai/pattern-analysis";
import { generateCoachingMessage } from "@/lib/ai/coaching";
import type { HistoryEntry } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const planId = searchParams.get("planId");

    if (!userId || !planId) {
      return NextResponse.json({ error: "userId and planId are required" }, { status: 400 });
    }

    // Fetch plan details (goal + created_at)
    const { data: planRow, error: planError } = await supabaseServer
      .from("habit_plans")
      .select("habit_goal, created_at, generated_plan")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (planError || !planRow) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Calculate current week number
    const planCreated = new Date(planRow.created_at);
    const daysSinceStart = Math.floor(
      (Date.now() - planCreated.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekNumber = Math.floor(daysSinceStart / 7) + 1;

    // Check cache first
    const { data: cached } = await supabaseServer
      .from("coaching_messages")
      .select("message")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .eq("week_number", weekNumber)
      .single();

    if (cached) {
      return NextResponse.json({
        message: cached.message,
        weekNumber,
        cached: true,
      });
    }

    // Fetch tracking history
    const { data: history } = await supabaseServer
      .from("habit_tracking")
      .select("date, completed, xp_earned")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .order("date", { ascending: true })
      .limit(28);

    const entries: HistoryEntry[] = (history ?? []).map((h) => ({
      date: h.date,
      completed: h.completed,
      xp_earned: h.xp_earned,
    }));

    // Need at least 7 check-ins before generating coaching
    if (entries.length < 7) {
      return NextResponse.json({
        message: null,
        weekNumber,
        reason: "Not enough check-ins yet — coaching unlocks after 7 days",
      });
    }

    const analysis = analyzePatterns(entries);
    const message = await generateCoachingMessage(
      analysis,
      planRow.generated_plan,
      planRow.habit_goal,
      weekNumber
    );

    // Cache the message
    await supabaseServer.from("coaching_messages").upsert({
      user_id: userId,
      plan_id: planId,
      week_number: weekNumber,
      message,
    }, { onConflict: "user_id,plan_id,week_number" });

    return NextResponse.json({ message, weekNumber, cached: false });
  } catch (error) {
    console.error("[GET /api/coaching/weekly] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
