export type PersonaDifficulty = "easy" | "medium" | "hard";
export type PersonaCategory = "fitness" | "productivity" | "learning";

export interface Persona {
  id: string;
  name: string;
  category: PersonaCategory;
  difficulty: PersonaDifficulty;
  goal: string;
  motivation: string;
  /** Human-readable constraint strings (used for personalization scoring) */
  constraints: string[];
  /** Lifestyle summary fed directly into generatePlan as user_context.lifestyle_summary */
  lifestyle_summary: string;
  /** Max acceptable daily minutes — used for difficulty appropriateness check */
  maxDailyMinutes: number;
  /** Max habits appropriate for this persona */
  maxHabits: number;
}

export const PERSONAS: Persona[] = [
  // ── FITNESS ──────────────────────────────────────────────────────────────
  {
    id: "F1",
    name: "Maria",
    category: "fitness",
    difficulty: "easy",
    goal: "Build a consistent exercise routine and improve my fitness",
    motivation: "I want to feel more energetic and get healthier before graduation. I am excited to start.",
    constraints: [],
    lifestyle_summary:
      "Maria is a university student with 60 minutes free daily. She has high motivation, gym access on campus, and a flexible schedule between 8am and 9pm. She has no significant constraints and is eager to start exercising regularly.",
    maxDailyMinutes: 60,
    maxHabits: 3,
  },
  {
    id: "F2",
    name: "James",
    category: "fitness",
    difficulty: "medium",
    goal: "Get fit and lose some weight",
    motivation: "My doctor told me to be more active and I want to feel better about myself",
    constraints: ["office job 9-5", "1 hour commute each way", "only 30 minutes free daily"],
    lifestyle_summary:
      "James is an office worker with a demanding schedule. He commutes 2 hours daily and has only 30 minutes free. He is busy mornings and evenings. He can exercise at 6am before work or during a 30-minute lunch break. No gym membership but has space at home. Moderate motivation.",
    maxDailyMinutes: 30,
    maxHabits: 2,
  },
  {
    id: "F3",
    name: "Sofia",
    category: "fitness",
    difficulty: "hard",
    goal: "Get any kind of movement into my day",
    motivation: "I know I need to move more for my health but I am exhausted all the time",
    constraints: ["single parent", "only 15 minutes free", "low energy", "children need constant attention"],
    lifestyle_summary:
      "Sofia is a single parent with only 15 minutes available per day. She is chronically tired due to parenting responsibilities and has very low energy. Her only windows are during nap time or very early morning (5:30am) when she is also exhausted. She wants any movement at all — even 5 minutes counts.",
    maxDailyMinutes: 15,
    maxHabits: 1,
  },
  // ── PRODUCTIVITY ─────────────────────────────────────────────────────────
  {
    id: "P1",
    name: "Alex",
    category: "productivity",
    difficulty: "easy",
    goal: "Write 500 words every day for my novel",
    motivation: "Writing is my passion and I am determined to finish my novel. I am really looking forward to this.",
    constraints: [],
    lifestyle_summary:
      "Alex is a freelancer with a fully flexible schedule and high intrinsic motivation. They have 3+ hours free daily and no significant constraints. They have a dedicated home office and strong focus habits already in place.",
    maxDailyMinutes: 120,
    maxHabits: 3,
  },
  {
    id: "P2",
    name: "David",
    category: "productivity",
    difficulty: "medium",
    goal: "Get better at prioritising tasks and stop feeling overwhelmed",
    motivation: "I miss deadlines and feel scattered. I want to improve my performance at work.",
    constraints: ["back-to-back meetings most days", "manager role with frequent interruptions", "max 45 minute focus blocks"],
    lifestyle_summary:
      "David is a manager whose calendar is mostly meetings. He gets interrupted frequently and can only focus for 45-minute blocks. He has moderate motivation but high frustration with his current system. He needs productivity habits that work around a heavily fragmented schedule.",
    maxDailyMinutes: 45,
    maxHabits: 2,
  },
  {
    id: "P3",
    name: "Emma",
    category: "productivity",
    difficulty: "hard",
    goal: "Build any kind of daily routine — I have none right now",
    motivation: "My ADHD makes structure feel impossible but I desperately want to function better",
    constraints: ["ADHD diagnosis", "highly variable energy", "scattered schedule", "hyperfocus then crashes"],
    lifestyle_summary:
      "Emma has ADHD and struggles with any routine. Her schedule varies completely day to day. She experiences hyperfocus periods followed by energy crashes. She has low tolerance for rigid systems and needs extremely flexible, low-friction habits. Even a single 10-minute daily anchor is a win for her.",
    maxDailyMinutes: 20,
    maxHabits: 1,
  },
  // ── LEARNING ─────────────────────────────────────────────────────────────
  {
    id: "L1",
    name: "Chen",
    category: "learning",
    difficulty: "easy",
    goal: "Learn Python programming and build my first project",
    motivation: "I want to switch into a tech career and I am really excited about coding. This is my goal.",
    constraints: [],
    lifestyle_summary:
      "Chen is a university student with 2 hours available daily for learning. He has high motivation, reliable internet, and a laptop. He has no prior coding experience but strong maths skills. He can study any time of day with no external constraints.",
    maxDailyMinutes: 120,
    maxHabits: 3,
  },
  {
    id: "L2",
    name: "Priya",
    category: "learning",
    difficulty: "medium",
    goal: "Reach conversational Spanish within 6 months",
    motivation: "My partner's family speaks Spanish and I want to connect with them meaningfully",
    constraints: ["full-time professional job", "45 minutes daily max", "commute by train 30 min each way"],
    lifestyle_summary:
      "Priya is a working professional with 45 minutes available daily. She commutes by train which gives her 30 minutes of phone-based learning. She has moderate motivation and some prior Spanish from high school. Evenings are available for 15 additional minutes of practice.",
    maxDailyMinutes: 45,
    maxHabits: 2,
  },
  {
    id: "L3",
    name: "Marcus",
    category: "learning",
    difficulty: "hard",
    goal: "Learn to play a few songs on guitar to play for my kids",
    motivation: "My kids would love hearing me play. I used to play as a teenager and miss music.",
    constraints: ["full-time job", "dad to two young children", "only 20 minutes at night", "tired evenings"],
    lifestyle_summary:
      "Marcus works full-time and is an active dad. He only has 20 minutes at night after kids are in bed, and he is usually tired by then. He has a guitar from his teens. He has low energy in the evenings but strong emotional motivation. He needs a habit that survives exhaustion and keeps sessions under 20 minutes.",
    maxDailyMinutes: 20,
    maxHabits: 1,
  },
];
