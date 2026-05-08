# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 4 — the gamification dashboard: daily check-in, XP/streak tracking, badge unlocks, and a 28-day progress chart.

**Architecture:** localStorage-first anonymous session (`habitforge_session = { planId, userId }`). Pure gamification logic in `lib/gamification/logic.ts`. Three new API routes (plan GET, checkin POST, gamification GET). Five dashboard components assembled in `app/dashboard/page.tsx`. Layout A: check-in hero at top, XP bar, streak + badges side by side, progress chart at bottom.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase (service role key), Recharts (already installed), Tailwind CSS 4 with forge CSS variables, Jest + ts-jest for unit tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/gamification/logic.ts` | Create | Pure XP/level/badge functions |
| `lib/gamification/__tests__/logic.test.ts` | Create | Unit tests for logic.ts |
| `app/api/plan/generate/route.ts` | Modify | Add `userId` to response + seed user_gamification |
| `app/api/plan/[planId]/route.ts` | Create | GET single plan + createdAt by planId |
| `app/api/tracking/checkin/route.ts` | Create | POST daily check-in, update XP/streak/badges |
| `app/api/gamification/[userId]/route.ts` | Create | GET gamification state + 28-day history |
| `lib/api.ts` | Modify | Update types for all new/changed responses |
| `components/dashboard/DailyCheckin.tsx` | Create | Check-in card with plan context |
| `components/dashboard/StreakCounter.tsx` | Create | Flame + streak number display |
| `components/dashboard/XPBar.tsx` | Create | Level progress bar |
| `components/dashboard/BadgeGrid.tsx` | Create | 7 badges, earned vs locked |
| `components/dashboard/ProgressChart.tsx` | Create | 28-bar Recharts chart |
| `app/dashboard/page.tsx` | Rewrite | Dashboard page, Layout A |
| `app/results/page.tsx` | Modify | Store habitforge_session in localStorage |
| `package.json` | Modify | Add `"test": "jest"` script |

---

## Task 1: Gamification Logic Library

**Files:**
- Create: `lib/gamification/logic.ts`
- Create: `lib/gamification/__tests__/logic.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add test script to package.json**

Open `package.json`. In the `"scripts"` object, add:
```json
"test": "jest"
```

- [ ] **Step 2: Write failing tests**

Create `lib/gamification/__tests__/logic.test.ts`:

```typescript
import {
  calculateXP,
  calculateLevel,
  getLevelProgress,
  checkBadgeUnlocks,
} from "../logic";

describe("calculateXP", () => {
  it("returns 10 XP for first check-in (streak = 1)", () => {
    expect(calculateXP(1)).toBe(10);
  });

  it("returns 15 XP on streak day 2", () => {
    expect(calculateXP(2)).toBe(15);
  });

  it("returns 35 XP on streak day 7 (10 + 5 + 20 bonus)", () => {
    expect(calculateXP(7)).toBe(35);
  });

  it("returns 65 XP on streak day 30 (10 + 5 + 50 bonus)", () => {
    expect(calculateXP(30)).toBe(65);
  });
});

describe("calculateLevel", () => {
  it("returns rookie for 0 XP", () => {
    expect(calculateLevel(0)).toBe("rookie");
  });

  it("returns explorer at 100 XP", () => {
    expect(calculateLevel(100)).toBe("explorer");
  });

  it("returns achiever at 300 XP", () => {
    expect(calculateLevel(300)).toBe("achiever");
  });

  it("returns master at 700 XP", () => {
    expect(calculateLevel(700)).toBe("master");
  });

  it("returns legend at 1500 XP", () => {
    expect(calculateLevel(1500)).toBe("legend");
  });
});

describe("getLevelProgress", () => {
  it("returns correct progress within explorer tier", () => {
    const result = getLevelProgress(150);
    expect(result.level).toBe("explorer");
    expect(result.current).toBe(50); // 150 - 100
    expect(result.threshold).toBe(200); // 300 - 100
    expect(result.nextLevel).toBe("achiever");
  });

  it("handles legend tier (max level)", () => {
    const result = getLevelProgress(2000);
    expect(result.level).toBe("legend");
  });
});

describe("checkBadgeUnlocks", () => {
  it("awards day_1 on first check-in", () => {
    const newBadges = checkBadgeUnlocks(["first_step"], {
      current_streak: 1,
      total_checkins: 1,
    });
    expect(newBadges).toContain("day_1");
  });

  it("awards week_warrior at 7-day streak", () => {
    const newBadges = checkBadgeUnlocks(["first_step", "day_1"], {
      current_streak: 7,
      total_checkins: 7,
    });
    expect(newBadges).toContain("week_warrior");
  });

  it("does not re-award already earned badges", () => {
    const newBadges = checkBadgeUnlocks(
      ["first_step", "day_1", "week_warrior"],
      { current_streak: 7, total_checkins: 7 }
    );
    expect(newBadges).toHaveLength(0);
  });

  it("awards consistency_champion at 30-day streak", () => {
    const newBadges = checkBadgeUnlocks(
      ["first_step", "day_1", "week_warrior"],
      { current_streak: 30, total_checkins: 30 }
    );
    expect(newBadges).toContain("consistency_champion");
  });
});
```

