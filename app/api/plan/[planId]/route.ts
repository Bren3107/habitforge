import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;

  const { data, error } = await supabaseServer
    .from("habit_plans")
    .select("generated_plan, category, psychology_principles")
    .eq("id", planId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json({
    plan: data.generated_plan,
    category: data.category,
    principles_used: data.psychology_principles,
  });
}
