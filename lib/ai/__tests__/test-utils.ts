import type { SuccessCase } from "../semantic-search";

/**
 * Create a deterministic mock embedding with proper 384 dimensions
 *
 * @param dimension - Number of dimensions (default: 384)
 * @param seed - Seed for deterministic generation (default: 0)
 * @returns Array of normalized embedding values
 */
export function createMockEmbedding(
  dimension: number = 384,
  seed: number = 0
): number[] {
  // Create deterministic mock embedding with correct dimension
  const embedding = new Array(dimension);
  for (let i = 0; i < dimension; i++) {
    // Use a simple deterministic formula based on seed + index
    // Normalized to approximately [0, 1] range
    embedding[i] = Math.sin(seed + i) * 0.5 + 0.5;
  }
  return embedding;
}

/**
 * Create a mock success case with proper structure
 *
 * @param overrides - Optional partial overrides for specific fields
 * @returns Complete SuccessCase object with all required fields
 */
export function createMockSuccessCase(
  overrides: Partial<SuccessCase> = {}
): SuccessCase {
  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).substring(2, 11);

  return {
    id: `test-case-${randomId}`,
    user_id: `user-${randomId}`,
    category: "fitness",
    principle_ids: ["habit_stacking"],
    description: "Test habit description",
    embedding: createMockEmbedding(384),
    success_rate: 0.75,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides,
  };
}