- [ ] **Step 3: Run tests — verify they fail**

```bash
npx jest lib/gamification/__tests__/logic.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '../logic'"

- [ ] **Step 4: Implement `lib/gamification/logic.ts`**

```typescript
export interface LevelProgress {
  level: string;
  nextLevel: string;
  current: number;
  threshold: number;
}

export interface BadgeStats {
  current_streak: number;
  total_checkins: number;
}

const LEVELS = [
  { name: "rookie", min: 0 },
  { name: "explorer", min: 100 },
  { name: "achiever", min: 300 },
  { name: "master", min: 700 },
  { name: "legend", min: 1500 },
];

export function calculateXP(newStreak: number): number {
  let xp = 10;
  if (newStreak >= 2) xp += 5;
  if (newStreak === 7) xp += 20;
  if (newStreak === 30) xp += 50;
  return xp;
}

export function calculateLevel(totalXP: number): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].min) return LEVELS[i].name;
  }
  return "rookie";
}

export function getLevelProgress(totalXP: number): LevelProgress {
  let levelIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].min) {
      levelIdx = i;
      break;
    }
  }
  const current = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1];
  if (!next) {
    return { level: "legend", nextLevel: "legend", current: totalXP - current.min, threshold: 500 };
  }
  return {
    level: current.name,
    nextLevel: next.name,
    current: totalXP - current.min,
    threshold: next.min - current.min,
  };
}

export function checkBadgeUnlocks(currentBadges: string[], stats: BadgeStats): string[] {
  const newBadges: string[] = [];
  if (!currentBadges.includes("day_1") && stats.total_checkins >= 1) {
    newBadges.push("day_1");
  }
  if (!currentBadges.includes("week_warrior") && stats.current_streak >= 7) {
    newBadges.push("week_warrior");
  }
  if (!currentBadges.includes("consistency_champion") && stats.current_streak >= 30) {
    newBadges.push("consistency_champion");
  }
  return newBadges;
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npx jest lib/gamification/__tests__/logic.test.ts --no-coverage
```

Expected: PASS — 11 tests passing

- [ ] **Step 6: Commit**

```bash
git add lib/gamification/logic.ts lib/gamification/__tests__/logic.test.ts package.json
git commit -m "feat: add gamification logic (XP, levels, badges)"
```

---

## Task 2: Update `lib/api.ts` Types

**Files:**
- Modify: `lib/api.ts`

- [ ] **Step 1: Update `GeneratePlanResponse` to include `userId`**

In `lib/api.ts`, find the `GeneratePlanResponse` interface and add `userId`:

```typescript
export interface GeneratePlanResponse {
  plan: HabitPlan;
  planId: string;
  userId: string;      // ADD THIS
  category: string;
  principles_used: string[];
  message: string;
}
```

- [ ] **Step 2: Update `GetPlanResponse` to include `planCreatedAt`**

```typescript
export interface GetPlanResponse {
  plan: HabitPlan;
  planCreatedAt: string;   // ADD THIS (ISO string)
  category: string;
  principles_used: string[];
}
```

- [ ] **Step 3: Update `CheckInRequest` and `CheckInResponse`**

Replace the existing interfaces:

```typescript
export interface CheckInRequest {
  userId: string;
  planId: string;
  date: string;          // ISO date string e.g. "2026-05-09"
  completed: boolean;
  notes?: string;
}

export interface CheckInResponse {
  xp_earned: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  new_badges: string[];
  level: string;
}
```

- [ ] **Step 4: Update `GamificationResponse`**

Replace the existing interface:

```typescript
export interface LevelProgressData {
  level: string;
  nextLevel: string;
  current: number;
  threshold: number;
}

export interface HistoryEntry {
  date: string;
  completed: boolean;
  xp_earned: number;
}

export interface GamificationResponse {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  badges: string[];
  level: string;
  level_progress: LevelProgressData;
  history: HistoryEntry[];
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/api.ts
git commit -m "feat: update api types for dashboard (userId, history, level_progress)"
```

---

## Task 3: Plan Generate Route — Add `userId` + Seed Gamification

**Files:**
- Modify: `app/api/plan/generate/route.ts`

- [ ] **Step 1: Add `userId` to response and seed `user_gamification`**

Open `app/api/plan/generate/route.ts`. After the plan is saved to Supabase (after `planData` is confirmed), add the gamification seed and update the response.

Find this block (around line 96–125):
```typescript
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
        ...
      })
      .select("id")
      .single();

    if (planError) {
      throw new Error(`Failed to save plan: ${planError.message}`);
    }

    // Step 7: Return plan with persisted ID
    return NextResponse.json({
      plan: habit_plan,
      planId: planData.id,
      category,
      principles_used: habit_plan.psychology_principles_used,
      message: "Plan generated and saved successfully",
    });
