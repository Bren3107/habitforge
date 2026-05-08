import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;

    if (!planId) {
      return NextResponse.json({ error: "planId is required" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("habit_plans")
      .select("generated_plan, category, psychology_principles, created_at")
      .eq("id", planId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: data.generated_plan,
      planCreatedAt: data.created_at,
      category: data.category,
      principles_used: data.psychology_principles ?? [],
    });
  } catch (error) {
    console.error("[GET /api/plan/[planId]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
