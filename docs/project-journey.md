# HabitForge — Project Journey & Technical Documentation

> Reference document for AT3 report writing. Covers the full build history, AI paradigms, architecture, empirical evaluation, and critical reflection.

---

## 1. The Problem

Habit formation is one of the most researched areas in behavioural psychology, yet existing habit-tracking apps (Habitica, HabitBull, Streaks, Bereal) are almost entirely dumb — they track whether you did something, but they don't help you build the right system in the first place, and they never adapt when you're failing.

The core failure of existing tools:
- **Static plans** — you decide your own habit without expert guidance
- **No personalisation** — the same UI for a motivated university student and an exhausted single parent
- **No learning** — the app never observes your patterns or responds to them
- **Gamification without meaning** — XP and streaks reward consistency but offer no insight

**HabitForge** addresses this by applying multiple AI techniques to: (1) understand the user deeply through conversation, (2) generate a personalised plan grounded in behavioural psychology, (3) evaluate confidence in that plan, and (4) continuously observe and adapt based on real performance.

---

## 2. AI Paradigms Used

This is the core of the AT3 requirement — demonstrating multiple AI paradigms, not just software development.

### 2.1 Symbolic AI — Knowledge Graph

**Location:** `data/knowledge-graph/fitness.json`, `productivity.json`, `learning.json`
**Code:** `lib/ai/knowledge-graph.ts`

A structured knowledge base of 37+ psychology principles across three habit domains. Each principle is a symbolic object with:

- `id`, `name`, `description`, `mechanism` — what the principle is and why it works
- `source` — academic citation (e.g., Gollwitzer, 1999; Clear, 2018; Milkman et al., 2014)
- `applicable_when` — constraint tags that determine when this principle fits a user (e.g., `low_time`, `low_energy`, `low_motivation`)
- `not_applicable_when` — exclusion conditions
- `example` — concrete application of the principle
- `xp_bonus` — gamification weight

**Example principles:**

| Principle | Source | Applicable When |
|---|---|---|
| Habit Stacking | Clear (2018), Atomic Habits | needs_cue, low_motivation |
| Implementation Intention | Gollwitzer (1999) | low_consistency, needs_cue |
| Temptation Bundling | Milkman et al. (2014) | low_motivation, high_resistance |
| Two-Minute Rule | Clear (2018) | low_time, low_self_efficacy |
| Spaced Repetition | Ebbinghaus (1885) | learning, retention |
| Variable Reward | Skinner (1938) | low_motivation, needs_reward |

This is classical symbolic AI — a domain expert system encoding structured knowledge that gets applied algorithmically. The principles are filtered against the user's detected constraint profile before being passed to the LLM.

### 2.2 Semantic Search & Vector Embeddings

**Code:** `lib/ai/embeddings.ts`, `lib/ai/semantic-search.ts`
**Model:** `all-MiniLM-L6-v2` (384-dimensional sentence embeddings via `@xenova/transformers`)
**Storage:** Supabase with `pgvector` extension, IVFFlat index

75 success cases (25 per category) were pre-embedded and stored in Supabase. Each case describes a real habit scenario — the user profile, their constraints, what strategy worked, and why.

When a user finishes onboarding, their conversation summary is embedded into the same 384-dimensional space. The system then finds the **top 3 most similar success cases** using cosine similarity:

```
similarity = 1 - (cosine_distance / 2)
```

These cases are injected into the plan generation prompt, grounding Claude's output in real-world evidence rather than generic advice.

### 2.3 Probabilistic Confidence Scoring

**Code:** `lib/ai/confidence.ts`

After generating a plan, the system calculates a confidence score (0–1) from three independent signals:

```
confidence = (constraint_fit × 0.4) + (case_similarity × 0.4) + (motivation_sentiment × 0.2)
```

**Constraint Fit (40%):** Whether the selected psychology principles match the user's detected constraints. Constraints are extracted from the lifestyle summary using regex pattern matching (`low_time`, `low_energy`, `low_motivation`). Fit is calculated as the fraction of user constraints covered by principle applicability conditions.

**Case Similarity (40%):** How close the user's conversation embedding is to the top success cases in the vector store. Converted from pgvector cosine distance (0–2 range) to a 0–1 success score.

**Motivation Sentiment (20%):** Keyword-based sentiment analysis on the user's motivation text. Baseline 0.5, +0.1 per positive keyword ("excited", "motivated", "passionate"), -0.1 per negative keyword ("struggling", "can't", "exhausted").

The final score maps to a label: Very High (≥0.8), High (≥0.6), Medium (≥0.4), Low (≥0.2), Very Low.