```

Replace the final `return NextResponse.json(...)` block with:

```typescript
    // Seed user_gamification with first_step badge
    await supabaseServer.from("user_gamification").upsert({
      user_id: userData.id,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      badges: ["first_step"],
      level: "rookie",
    }, { onConflict: "user_id" });

    // Step 7: Return plan with persisted ID and userId
    return NextResponse.json({
      plan: habit_plan,
      planId: planData.id,
      userId: userData.id,
      category,
      principles_used: habit_plan.psychology_principles_used,
      message: "Plan generated and saved successfully",
    });
```

- [ ] **Step 2: Commit**

```bash
git add app/api/plan/generate/route.ts
git commit -m "feat: return userId from plan/generate + seed user_gamification"
```

---

## Task 4: Plan GET Route

**Files:**
- Create: `app/api/plan/[planId]/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/plan/[planId]/route.ts"
git commit -m "feat: add GET /api/plan/[planId] route"
```

---

## Task 5: Check-in API Route

**Files:**
- Create: `app/api/tracking/checkin/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { calculateXP, calculateLevel, checkBadgeUnlocks, getLevelProgress } from "@/lib/gamification/logic";

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

    // Get total check-in count (for day_1 badge)
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
```

- [ ] **Step 2: Commit**

```bash
git add app/api/tracking/checkin/route.ts
git commit -m "feat: add POST /api/tracking/checkin route"
```

---

## Task 6: Gamification GET Route

**Files:**
- Create: `app/api/gamification/[userId]/route.ts`

- [ ] **Step 1: Create the route**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/gamification/[userId]/route.ts"
git commit -m "feat: add GET /api/gamification/[userId] route"
```

---

## Task 7: Results Page — Store Session in localStorage

**Files:**
- Modify: `app/results/page.tsx`

- [ ] **Step 1: Store `habitforge_session` after plan generation**

In `app/results/page.tsx`, find the block inside `loadPlan()` where the plan is first generated (the `else` branch):

```typescript
        } else {
          // First load: generate the plan, save it, then update the URL
          const response = await planAPI.generate({
            sessionId: sessionId!,
            category: "fitness",
          });
          setPlan(response.plan);
          // Replace URL so refreshing fetches the saved plan instead of regenerating
          router.replace(`/results?plan=${response.planId}`);
        }
```

Replace with:

```typescript
        } else {
          // First load: generate the plan, save it, then update the URL
          const response = await planAPI.generate({
            sessionId: sessionId!,
            category: "fitness",
          });
          setPlan(response.plan);
          // Persist session for dashboard (anonymous user identification)
          localStorage.setItem(
            "habitforge_session",
            JSON.stringify({ planId: response.planId, userId: response.userId })
          );
          // Replace URL so refreshing fetches the saved plan instead of regenerating
          router.replace(`/results?plan=${response.planId}`);
        }
```

- [ ] **Step 2: Commit**

```bash
git add app/results/page.tsx
git commit -m "feat: store habitforge_session in localStorage after plan generation"
```

---

## Task 8: `DailyCheckin` Component

