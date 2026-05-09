@AGENTS.md

# HabitForge — Project Overview

**HabitForge** is an AI-powered habit formation app built with Next.js, Claude (Anthropic), and Supabase. AT3 university project, due 2026-05-16.

---

## Tech Stack

- **Framework:** Next.js 16, App Router, React 19, TypeScript
- **Styling:** Tailwind CSS 4 with forge design system (CSS variables in `app/globals.css`)
- **AI:** Anthropic Claude — Haiku for conversation, Sonnet for plan generation
- **Database:** Supabase (Postgres + pgvector) via service role key on server, anon key on client
- **Charts:** Recharts (v3)
- **Tests:** Jest + ts-jest (`npm test`)

---

## Design System

Forge dark theme. Key CSS variables:
- `--bg-base`, `--bg-surface`, `--bg-raised` — background layers
- `--accent-ember` (amber), `--accent-fire` (orange) — primary brand colours
- `--text-primary`, `--text-secondary` — text
- `--border`, `--error` — utility
- Font: **Fraunces** for headings, system sans for body

---

## What's Been Built

### Phase 1 — Scaffold + Knowledge Graph
- Next.js 14 scaffold with forge design system (`app/globals.css`, `tailwind.config.ts`)
- Knowledge graph JSON for fitness, productivity, learning (`lib/knowledge/`)
- 75 success cases JSON + precomputed embeddings script (`lib/success-cases/`)

### Phase 2A — Core AI Pipeline
- Embeddings service (`lib/ai/embeddings.ts`) — @xenova/transformers, 384-dim vectors
- Semantic search (`lib/ai/semantic-search.ts`) — cosine similarity against success cases
- Knowledge graph loader (`lib/ai/knowledge-graph.ts`)
- Confidence scoring (`lib/ai/confidence.ts`)

### Phase 2B–D — LLM Orchestration + API Routes
- LLM service (`lib/ai/llm.ts`) — `generateQuestion()` and `generatePlan()` using Claude
- Conversation API routes: `POST /api/conversation/start`, `POST /api/conversation/respond`
- Plan generation: `POST /api/plan/generate` — full Haiku → Sonnet pipeline
- Typed API client (`lib/api.ts`) and custom hooks (`hooks/useConversation.ts`)

### Phase 3 — Frontend + Supabase Persistence
- Landing page (`app/page.tsx`), onboarding wizard (`app/onboard/page.tsx`), results page (`app/results/page.tsx`)
- Supabase schema: `users`, `habit_plans`, `habit_tracking`, `user_gamification` tables
- Plans saved to Supabase on generation; results page fetches by `?plan=<planId>` on refresh

### Phase 3E — Chat UX Improvements
- Reduced onboarding from 7 questions to **4 compound questions** via prompt engineering
- Hard counter in `respond` route: forces completion after Q4
- Progress indicator (dots), suggestion chips, warm greeting prefix
- `ChatInterface.tsx` — removes fixed height, "Send →" button, "Crafting your next question..." loading text

### Phase 4 — Gamification Dashboard (`app/dashboard/page.tsx`)
- **Anonymous session:** `habitforge_session = { planId, userId }` in localStorage
- **Gamification logic** (`lib/gamification/logic.ts`): `calculateXP`, `calculateLevel`, `getLevelProgress`, `checkBadgeUnlocks` — pure functions, fully tested (15 unit tests)
- **XP rules:** base +10/check-in, +5 streak bonus (day 2+), +20 milestone (day 7), +50 milestone (day 30)
- **Levels:** rookie (0) → explorer (100) → achiever (300) → master (700) → legend (1500)
- **7 badges:** `first_step`, `day_1`, `week_warrior`, `habit_scientist`, `consistency_champion`, `triple_threat`, `habit_master`
- **API routes:** `GET /api/plan/[planId]`, `POST /api/tracking/checkin`, `GET /api/gamification/[userId]`
- **Dashboard components** (`components/dashboard/`): `DailyCheckin`, `XPBar`, `StreakCounter`, `BadgeGrid`, `ProgressChart`
- Dashboard layout (Layout A): check-in hero → XP bar → streak + badges → 28-day chart → CTA

---

## Key Conventions

- All server-side Supabase access uses `supabaseServer` from `@/lib/supabase/server` (service role key)
- API routes use async params: `{ params }: { params: Promise<{ id: string }> }` — always `await params`
- No auth system — users are anonymous UUIDs. Auth is deferred to post-MVP.
- Dashboard components are all `"use client"` with named exports
- `lib/api.ts` is the single source of truth for all request/response types

---

## Running the App

```bash
cd habitforge/.worktrees/build   # or the repo root if not using worktrees
npm run dev                      # starts at http://localhost:3000
npm test                         # runs jest unit tests
npx tsc --noEmit                 # type check (one pre-existing error in a Phase 2A test mock — ignore)
```

User flow: `/onboard` → chat (4 questions) → `/results` (plan generated + session saved) → `/dashboard`