**What the confidence score means to the user:**
The percentage displayed on the results page (e.g. "66% — High Confidence") tells the user how closely their profile matched existing success cases in the database. A higher score means the system found strong precedent for someone with similar goals, constraints, and lifestyle — so the generated plan is well-grounded in proven patterns. A lower score means the user's situation is more unique and the plan is more exploratory. This gives users a transparent signal of how personalised and evidence-backed their plan is, rather than presenting AI output as unconditionally authoritative.

### 2.4 Large Language Models (Generative AI)

**Code:** `lib/ai/llm.ts`
**Models:** Claude Haiku (conversation), Claude Sonnet (plan generation)

Two distinct LLM applications:

**Conversational Onboarding (Claude Haiku):**
The system conducts a 4-question intake conversation using compound questions — each question naturally weaves two related topics to gather more context efficiently. Topic pairs: schedule + time availability; existing routines + lifestyle; past attempts + obstacles; commitment depth + accountability preference. Claude returns structured JSON with the next question and 2-3 example answers as suggestion chips.

**Plan Synthesis (Claude Sonnet):**
Takes the full user context (goal, motivation, constraints, lifestyle summary, conversation history), the filtered psychology principles, and the top similar success cases, then synthesises a complete 4-week habit plan as structured JSON:

```json
{
  "plan_title": "...",
  "daily_actions": [{ "day": 1, "actions": [...], "cue": "...", "reward": "..." }],
  "psychology_principles_used": ["Habit Stacking", "Implementation Intention", ...],
  "week_progression": [{ "week": 1, "focus": "...", "expected_difficulty": "Easy" }],
  "explanation": "..."
}
```

The prompt enforces: at least 3 named principles, specific cues and rewards (not generic), week-on-week difficulty progression, and grounding in the provided success cases.

### 2.5 Reinforcement Learning-Inspired Gamification

**Code:** `lib/gamification/logic.ts`

The habit check-in system implements a variable reward schedule — a key mechanism from operant conditioning (Skinner, 1938) shown to maximise behaviour persistence:

- **Base reward:** +10 XP per check-in
- **Streak bonus:** +5 XP from day 2 onwards (continuous reinforcement)
- **Milestone rewards:** +20 XP at day 7, +50 XP at day 30 (variable ratio reinforcement)
- **Level progression:** Rookie → Explorer → Achiever → Master → Legend (thresholds: 0, 100, 300, 700, 1500 XP)
- **Badge unlocks:** 7 badges tied to behavioural milestones (`first_step`, `day_1`, `week_warrior`, `consistency_champion`, `habit_master`, etc.)

This mirrors reinforcement learning's reward signal design — the XP curve is deliberately non-linear to maintain motivation through difficulty spikes.

### 2.6 Adaptive AI (Pattern Recognition + Plan Evolution)

**Code:** `lib/ai/pattern-analysis.ts`, `lib/ai/coaching.ts`
**API:** `/api/coaching/weekly`, `/api/plan/adapt`

The most recent addition. After accumulating check-in history, the system:

1. **Analyses behavioural patterns** (pure computation): completion rate per week, best/worst day of week, improving/declining/flat trend by comparing last 7 days vs previous 7 days.

2. **Generates personalised coaching** (Claude Haiku): reads the pattern analysis and writes a 2-3 sentence coaching message — one insight from the data, one encouragement, one concrete suggestion. Cached per week in Supabase.

3. **Triggers plan adaptation**: if 7-day completion rate drops below 50%, the system offers to simplify the plan. If above 90%, it offers to level up. Clicking either re-runs the full AI pipeline (`generatePlan()`) with modified constraints and saves the new plan with a `parent_plan_id` linking back to the original for lineage tracking.

---

## 3. System Architecture

```
User
 │
 ├─ /onboard ──────────────── 4-step wizard (goal, motivation, constraints, chat)
 │                             └─ POST /api/conversation/start → /respond
 │                                  Claude Haiku generates compound questions
 │
 ├─ /results ──────────────── Plan display
 │                             └─ POST /api/plan/generate
 │                                  1. Load psychology principles (knowledge graph)
 │                                  2. Embed conversation summary (all-MiniLM-L6-v2)
 │                                  3. Find similar cases (pgvector cosine search)
 │                                  4. Generate plan (Claude Sonnet)
 │                                  5. Score confidence (3-signal formula)
 │                                  6. Save to Supabase
 │                                  └─ ConfidenceMeter + PrincipleBadges displayed
 │
 ├─ /dashboard ────────────── Gamification + tracking
 │                             ├─ GET /api/gamification/[userId] → 28-day history
 │                             ├─ POST /api/tracking/checkin → XP + streak + badges
 │                             ├─ PatternInsights → completion %, best day, trend
 │                             ├─ GET /api/coaching/weekly → Claude Haiku coaching message
 │                             └─ POST /api/plan/adapt → regenerate plan (simplify/level up)
 │
 └─ /evaluation ───────────── Empirical testing tool
                               └─ POST /api/evaluation/run
                                    9 synthetic personas × 5 metrics
```