**Files:**
- Create: `components/dashboard/DailyCheckin.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import type { HabitPlan } from "@/lib/ai/llm";

interface DailyCheckinProps {
  plan: HabitPlan;
  planCreatedAt: string;
  todayCheckedIn: boolean;
  xpEarned?: number;
  onCheckin: (notes?: string) => Promise<void>;
}

function getDayNumber(planCreatedAt: string): number {
  const created = new Date(planCreatedAt);
  const today = new Date();
  const diffMs = today.setHours(0, 0, 0, 0) - created.setHours(0, 0, 0, 0);
  const daysSince = Math.floor(diffMs / 86400000);
  return Math.min(Math.max(daysSince + 1, 1), 28);
}

export function DailyCheckin({
  plan,
  planCreatedAt,
  todayCheckedIn,
  xpEarned,
  onCheckin,
}: DailyCheckinProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(todayCheckedIn);
  const [earnedXP, setEarnedXP] = useState(xpEarned ?? 0);

  const dayNumber = getDayNumber(planCreatedAt);
  const todayAction = plan.daily_actions[dayNumber - 1] ?? plan.daily_actions[0];

  const handleCheckin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onCheckin(notes.trim() || undefined);
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[var(--bg-surface)] border-2 border-[var(--accent-ember)] border-opacity-40 rounded-xl">
      <div className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-4">
        Day {dayNumber} · Today&apos;s Habit
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex gap-3 items-start">
          <span className="text-xs font-bold text-[var(--accent-ember)] uppercase min-w-[44px] pt-0.5">Cue</span>
          <span className="text-sm text-[var(--text-primary)]">{todayAction.cue}</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-xs font-bold text-[var(--accent-ember)] uppercase min-w-[44px] pt-0.5">Do</span>
          <span className="text-sm text-[var(--text-primary)]">{todayAction.actions.join(" + ")}</span>
        </div>
        <div className="flex gap-3 items-start">
          <span className="text-xs font-bold text-[var(--accent-ember)] uppercase min-w-[44px] pt-0.5">Reward</span>
          <span className="text-sm text-[var(--text-primary)]">{todayAction.reward}</span>
        </div>
      </div>

      {confirmed ? (
        <div className="text-center py-4 bg-[var(--bg-raised)] rounded-lg border border-[var(--border)]">
          <p className="text-[var(--accent-ember)] font-bold text-lg">✓ Done for today</p>
          {earnedXP > 0 && (
            <p className="text-[var(--text-secondary)] text-sm mt-1">+{earnedXP} XP earned</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note..."
            className="w-full px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ember)]"
          />
          <button
            onClick={handleCheckin}
            disabled={isLoading}
            className="w-full py-3 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Saving..." : "✓ Mark Today Complete  +10 XP"}
          </button>
          {error && <p className="text-[var(--error)] text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/DailyCheckin.tsx
git commit -m "feat: add DailyCheckin dashboard component"
```

---

## Task 9: `StreakCounter` and `XPBar` Components

**Files:**
- Create: `components/dashboard/StreakCounter.tsx`
- Create: `components/dashboard/XPBar.tsx`

- [ ] **Step 1: Create `StreakCounter.tsx`**

```typescript
interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl text-center">
      <div className="text-4xl mb-2">🔥</div>
      <div className="text-5xl font-bold text-[var(--accent-ember)]" style={{ fontFamily: "Fraunces" }}>
        {currentStreak}
      </div>
      <div className="text-[var(--text-secondary)] text-sm mt-1">day streak</div>
      <div className="text-[var(--text-secondary)] text-xs mt-3">
        longest: {longestStreak} days
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `XPBar.tsx`**

```typescript
import type { LevelProgressData } from "@/lib/api";

interface XPBarProps {
  totalXP: number;
  levelProgress: LevelProgressData;
}

