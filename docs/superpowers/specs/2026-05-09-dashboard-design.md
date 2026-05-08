# Dashboard Design Spec
**Date:** 2026-05-09
**Branch:** feat/dashboard
**Phase:** 4 — Gamification Dashboard

---

## Context

Phase 1–3 are complete: onboarding wizard, AI pipeline (Haiku + Sonnet), and results page. The dashboard page (`app/dashboard/page.tsx`) is a blank div. All API stubs and component folders are empty. The Supabase schema already has `habit_tracking` and `user_gamification` tables live.

No auth system exists — users are anonymous (UUID stored in localStorage). Auth is explicitly deferred to post-MVP.

---

## Layout

**Option A — Check-in Hero** (selected). Single column, mobile-first:

```
┌─────────────────────────────────┐
│  Header: plan title + category  │
├─────────────────────────────────┤
│  DailyCheckin (full width)      │
├─────────────────────────────────┤
│  XPBar (full width)             │
├──────────────┬──────────────────┤
│ StreakCounter│ BadgeGrid        │
├─────────────────────────────────┤
│  ProgressChart (full width)     │
├─────────────────────────────────┤
│  CTA: View your full plan →     │
└─────────────────────────────────┘
```

---

## Data Flow & User Identification

No auth — identification via localStorage.

1. **Plan generation** (`POST /api/plan/generate`) returns both `planId` and `userId`. The route already has `userData.id` — it just needs to be included in the response.
2. **Results page** stores `{ planId, userId }` in localStorage under key `habitforge_session` after plan generation succeeds.
3. **Dashboard page** reads `habitforge_session` on mount. If missing → redirect to `/onboard`. Otherwise fetches gamification state via `GET /api/gamification/[userId]`.
4. **Check-in** posts `{ planId, userId, date, notes? }` to `POST /api/tracking/checkin`. Response includes updated stats — no refetch needed.
5. **Future auth migration**: replace localStorage session with JWT; anonymous `users` table already structured to support real accounts.

---

## Gamification Logic — `lib/gamification/logic.ts`

Pure functions, no React, no I/O. Fully unit-testable.

### XP Rules
| Event | XP |
|---|---|
| First daily check-in | +10 |
| Streak day bonus (days 2+) | +5 extra |
| 7-day milestone | +20 bonus |
| 30-day milestone | +50 bonus |

### Levels
| Level | XP Range |
|---|---|
| Rookie | 0–99 |
| Explorer | 100–299 |
| Achiever | 300–699 |
| Master | 700–1499 |
| Legend | 1500+ |

### Badges (7 total)
| Badge ID | Name | Trigger |
|---|---|---|
| `first_step` | First Step | Complete onboarding (plan generated) |
| `day_1` | Day 1 | First daily check-in |
| `week_warrior` | Week Warrior | 7-day streak |
| `habit_scientist` | Habit Scientist | Run synthetic evaluation |
| `consistency_champion` | Consistency Champion | 30-day streak |
| `triple_threat` | Triple Threat | Plans in all 3 categories |
| `habit_master` | Habit Master | 5 total plans generated |

**Exported functions:**
- `calculateXP(currentStreak: number): number` — returns XP earned for this check-in
- `calculateLevel(totalXP: number): string` — returns level name
- `checkBadgeUnlocks(currentBadges: string[], stats: BadgeStats): string[]` — returns array of newly earned badge IDs
- `getLevelProgress(totalXP: number): { level: string, current: number, next: number, threshold: number }` — for XP bar rendering

---

## API Routes

### `POST /api/tracking/checkin`
**Request:** `{ planId: string, userId: string, date: string (ISO), notes?: string }`

**Logic:**
1. Check for existing record (`UNIQUE user_id + plan_id + date`) — return 409 if duplicate
2. Fetch current `user_gamification` row (or create if first check-in)
3. Call `calculateXP(currentStreak + 1)` to get XP earned
4. Increment streak; reset to 1 if last check-in was not yesterday
5. Call `checkBadgeUnlocks` with updated stats
6. Insert into `habit_tracking`, upsert `user_gamification`

Note: `first_step` badge is awarded in `POST /api/plan/generate` when the plan is first created, not here. Checkin only checks for `day_1`, `week_warrior`, and `consistency_champion`.

**Response:** `{ xp_earned, total_xp, current_streak, longest_streak, new_badges, level }`

---

### `GET /api/gamification/[userId]`
**Logic:**
1. Fetch `user_gamification` row for userId
2. Fetch last 28 `habit_tracking` rows ordered by date DESC
3. Return combined payload

