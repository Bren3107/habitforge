import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  try {
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

    const userId = user.id;

    // Delete all user data in order (FK constraints)
    await supabaseServer.from("habit_tracking").delete().eq("user_id", userId);
    await supabaseServer.from("user_gamification").delete().eq("user_id", userId);
    await supabaseServer.from("habit_plans").delete().eq("user_id", userId);
    await supabaseServer.from("users").delete().eq("id", userId);

    // Delete the auth user via admin API
    const { error } = await supabaseServer.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(`Failed to delete auth user: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/user/delete] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}
