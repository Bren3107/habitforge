import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Represents a single psychology principle
 */
export interface Principle {
  id: string;
  name: string;
  description: string;
  mechanism?: string;
  source: string;
  applicable_when: string[];
  not_applicable_when?: string[];
  example: string;
  xp_bonus: number;
}

/**
 * Category-specific knowledge graph structure
 */
export interface CategoryKnowledgeGraph {
  category: string;
  principles: Principle[];
  difficulty_profiles?: Record<
    string,
    {
      habit_count: number;
      min_daily_minutes: number;
      max_daily_minutes: number;
    }
  >;
  common_obstacles: string[];
  cue_patterns: string[];
  constraint_tags?: string[];
}

/**
 * Complete knowledge graph with all categories
 */
export interface KnowledgeGraph {
  fitness: CategoryKnowledgeGraph;
  productivity: CategoryKnowledgeGraph;
  learning: CategoryKnowledgeGraph;
}

// In-memory cache for the knowledge graph
let cachedKnowledgeGraph: KnowledgeGraph | null = null;

/**
 * Loads all knowledge graph JSON files into memory
 * Loads from: data/knowledge-graph/fitness.json, productivity.json, learning.json
 */
export async function loadKnowledgeGraph(): Promise<KnowledgeGraph> {
  if (cachedKnowledgeGraph) {
    return cachedKnowledgeGraph;
  }

  try {
    const dataDir = join(process.cwd(), "data", "knowledge-graph");

    const fitnessPath = join(dataDir, "fitness.json");
    const productivityPath = join(dataDir, "productivity.json");
    const learningPath = join(dataDir, "learning.json");

    const [fitnessData, productivityData, learningData] = await Promise.all([
      readFile(fitnessPath, "utf-8"),
      readFile(productivityPath, "utf-8"),
      readFile(learningPath, "utf-8"),
    ]);

    cachedKnowledgeGraph = {
      fitness: JSON.parse(fitnessData) as CategoryKnowledgeGraph,
      productivity: JSON.parse(productivityData) as CategoryKnowledgeGraph,
      learning: JSON.parse(learningData) as CategoryKnowledgeGraph,
    };

    return cachedKnowledgeGraph;
  } catch (error) {
    throw new Error(
      `Failed to load knowledge graph: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Reset the knowledge graph cache (mainly for testing)
 */
export function resetKnowledgeGraphCache(): void {
  cachedKnowledgeGraph = null;
}

/**
 * Returns all principles for a specific category
 *
 * @param category - The category name (fitness, productivity, learning)
 * @returns Promise resolving to array of principles for the category
 * @throws Error if category is invalid or knowledge graph is not loaded
 */
export async function getPrinciplesByCategory(
  category: string
): Promise<Principle[]> {
  if (!category || typeof category !== "string") {
    throw new Error("Category must be a non-empty string");
  }

  const kg = await loadKnowledgeGraph();

  const categoryKey = category.toLowerCase() as keyof KnowledgeGraph;
  if (categoryKey in kg) {
    return kg[categoryKey].principles;
  }

  throw new Error(`Unknown category: ${category}`);
}

/**
 * Filter principles by user constraints.
 *
 * Principles with "general" tag: Always included UNLESS user constraints
 * are in the principle's not_applicable_when list.
 *
 * Principles with specific constraints: Included only if ALL user constraints
 * are in the principle's applicable_when list.
 *
 * @param principles - Principles to filter
 * @param constraints - User's situation tags (e.g., ["low_energy", "low_time"])
 * @returns Filtered principles that match user situation
 */
export async function filterPrinciplesByConstraints(
  principles: Principle[],
  constraints: string[]
): Promise<Principle[]> {
  if (constraints.length === 0) {
    return principles;
  }

  return principles.filter((principle) => {
    // A principle matches if it has applicable_when tags that match ALL constraints
    const applicableWhen = new Set(principle.applicable_when);
    const generalApplies =
      applicableWhen.has("general") || principle.applicable_when.includes("*");

    if (generalApplies) {
      // If "general" applies, check it's not explicitly excluded
      const notApplicable = new Set(principle.not_applicable_when || []);
      return !constraints.some((constraint) => notApplicable.has(constraint));
    }

    // Check that ALL constraints are in the applicable_when list
    return constraints.every((constraint) => applicableWhen.has(constraint));
  });
}

/**
 * Looks up a single principle by ID across all categories
 */
export async function getPrincipleById(id: string): Promise<Principle | null> {
  const kg = await loadKnowledgeGraph();

  for (const category of Object.values(kg)) {
    const principle = category.principles.find((p: Principle) => p.id === id);
    if (principle) {
      return principle;
    }
  }

  return null;
}

/**
 * Get all principles across all categories
 */
export async function getAllPrinciples(): Promise<Principle[]> {
  const kg = await loadKnowledgeGraph();
  const allPrinciples: Principle[] = [];

  for (const category of Object.values(kg)) {
    allPrinciples.push(...category.principles);
  }

  return allPrinciples;
}

/**
 * Get category-specific metadata (obstacles, cue patterns, constraints)
 */
export async function getCategoryMetadata(category: string) {
  const kg = await loadKnowledgeGraph();
  const categoryKey = category.toLowerCase() as keyof KnowledgeGraph;

  if (categoryKey in kg) {
    const catData = kg[categoryKey];
    return {
      common_obstacles: catData.common_obstacles,
      cue_patterns: catData.cue_patterns,
      constraint_tags: catData.constraint_tags || [],
      difficulty_profiles: catData.difficulty_profiles || {},
    };
  }

  throw new Error(`Unknown category: ${category}`);
}
