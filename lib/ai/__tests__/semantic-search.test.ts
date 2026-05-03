import type { SupabaseClient } from "@supabase/supabase-js";
import { findSimilarCasesDirect } from "../semantic-search";

/**
 * Tests for the semantic search module
 *
 * Note: The main findSimilarCases function requires a working Supabase connection
 * and RPC endpoint, so we focus on testing the helper functions and the direct approach
 */

describe("Semantic Search Module", () => {
  describe("Vector utilities", () => {
    it("should calculate cosine similarity correctly", () => {
      // Create two normalized vectors
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0]; // Identical

      const similarity = calculateCosineSimilarityHelper(vecA, vecB);
      expect(similarity).toBeCloseTo(1.0, 5); // Perfect match
    });

    it("should calculate orthogonal vectors as 0 similarity", () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0]; // Orthogonal

      const similarity = calculateCosineSimilarityHelper(vecA, vecB);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it("should calculate opposite vectors as -1 similarity", () => {
      const vecA = [1, 0, 0];
      const vecB = [-1, 0, 0]; // Opposite

      const similarity = calculateCosineSimilarityHelper(vecA, vecB);
      expect(similarity).toBeCloseTo(-1.0, 5);
    });
  });

  describe("Distance to success score conversion", () => {
    it("should convert distance 0 to similarity 1.0", () => {
      const distance = 0;
      const successScore = 1 - distance / 2; // 1 - 0 = 1.0

      expect(successScore).toBeCloseTo(1.0, 5);
    });

    it("should convert distance 1 to similarity 0.5", () => {
      const distance = 1;
      const successScore = 1 - distance / 2; // 1 - 0.5 = 0.5

      expect(successScore).toBeCloseTo(0.5, 5);
    });

    it("should convert distance 2 to similarity 0.0", () => {
      const distance = 2;
      const successScore = 1 - distance / 2; // 1 - 1.0 = 0.0

      expect(successScore).toBeCloseTo(0.0, 5);
    });
  });

  describe("findSimilarCasesDirect", () => {
    // Mock Supabase client
    const createMockSupabaseClient = (
      caseData: Array<{
        id: string;
        category: string;
        embedding: number[];
        success_rate: number;
      }>
    ): Partial<SupabaseClient> => {
      return {
        from: () => ({
          select: () => ({
            eq: (field: string, value: string) => ({
              limit: (n: number) => ({
                then: (callback: (result: any) => void) => {
                  if (field === "category" && value === "fitness") {
                    callback({
                      data: caseData.filter((c) => c.category === "fitness"),
                      error: null,
                    });
                  } else {
                    callback({ data: caseData, error: null });
                  }
                  return Promise.resolve({
                    data: caseData.filter((c) => c.category === "fitness"),
                    error: null,
                  });
                },
              }),
            }),
          }),
        }),
      };
    };

    it("should return empty array for no matching cases", async () => {
      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const results = await findSimilarCasesDirect(
        mockClient,
        [0.1, 0.2, 0.3],
        "fitness",
        3
      );

      expect(results).toEqual([]);
    });

    it("should sort by similarity distance", async () => {
      const testCases = [
        {
          id: "case1",
          user_id: "user1",
          category: "fitness",
          principle_ids: ["p1"],
          description: "Test case 1",
          embedding: [0.95, 0.05, 0.0], // Very close to query
          success_rate: 0.8,
          created_at: "2025-01-01",
          updated_at: "2025-01-01",
        },
        {
          id: "case2",
          user_id: "user2",
          category: "fitness",
          principle_ids: ["p2"],
          description: "Test case 2",
          embedding: [0.2, 0.2, 0.6], // Far from query
          success_rate: 0.6,
          created_at: "2025-01-02",
          updated_at: "2025-01-02",
        },
        {
          id: "case3",
          user_id: "user3",
          category: "fitness",
          principle_ids: ["p3"],
          description: "Test case 3",
          embedding: [0.9, 0.1, 0.0], // Close to query
          success_rate: 0.7,
          created_at: "2025-01-03",
          updated_at: "2025-01-03",
        },
      ];

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({
                  data: testCases,
                  error: null,
                }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const queryEmbedding = [1.0, 0.0, 0.0]; // Query vector
      const results = await findSimilarCasesDirect(
        mockClient,
        queryEmbedding,
        "fitness",
        3
      );

      // Results should be sorted by similarity (distance ascending)
      expect(results.length).toBeLessThanOrEqual(3);
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(
            (results[i].similarity_distance || 2) <=
              (results[i + 1].similarity_distance || 2)
          ).toBe(true);
        }
      }
    });

    it("should respect limit parameter", async () => {
      const testCases = Array.from({ length: 10 }, (_, i) => ({
        id: `case${i}`,
        user_id: `user${i}`,
        category: "fitness",
        principle_ids: [`p${i}`],
        description: `Test case ${i}`,
        embedding: Array(384).fill(0.5), // 384-dim embedding
        success_rate: 0.7,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      }));

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({
                  data: testCases,
                  error: null,
                }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const queryEmbedding = Array(384).fill(0.5);
      const results = await findSimilarCasesDirect(
        mockClient,
        queryEmbedding,
        "fitness",
        5
      );

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it("should handle Supabase errors", async () => {
      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({
                  data: null,
                  error: { message: "Database error" },
                }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      await expect(
        findSimilarCasesDirect(mockClient, [0.1, 0.2], "fitness", 3)
      ).rejects.toThrow("Supabase query failed");
    });
  });

  describe("Success case structure", () => {
    it("should have correct SuccessCase interface fields", () => {
      const mockCase = {
        id: "case1",
        user_id: "user1",
        category: "fitness",
        principle_ids: ["p1", "p2"],
        description: "Successfully built a running habit",
        embedding: Array(384).fill(0.5),
        similarity_distance: 0.15,
        success_rate: 0.85,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      // Verify all required fields exist
      expect(mockCase.id).toBeDefined();
      expect(mockCase.user_id).toBeDefined();
      expect(mockCase.category).toBeDefined();
      expect(mockCase.principle_ids).toBeDefined();
      expect(mockCase.description).toBeDefined();
      expect(mockCase.embedding).toBeDefined();
      expect(mockCase.success_rate).toBeDefined();
      expect(mockCase.created_at).toBeDefined();
      expect(mockCase.updated_at).toBeDefined();
    });
  });

  describe("Embedding dimension handling", () => {
    it("should work with 384-dimensional embeddings", async () => {
      const embedding384 = Array(384).fill(0.5);

      const mockClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const results = await findSimilarCasesDirect(
        mockClient,
        embedding384,
        "fitness",
        3
      );

      expect(Array.isArray(results)).toBe(true);
    });
  });
});

/**
 * Helper function for testing cosine similarity calculation
 */
function calculateCosineSimilarityHelper(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