export function XPBar({ totalXP, levelProgress }: XPBarProps) {
  const fillPercent = Math.min(
    Math.round((levelProgress.current / levelProgress.threshold) * 100),
    100
  );

  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[var(--text-primary)] font-bold capitalize">{levelProgress.level}</span>
        {levelProgress.level !== "legend" && (
          <span className="text-[var(--text-secondary)] text-xs capitalize">{levelProgress.nextLevel} →</span>
        )}
      </div>
      <div className="bg-[var(--bg-raised)] rounded-full h-3 mb-2">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{
            width: `${fillPercent}%`,
            background: "linear-gradient(90deg, var(--accent-ember), var(--accent-fire))",
          }}
        />
      </div>
      <div className="text-center text-[var(--text-secondary)] text-xs">
        {totalXP} XP · {levelProgress.current} / {levelProgress.threshold} to next level
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/StreakCounter.tsx components/dashboard/XPBar.tsx
git commit -m "feat: add StreakCounter and XPBar dashboard components"
```

---

## Task 10: `BadgeGrid` Component

**Files:**
- Create: `components/dashboard/BadgeGrid.tsx`

- [ ] **Step 1: Create the component**

```typescript
const ALL_BADGES = [
  { id: "first_step", name: "First Step", icon: "⭐", description: "Plan generated" },
  { id: "day_1", name: "Day 1", icon: "🏁", description: "First check-in" },
  { id: "week_warrior", name: "Week Warrior", icon: "🗡️", description: "7-day streak" },
  { id: "habit_scientist", name: "Habit Scientist", icon: "🔬", description: "Run evaluation" },
  { id: "consistency_champion", name: "Champion", icon: "🏆", description: "30-day streak" },
  { id: "triple_threat", name: "Triple Threat", icon: "⚡", description: "3 categories" },
  { id: "habit_master", name: "Habit Master", icon: "🔱", description: "5 plans" },
];

interface BadgeGridProps {
  earnedBadges: string[];
}

