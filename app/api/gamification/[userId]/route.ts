import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getLevelProgress } from "@/lib/gamification/logic";

function calcStreakFromHistory(entries: { date: string; completed: boolean }[]): number {
  const completed = entries
    .filter((e) => e.completed)
    .map((e) => e.date)
    .sort()
    .reverse();

  if (completed.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  // Streak must include today or yesterday to be active
  if (completed[0] !== todayStr && completed[0] !== yesterdayStr) return 0;

  let streak = 0;
  let cursor = new Date(completed[0]);

  for (const date of completed) {
    const cursorStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (date === cursorStr) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const planId = req.nextUrl.searchParams.get("planId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { data: gamification, error: gamError } = await supabaseServer
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (gamError || !gamification) {
      return NextResponse.json({
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        badges: [] as string[],
        level: "rookie",
        level_progress: getLevelProgress(0),
        history: [],
      });
    }

    // Filter by planId if provided so old plan check-ins don't bleed through
    let historyQuery = supabaseServer
      .from("habit_tracking")
      .select("date, completed, xp_earned")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(28);

    if (planId) {
      historyQuery = historyQuery.eq("plan_id", planId);
    }

    const { data: history } = await historyQuery;
    const historyArr = (history ?? []).reverse();

    // Recalculate streak from actual history so a DB reset doesn't affect the display
    const liveStreak = calcStreakFromHistory(historyArr);
    const displayStreak = Math.max(gamification.current_streak, liveStreak);

    return NextResponse.json({
      total_xp: gamification.total_xp,
      current_streak: displayStreak,
      longest_streak: Math.max(gamification.longest_streak, liveStreak),
      badges: gamification.badges ?? [],
      level: gamification.level,
      level_progress: getLevelProgress(gamification.total_xp),
      history: historyArr,
    });
  } catch (error) {
    console.error("[GET /api/gamification/[userId]] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