**Response:**
```ts
{
  total_xp: number,
  current_streak: number,
  longest_streak: number,
  badges: string[],
  level: string,
  level_progress: { current: number, next: number, threshold: number },
  history: Array<{ date: string, completed: boolean, xp_earned: number }>
}
```

---

### `POST /api/plan/generate` (existing route — minor change)
Add `userId: userData.id` to the existing JSON response so the results page can store it in localStorage. Also award the `first_step` badge here by creating the initial `user_gamification` row with `badges: ['first_step']`.

---

## Components

All in `components/dashboard/`, all `"use client"`. Forge dark theme throughout.

### `DailyCheckin.tsx`
**Props:** `{ plan: HabitPlan, planCreatedAt: string, todayCheckedIn: boolean, onCheckin: (notes?: string) => Promise<void> }`

- Computes `dayNumber = Math.min(daysSince(planCreatedAt) + 1, 28)`
- Renders `daily_actions[dayNumber - 1]` — cue, actions list, reward
- "Mark Today Complete" button (amber, full width) with optional notes input
- Confirmed state: amber checkmark, "+X XP" flash, button disabled
- If `todayCheckedIn` on mount: renders confirmed state immediately, no button

### `StreakCounter.tsx`
**Props:** `{ currentStreak: number, longestStreak: number }`

- Large ember flame icon (🔥 or SVG), current streak in large amber type
- "day streak" label, muted "longest: N days" below

### `XPBar.tsx`
**Props:** `{ totalXP: number, level: string, levelProgress: LevelProgress }`

- Level name left, next level name right
- Amber-filled progress bar (width = current/threshold %)
- `X / Y XP` label centered below bar

### `BadgeGrid.tsx`
**Props:** `{ earnedBadges: string[] }`

- All 7 badges rendered in a flex-wrap grid
- Earned: amber border, full opacity, badge name + icon
- Locked: muted border, 40% opacity, lock icon overlay, name in secondary color

### `ProgressChart.tsx`
**Props:** `{ history: Array<{ date: string, completed: boolean }> }`

- Recharts `BarChart`, 28 bars (pad missing days with `completed: false`)
- Amber fill for completed, `var(--error)` tint for missed, dashed empty future days
- "28-day overview" heading, no X-axis labels

---

## Dashboard Page — `app/dashboard/page.tsx`

```
"use client"

Mount:
  1. Read habitforge_session from localStorage
  2. If missing → redirect to /onboard
  3. Fetch GET /api/gamification/[userId]
  4. Fetch GET /api/plan/[planId] (already exists) to get plan + createdAt

Layout A (single column, max-w-2xl mx-auto):
  - Header: plan title (Fraunces font) + category badge
  - <DailyCheckin />
  - <XPBar />
  - 2-col grid: <StreakCounter /> + <BadgeGrid />
  - <ProgressChart />
  - CTA link: "View your full plan →" → /results?plan=<planId>

Empty state (no session):
  - Full-screen centred message + "Start your habit journey →" button to /onboard

Loading state:
  - Spinner matching results page style ("Loading your dashboard...")
```

---

## Empty / Edge States

| State | Behaviour |
|---|---|
| No localStorage session | Redirect to `/onboard` |
| userId exists but no gamification row | API creates default row (0 XP, 0 streak) |
| Already checked in today | DailyCheckin renders confirmed state, button hidden |
| Plan day > 28 | Cap at day 28 actions |
| Supabase error on check-in | Show inline error, button re-enables |

---

## Files Changed / Created

| File | Action |
|---|---|
| `lib/gamification/logic.ts` | Create |
| `app/api/tracking/checkin/route.ts` | Create (was `.gitkeep`) |
| `app/api/gamification/[userId]/route.ts` | Create (was `.gitkeep`) |
| `app/api/plan/generate/route.ts` | Modify — add `userId` to response |
| `app/api/plan/[planId]/route.ts` | Create — GET single plan by ID (needed by dashboard) |
| `components/dashboard/DailyCheckin.tsx` | Create |
| `components/dashboard/StreakCounter.tsx` | Create |
| `components/dashboard/XPBar.tsx` | Create |
| `components/dashboard/BadgeGrid.tsx` | Create |
| `components/dashboard/ProgressChart.tsx` | Create |
| `app/dashboard/page.tsx` | Rewrite (currently blank) |
| `app/results/page.tsx` | Modify — store `habitforge_session` in localStorage after plan generation |
| `lib/api.ts` | Modify — update `CheckInRequest` to include `date: string`, update `CheckInResponse` to match new response shape, extend `GamificationResponse` with `history` and `level_progress`, add `userId` to `GeneratePlanResponse` |