export function BadgeGrid({ earnedBadges }: BadgeGridProps) {
  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-4">Badges</p>
      <div className="flex flex-wrap gap-2">
        {ALL_BADGES.map((badge) => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <div
              key={badge.id}
              title={badge.description}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-opacity ${
                earned
                  ? "border-[var(--accent-ember)] text-[var(--text-primary)] bg-[var(--accent-ember)] bg-opacity-10"
                  : "border-[var(--border)] text-[var(--text-secondary)] opacity-40"
              }`}
            >
              <span>{badge.icon}</span>
              <span>{badge.name}</span>
              {!earned && <span className="ml-0.5">🔒</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/BadgeGrid.tsx
git commit -m "feat: add BadgeGrid dashboard component"
```

---

## Task 11: `ProgressChart` Component

**Files:**
- Create: `components/dashboard/ProgressChart.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { HistoryEntry } from "@/lib/api";

interface ProgressChartProps {
  history: HistoryEntry[];
}

function buildChartData(history: HistoryEntry[]) {
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (27 - i));
    return d.toISOString().split("T")[0];
  });

  return days.map((date) => {
    const entry = history.find((h) => h.date === date);
    const isPast = new Date(date) < new Date(today.toISOString().split("T")[0]);
    return {
      date,
      xp: entry?.xp_earned ?? 0,
      completed: entry?.completed ?? false,
      isFuture: !entry && !isPast,
    };
  });
}

export function ProgressChart({ history }: ProgressChartProps) {
  const data = buildChartData(history);

  return (
    <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <p className="text-sm font-bold text-[var(--text-primary)] mb-4">28-day overview</p>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} barSize={8} barCategoryGap="20%">
          <Tooltip
            formatter={(value: number) => [`${value} XP`, "XP"]}
            labelFormatter={(label: string) => label}
            contentStyle={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: 11,
            }}
          />
          <Bar dataKey="xp" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isFuture
                    ? "var(--bg-raised)"
                    : entry.completed
                    ? "var(--accent-ember)"
                    : "var(--error)"
                }
                fillOpacity={entry.isFuture ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 text-xs text-[var(--text-secondary)]">
        <span><span style={{ color: "var(--accent-ember)" }}>■</span> Completed</span>
        <span><span style={{ color: "var(--error)" }}>■</span> Missed</span>
        <span className="opacity-40">■ Upcoming</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ProgressChart.tsx
git commit -m "feat: add ProgressChart dashboard component (Recharts)"
```

---

## Task 12: Dashboard Page

**Files:**
- Rewrite: `app/dashboard/page.tsx`

- [ ] **Step 1: Rewrite the dashboard page**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { planAPI, trackingAPI, gamificationAPI } from "@/lib/api";
import type { GamificationResponse, GetPlanResponse } from "@/lib/api";
import type { HabitPlan } from "@/lib/ai/llm";
import { getLevelProgress } from "@/lib/gamification/logic";
import { DailyCheckin } from "@/components/dashboard/DailyCheckin";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { XPBar } from "@/components/dashboard/XPBar";
import { BadgeGrid } from "@/components/dashboard/BadgeGrid";
import { ProgressChart } from "@/components/dashboard/ProgressChart";

interface Session {
  planId: string;
  userId: string;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("habitforge_session");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<HabitPlan | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string>("");
  const [planCategory, setPlanCategory] = useState<string>("fitness");
  const [gamification, setGamification] = useState<GamificationResponse | null>(null);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/onboard");
      return;
    }
    setSession(s);

    async function fetchData() {
      try {
        const [planRes, gamRes]: [GetPlanResponse, GamificationResponse] = await Promise.all([
          planAPI.get(s!.planId),
          gamificationAPI.getStats(s!.userId),
        ]);

        setPlan(planRes.plan);
        setPlanCreatedAt(planRes.planCreatedAt);
        setPlanCategory(planRes.category);
        setGamification(gamRes);

        const alreadyCheckedIn = gamRes.history.some(
          (h) => h.date === todayISO() && h.completed
        );
        setTodayCheckedIn(alreadyCheckedIn);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleCheckin = async (notes?: string) => {
    if (!session) return;
    const res = await trackingAPI.checkin({
      userId: session.userId,
      planId: session.planId,
      date: todayISO(),
      completed: true,
      notes,
    });
    setTodayCheckedIn(true);
    setGamification((prev) =>
      prev
        ? {
            ...prev,
            total_xp: res.total_xp,
            current_streak: res.current_streak,
            longest_streak: res.longest_streak,
            badges: [...prev.badges, ...res.new_badges],
            level: res.level,
            level_progress: getLevelProgress(res.total_xp),  // recompute client-side so XP bar updates immediately
          }
        : prev
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent-ember)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-[var(--text-primary)] font-bold text-xl mb-3">Something went wrong</p>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <a
            href="/onboard"
            className="inline-block px-6 py-2 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-bold hover:bg-[var(--accent-fire)] transition-colors"
          >
            Start Over
          </a>
        </div>
      </div>
    );
  }

  if (!plan || !gamification) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs text-[var(--accent-ember)] uppercase tracking-widest font-bold">
            {planCategory}
          </span>
          <h1
            className="text-4xl font-bold text-[var(--text-primary)] mt-1"
            style={{ fontFamily: "Fraunces" }}
          >
            {plan.plan_title}
          </h1>
        </div>

        {/* Check-in hero */}
        <DailyCheckin
          plan={plan}
          planCreatedAt={planCreatedAt}
          todayCheckedIn={todayCheckedIn}
          onCheckin={handleCheckin}
        />

        {/* XP bar */}
        <XPBar
          totalXP={gamification.total_xp}
          levelProgress={gamification.level_progress}
        />

        {/* Streak + Badges */}
        <div className="grid grid-cols-2 gap-6">
          <StreakCounter
            currentStreak={gamification.current_streak}
            longestStreak={gamification.longest_streak}
          />
          <BadgeGrid earnedBadges={gamification.badges} />
        </div>

        {/* Progress chart */}
        <ProgressChart history={gamification.history} />

        {/* CTA */}
        <div className="text-center pt-4">
          <a
            href={`/results?plan=${session?.planId}`}
            className="text-[var(--text-secondary)] text-sm hover:text-[var(--accent-ember)] transition-colors"
          >
            View your full plan →
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: build dashboard page (Phase 4 complete)"
```

---

## Task 13: Smoke Test

- [ ] **Step 1: Run unit tests**

```bash
npx jest lib/gamification/__tests__/logic.test.ts --no-coverage
```

Expected: 11 tests passing

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 3: Run the full user flow**

1. Go to `http://localhost:3000/onboard`
2. Complete onboarding (goal → motivation → constraints → 4 chat questions)
3. Wait for plan generation on `/results` — confirm plan displays
4. Click "Go to Dashboard →"
5. Verify dashboard loads with plan title, today's habit (cue/actions/reward), XP bar at 0, streak at 0, `first_step` badge earned
6. Click "Mark Today Complete" — verify XP updates, `day_1` badge appears, streak becomes 1
7. Refresh dashboard — confirm check-in state persists (button replaced by confirmed state)

- [ ] **Step 4: Navigate directly to `/dashboard` with no localStorage**

Clear localStorage in DevTools, navigate to `/http://localhost:3000/dashboard`.
Expected: redirect to `/onboard`.

- [ ] **Step 5: Final commit**

```bash
git push origin feat/dashboard
```
