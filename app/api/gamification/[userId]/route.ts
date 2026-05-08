import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getLevelProgress } from "@/lib/gamification/logic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch gamification state
    const { data: gamification, error: gamError } = await supabaseServer
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (gamError || !gamification) {
      // Return sensible defaults if no row yet
      const defaults = {
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        badges: [] as string[],
        level: "rookie",
        level_progress: getLevelProgress(0),
        history: [],
      };
      return NextResponse.json(defaults);
    }

    // Fetch last 28 tracking entries
    const { data: history } = await supabaseServer
      .from("habit_tracking")
      .select("date, completed, xp_earned")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(28);

    return NextResponse.json({
      total_xp: gamification.total_xp,
      current_streak: gamification.current_streak,
      longest_streak: gamification.longest_streak,
      badges: gamification.badges ?? [],
      level: gamification.level,
      level_progress: getLevelProgress(gamification.total_xp),
      history: (history ?? []).reverse(),
    });
  } catch (error) {
    console.error("[GET /api/gamification/[userId]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