**Stack:**
- Framework: Next.js 16 App Router (TypeScript)
- AI: Anthropic Claude (Haiku + Sonnet), @xenova/transformers (embeddings)
- Database: Supabase (PostgreSQL + pgvector)
- Styling: Tailwind CSS 4, Framer Motion
- Charts: Recharts
- Testing: Jest + ts-jest (26+ unit tests)

---

## 4. Empirical Evaluation

A key requirement of the assessment is rigorous empirical evaluation. HabitForge includes a dedicated evaluation tool at `/evaluation` that runs a controlled experiment with synthetic personas.

### 4.1 Synthetic Personas

9 personas across 3 categories and 3 difficulty tiers:

| ID | Name | Category | Difficulty | Key Constraints |
|---|---|---|---|---|
| F1 | Maria | Fitness | Easy | None — motivated student, 60 min/day |
| F2 | James | Fitness | Medium | Office job, 30 min/day, no gym |
| F3 | Sofia | Fitness | Hard | Single parent, 15 min/day, chronic fatigue |
| P1 | Alex | Productivity | Easy | None — freelancer, flexible schedule |
| P2 | David | Productivity | Medium | Back-to-back meetings, 45 min focus blocks |
| P3 | Emma | Productivity | Hard | ADHD, variable energy, needs ultra-low friction |
| L1 | Chen | Learning | Easy | None — student, 2 hrs/day, high motivation |
| L2 | Priya | Learning | Medium | Full-time job, 45 min/day, commutes by train |
| L3 | Marcus | Learning | Hard | Working dad, 20 min/night, tired evenings |

### 4.2 Evaluation Metrics

**Code:** `evaluation/scoring.ts`

Five metrics are calculated for each persona's generated plan:

**1. Personalization Score (1–10):**
Measures how well the generated plan text addresses the persona's stated constraints. For each constraint string (e.g. "only 15 minutes free"), keywords longer than 3 characters are extracted and searched in the plan text. Score = (matched constraints / total constraints) × 10. Personas with no constraints baseline at 9.

**2. Principle Coverage (0–1):**
Fraction of available psychology principles (from the knowledge graph for that category) that appear in the plan's `psychology_principles_used` array. Matching is case-insensitive with underscore normalisation.

**3. Confidence Score (0–1):**
Pre-calculated during generation using the 3-signal formula (constraint fit + case similarity + motivation sentiment). Included as a per-persona output to show how certainty varies with difficulty.

**4. Confidence Label:**
Human-readable mapping of the confidence score: Very High / High / Medium / Low / Very Low.

**5. Difficulty Appropriateness (boolean):**
Extracts the first "N min" or "N minute" reference from any daily action in the plan. Returns true if N ≤ persona's `maxDailyMinutes`. A plan is inappropriate if it asks a 15-min/day persona to complete 45-minute sessions.

### 4.3 Expected Results

The evaluation is designed to produce a gradient across difficulty tiers. Easy personas (no constraints) should score high on all metrics. Hard personas (Sofia, Emma, Marcus) test whether the system respects severe real-world constraints. The ADHD persona (P3 Emma) specifically tests whether the system avoids rigid structure and delivers ultra-low-friction suggestions.

---

## 5. Database Schema

```sql
users
├── id UUID (PK)
├── email, display_name
└── session_token

habit_plans
├── id UUID (PK)
├── user_id → users
├── parent_plan_id → habit_plans  -- tracks adaptation lineage
├── category (fitness|productivity|learning)
├── habit_goal, motivation TEXT
├── constraints, lifestyle_context JSONB
├── conversation_history JSONB
├── generated_plan JSONB          -- full HabitPlan object
├── psychology_principles TEXT[]
├── confidence_score FLOAT
└── difficulty_level TEXT

habit_tracking
├── id UUID (PK)
├── user_id → users
├── plan_id → habit_plans
├── date DATE
├── completed BOOLEAN
├── notes TEXT
└── xp_earned INT
   UNIQUE (user_id, plan_id, date)

user_gamification
├── user_id → users (UNIQUE)
├── total_xp, current_streak, longest_streak INT
├── badges JSONB
└── level TEXT

success_cases
├── category TEXT
├── habit_description, user_profile JSONB
├── success_strategy, key_principles TEXT[]
└── embedding VECTOR(384)         -- IVFFlat index for cosine search

coaching_messages
├── user_id → users
├── plan_id → habit_plans
├── week_number INT
├── message TEXT
└── generated_at TIMESTAMPTZ
   UNIQUE (user_id, plan_id, week_number)
```

---

## 6. Key Design Decisions

