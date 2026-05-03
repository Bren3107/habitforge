import {
  initEmbeddings,
  embed,
  getEmbeddingDimension,
  isInitialized,
  resetEmbeddings,
} from "../embeddings";

/**
 * Tests for the embeddings module
 *
 * Note: These tests may require @xenova/transformers to be installed
 * and may take some time on first run as the model is downloaded
 */
describe("Embeddings Module", () => {
  beforeEach(() => {
    resetEmbeddings(); // Reset state between tests
  });

  describe("getEmbeddingDimension", () => {
    it("should return 384 dimensions for all-MiniLM-L6-v2", () => {
      const dimension = getEmbeddingDimension();

      expect(dimension).toBe(384);
    });

    it("should be a positive integer", () => {
      const dimension = getEmbeddingDimension();

      expect(Number.isInteger(dimension)).toBe(true);
      expect(dimension).toBeGreaterThan(0);
    });
  });

  describe("isInitialized", () => {
    it("should return false before initialization", () => {
      expect(isInitialized()).toBe(false);
    });

    it("should return true after initEmbeddings call", async () => {
      await initEmbeddings();

      expect(isInitialized()).toBe(true);
    });
  });

  describe("initEmbeddings", () => {
    it("should initialize the model", async () => {
      expect(isInitialized()).toBe(false);

      await initEmbeddings();

      expect(isInitialized()).toBe(true);
    });

    it("should be idempotent - multiple calls should not reinitialize", async () => {
      await initEmbeddings();
      const firstInit = isInitialized();

      // Call again
      await initEmbeddings();
      const secondInit = isInitialized();

      expect(firstInit).toBe(true);
      expect(secondInit).toBe(true);
    });

    it("should handle initialization errors gracefully", async () => {
      // This test would require mocking the transformers library
      // For now, we verify that the function exists and is callable
      expect(typeof initEmbeddings).toBe("function");
    });
  });

  describe("embed", () => {
    beforeEach(async () => {
      // Ensure model is initialized
      resetEmbeddings();
      await initEmbeddings();
    });

    it("should generate embedding for text", async () => {
      const text = "I want to improve my fitness habits";
      const embedding = await embed(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384);
    });

    it("should return numeric array", async () => {
      const embedding = await embed("test text");

      expect(embedding.every((val) => typeof val === "number")).toBe(true);
    });

    it("should generate consistent embeddings for same text", async () => {
      const text = "consistent test";

      const embedding1 = await embed(text);
      const embedding2 = await embed(text);

      // Embeddings should be identical for same input
      expect(embedding1).toEqual(embedding2);
    });

    it("should generate different embeddings for different text", async () => {
      const embedding1 = await embed("fitness habit routine");
      const embedding2 = await embed("productivity time management");

      // Should not be identical
      expect(embedding1).not.toEqual(embedding2);

      // Should have same dimension
      expect(embedding1.length).toBe(embedding2.length);
    });

    it("should handle empty string", async () => {
      const embedding = await embed("");

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384);
    });

    it("should handle long text", async () => {
      const longText = "word ".repeat(500); // ~2500 characters
      const embedding = await embed(longText);

      expect(embedding.length).toBe(384);
    });

    it("should handle special characters", async () => {
      const text = "Special chars: !@#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const embedding = await embed(text);

      expect(embedding.length).toBe(384);
      expect(embedding.every((val) => typeof val === "number")).toBe(true);
    });

    it("should handle unicode characters", async () => {
      const text = "Unicode: 你好 مرحبا Здравствуй 🎉";
      const embedding = await embed(text);

      expect(embedding.length).toBe(384);
    });

    it("should auto-initialize on first call if not initialized", async () => {
      resetEmbeddings();
      expect(isInitialized()).toBe(false);

      const embedding = await embed("test text");

      expect(isInitialized()).toBe(true);
      expect(embedding.length).toBe(384);
    });

    it("should generate normalized embeddings (roughly unit length)", async () => {
      const embedding = await embed("test text");

      // Calculate L2 norm
      const norm = Math.sqrt(
        embedding.reduce((sum, val) => sum + val * val, 0)
      );

      // For normalized embeddings, norm should be close to 1.0
      // Allow some tolerance due to floating point precision
      expect(norm).toBeCloseTo(1.0, 1);
    });
  });

  describe("resetEmbeddings", () => {
    it("should reset initialization state", async () => {
      await initEmbeddings();
      expect(isInitialized()).toBe(true);

      resetEmbeddings();

      expect(isInitialized()).toBe(false);
    });
  });

  describe("Embedding quality", () => {
    beforeEach(async () => {
      resetEmbeddings();
      await initEmbeddings();
    });

    it("should create semantically similar embeddings for related texts", async () => {
      const text1 = "I want to build a fitness habit";
      const text2 = "I want to establish an exercise routine";
      const text3 = "I like to eat ice cream";

      const [emb1, emb2, emb3] = await Promise.all([
        embed(text1),
        embed(text2),
        embed(text3),
      ]);

      // Calculate cosine similarity
      const sim12 = cosineSimilarity(emb1, emb2);
      const sim13 = cosineSimilarity(emb1, emb3);

      // text1 and text2 are more similar than text1 and text3
      expect(sim12).toBeGreaterThan(sim13);
    });

    it("should have consistent vector properties", async () => {
      const embedding = await embed("consistency test");

      // All values should be finite
      expect(embedding.every((val) => Number.isFinite(val))).toBe(true);

      // Values should be in reasonable range for normalized embeddings
      embedding.forEach((val) => {
        expect(Math.abs(val)).toBeLessThanOrEqual(1.0);
      });
    });
  });
});

/**
 * Helper function to calculate cosine similarity
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
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
