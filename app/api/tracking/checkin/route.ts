import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { calculateXP, calculateLevel, checkBadgeUnlocks } from "@/lib/gamification/logic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, planId, date, notes } = body;

    if (!userId || !planId || !date) {
      return NextResponse.json(
        { error: "userId, planId, and date are required" },
        { status: 400 }
      );
    }

    // Check for duplicate check-in
    const { data: existing } = await supabaseServer
      .from("habit_tracking")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .eq("date", date)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 409 }
      );
    }

    // Get current gamification state
    const { data: gamification, error: gamError } = await supabaseServer
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (gamError || !gamification) {
      return NextResponse.json(
        { error: "User gamification record not found" },
        { status: 404 }
      );
    }

    // Calculate streak: check if yesterday was checked in
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: yesterdayEntry } = await supabaseServer
      .from("habit_tracking")
      .select("id")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .eq("date", yesterdayStr)
      .eq("completed", true)
      .single();

    const newStreak = yesterdayEntry ? gamification.current_streak + 1 : 1;
    const xpEarned = calculateXP(newStreak);
    const newTotalXP = gamification.total_xp + xpEarned;
    const newLongest = Math.max(gamification.longest_streak, newStreak);

    // Get total check-in count
    const { count: totalCheckins } = await supabaseServer
      .from("habit_tracking")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true);

    const currentBadges: string[] = gamification.badges ?? [];
    const newBadges = checkBadgeUnlocks(currentBadges, {
      current_streak: newStreak,
      total_checkins: (totalCheckins ?? 0) + 1,
    });
    const allBadges = [...currentBadges, ...newBadges];
    const newLevel = calculateLevel(newTotalXP);

    // Insert tracking record
    await supabaseServer.from("habit_tracking").insert({
      user_id: userId,
      plan_id: planId,
      date,
      completed: true,
      notes: notes ?? null,
      xp_earned: xpEarned,
    });

    // Upsert gamification state
    await supabaseServer.from("user_gamification").upsert({
      user_id: userId,
      total_xp: newTotalXP,
      current_streak: newStreak,
      longest_streak: newLongest,
      badges: allBadges,
      level: newLevel,
    }, { onConflict: "user_id" });

    return NextResponse.json({
      xp_earned: xpEarned,
      total_xp: newTotalXP,
      current_streak: newStreak,
      longest_streak: newLongest,
      new_badges: newBadges,
      level: newLevel,
    });
  } catch (error) {
    console.error("[POST /api/tracking/checkin] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