**Why Claude Haiku for conversation and Sonnet for planning?**
Haiku is significantly cheaper and faster (~3× lower latency) — ideal for the conversational back-and-forth where speed matters for UX. Sonnet's greater reasoning capability is reserved for plan synthesis where quality and coherence of the 4-week structure matters more than response time.

**Why synthetic success cases instead of real user data?**
The app had no users at launch. 75 synthetic cases (25 per category) were hand-crafted to cover the constraint space and pre-embedded. This is a deliberate cold-start strategy — the semantic search provides a grounding signal even without real user history.

**Why not fine-tune a model?**
The psychology knowledge is too structured and citation-specific for fine-tuning to reliably encode. A knowledge graph + prompt injection preserves the exact academic source and applicable conditions, while fine-tuning would diffuse that specificity into weights without guarantee of accuracy.

**Why anonymous sessions instead of mandatory auth?**
Reducing friction at the top of the funnel. Users can experience the full onboarding and plan generation without signing up. Auth was implemented (email + Google OAuth) but can be toggled. The trade-off is that plans are tied to localStorage session tokens — clearing the browser loses the session.

**Why cache coaching messages per week?**
Generating a coaching message on every dashboard load would be expensive and introduce latency. Since the coaching insight is based on the past 7 days, it only makes sense to regenerate once per week. The `(user_id, plan_id, week_number)` unique constraint ensures exactly one message per week.

---

## 7. Limitations & Critical Reflection

**Synthetic evaluation data:**
All 75 success cases and all 9 evaluation personas are synthetic. While carefully designed to cover the constraint space, they cannot fully replicate the diversity of real users. Evaluation results show system behaviour under controlled conditions, not production performance.

**Motivation sentiment is shallow:**
The sentiment scoring (keyword matching) is a heuristic approximation. It doesn't detect sarcasm, context, or nuanced emotional states. A user who writes "I'm not exactly thrilled but I'll try" would score incorrectly. A proper sentiment model would improve this.

**Cold-start case similarity:**
With no real user embeddings in the database, the case similarity component of confidence scoring always returns 0.5 (the neutral fallback). As real users generate plans, the vector store improves — but the system is currently running on synthetic cases only.

**Vercel timeout risk:**
The `@xenova/transformers` embedding model initialises from disk on cold start. On Vercel's serverless functions with a 10-second timeout (free tier), this could fail under load. The embedding step is deferred where possible, but plan generation with a fresh function instance could exceed the limit.

**No longitudinal validation:**
The adaptive plan feature (pattern analysis + coaching + plan evolution) cannot be empirically validated without real users running the app over multiple weeks. The evaluation tool tests plan quality at generation time, not adaptation quality over time.

**Prompt injection risk:**
User-provided text (goals, motivation, conversation answers) is injected into LLM prompts. While Anthropic's models have safety guardrails, there is no explicit input sanitisation. In a production deployment, user inputs should be validated or sandboxed before inclusion in system-critical prompts.

---

## 8. Build Timeline

| Phase | What Was Built |
|---|---|
| Phase 1 | Next.js scaffold, forge design system, knowledge graph JSON (37 principles), 75 success cases |
| Phase 2A | Embeddings service (all-MiniLM-L6-v2), semantic search, confidence scoring, knowledge graph loader |
| Phase 2B–D | LLM orchestration (generateQuestion + generatePlan), conversation API routes, plan generation API, typed API client |
| Phase 3 | Landing page, onboarding wizard (4-step), results page, Supabase persistence (all tables + migrations) |
| Phase 3E | Reduced onboarding from 7 questions to 4 compound questions, suggestion chips, progress indicator |
| Phase 4 | Gamification dashboard — XP, streaks, badges, 28-day chart, daily check-in, all API routes |
| Phase 4B | Auth system (email/password + Google OAuth via Supabase), global nav bar, free-flow navigation |
| Phase 4C | Confidence meter (animated SVG arc), psychology principle badges on results page |
| Phase 4D | Synthetic evaluation tool — 9 personas, 5 metrics, evaluation API, PersonaCard + MetricsTable UI |
| Phase 5 | Adaptive AI — pattern analysis, weekly coaching messages (Claude Haiku), adaptive plan trigger, PatternInsights + CoachingCard + AdaptationPrompt dashboard components, DB migration |

---

## 9. What Still Needs Doing

- [ ] UI redesign (white/light theme, scroll animations, new hero section)
- [ ] Vercel deployment (production URL needed for report)
- [ ] GitHub repository made public (required by brief)
- [ ] AT3 report written (PDF, ≤3500 words, due 16 May 2026)
- [ ] Presentation slides (PPTX, due 14 May 2026 for Group B)
- [ ] Run evaluation tool and capture real results for report's empirical analysis section
