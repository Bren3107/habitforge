import {
  loadKnowledgeGraph,
  getPrinciplesByCategory,
  filterPrinciplesByConstraints,
  getPrincipleById,
  getAllPrinciples,
  getCategoryMetadata,
  resetKnowledgeGraphCache,
  type Principle,
} from "../knowledge-graph";

describe("Knowledge Graph Module", () => {
  afterAll(() => {
    // Reset cache for next test suite to avoid state pollution
    resetKnowledgeGraphCache();
  });

  describe("loadKnowledgeGraph", () => {
    it("should load all three knowledge graph files", async () => {
      const kg = await loadKnowledgeGraph();

      expect(kg).toBeDefined();
      expect(kg.fitness).toBeDefined();
      expect(kg.productivity).toBeDefined();
      expect(kg.learning).toBeDefined();
    });

    it("should cache the knowledge graph on subsequent calls", async () => {
      const kg1 = await loadKnowledgeGraph();
      const kg2 = await loadKnowledgeGraph();

      expect(kg1).toBe(kg2); // Same reference
    });

    it("should have correct structure for each category", async () => {
      const kg = await loadKnowledgeGraph();

      for (const [, category] of Object.entries(kg)) {
        expect(category.category).toBeDefined();
        expect(Array.isArray(category.principles)).toBe(true);
        expect(Array.isArray(category.common_obstacles)).toBe(true);
        expect(Array.isArray(category.cue_patterns)).toBe(true);
      }
    });
  });

  describe("getPrinciplesByCategory", () => {
    it("should return principles for fitness category", async () => {
      const principles = await getPrinciplesByCategory("fitness");

      expect(Array.isArray(principles)).toBe(true);
      expect(principles.length).toBeGreaterThan(0);
      expect(principles[0].id).toBeDefined();
      expect(principles[0].name).toBeDefined();
    });

    it("should return principles for productivity category", async () => {
      const principles = await getPrinciplesByCategory("productivity");

      expect(Array.isArray(principles)).toBe(true);
      expect(principles.length).toBeGreaterThan(0);
    });

    it("should return principles for learning category", async () => {
      const principles = await getPrinciplesByCategory("learning");

      expect(Array.isArray(principles)).toBe(true);
      expect(principles.length).toBeGreaterThan(0);
    });

    it("should be case-insensitive", async () => {
      const principles1 = await getPrinciplesByCategory("FITNESS");
      const principles2 = await getPrinciplesByCategory("fitness");

      expect(principles1.length).toBe(principles2.length);
    });

    it("should throw error for unknown category", async () => {
      await expect(getPrinciplesByCategory("unknown")).rejects.toThrow();
    });
  });

  describe("filterPrinciplesByConstraints", () => {
    let allPrinciples: Principle[];

    beforeEach(async () => {
      allPrinciples = await getAllPrinciples();
    });

    it("should return all principles when no constraints provided", async () => {
      const filtered = await filterPrinciplesByConstraints(allPrinciples, []);

      expect(filtered.length).toBe(allPrinciples.length);
    });

    it("should filter by single constraint", async () => {
      const filtered = await filterPrinciplesByConstraints(
        allPrinciples,
        ["low_motivation"]
      );

      expect(filtered.length).toBeGreaterThan(0);
      expect(
        filtered.every(
          (p) =>
            p.applicable_when.includes("low_motivation") ||
            p.applicable_when.includes("general")
        )
      ).toBe(true);
    });

    it("should filter by multiple constraints", async () => {
      const filtered = await filterPrinciplesByConstraints(allPrinciples, [
        "low_motivation",
        "low_time",
      ]);

      expect(filtered.length).toBeGreaterThan(0);

      // All filtered principles should match the constraints
      filtered.forEach((p) => {
        const applicableSet = new Set(p.applicable_when);
        const notApplicableSet = new Set(p.not_applicable_when || []);

        const isGeneral = applicableSet.has("general");

        if (isGeneral) {
          // If general, none of the constraints should be in not_applicable_when
          expect(
            ["low_motivation", "low_time"].some((c) => notApplicableSet.has(c))
          ).toBe(false);
        } else {
          // Otherwise, all constraints should be in applicable_when
          expect(
            ["low_motivation", "low_time"].every((c) => applicableSet.has(c))
          ).toBe(true);
        }
      });
    });

    it("should respect not_applicable_when tags", async () => {
      const filtered = await filterPrinciplesByConstraints(allPrinciples, [
        "low_energy",
      ]);

      filtered.forEach((p) => {
        const notApplicable = new Set(p.not_applicable_when || []);
        expect(notApplicable.has("low_energy")).toBe(false);
      });
    });
  });

  describe("getPrincipleById", () => {
    it("should find existing principle by ID", async () => {
      const principle = await getPrincipleById("habit_stacking");

      expect(principle).toBeDefined();
      expect(principle?.id).toBe("habit_stacking");
      expect(principle?.name).toBe("Habit Stacking");
    });

    it("should return null for non-existent principle", async () => {
      const principle = await getPrincipleById("non_existent_principle");

      expect(principle).toBeNull();
    });

    it("should search across all categories", async () => {
      // Get a principle from each category
      const fitnessId = "habit_stacking"; // fitness
      const productivityId = "time_blocking"; // productivity
      const learningId = "spaced_repetition"; // learning

      const [fit, prod, learn] = await Promise.all([
        getPrincipleById(fitnessId),
        getPrincipleById(productivityId),
        getPrincipleById(learningId),
      ]);

      expect(fit).toBeDefined();
      expect(prod).toBeDefined();
      expect(learn).toBeDefined();
    });
  });

  describe("getAllPrinciples", () => {
    it("should return all principles from all categories", async () => {
      const allPrinciples = await getAllPrinciples();

      expect(Array.isArray(allPrinciples)).toBe(true);
      expect(allPrinciples.length).toBeGreaterThan(0);

      // Should have principles from all three categories
      const categories = new Set(
        (await Promise.all([
          getPrinciplesByCategory("fitness"),
          getPrinciplesByCategory("productivity"),
          getPrinciplesByCategory("learning"),
        ])).reduce((acc, cat) => acc.concat(cat), []).map((p) => p.id)
      );

      const allIds = new Set(allPrinciples.map((p) => p.id));

      expect(allIds.size).toBe(categories.size);
    });
  });

  describe("getCategoryMetadata", () => {
    it("should return metadata for fitness category", async () => {
      const metadata = await getCategoryMetadata("fitness");

      expect(metadata.common_obstacles).toBeDefined();
      expect(Array.isArray(metadata.common_obstacles)).toBe(true);
      expect(metadata.cue_patterns).toBeDefined();
      expect(Array.isArray(metadata.cue_patterns)).toBe(true);
    });

    it("should return difficulty profiles", async () => {
      const metadata = await getCategoryMetadata("fitness");

      expect(metadata.difficulty_profiles).toBeDefined();
      expect(metadata.difficulty_profiles.rookie).toBeDefined();
      expect(metadata.difficulty_profiles.explorer).toBeDefined();
      expect(metadata.difficulty_profiles.master).toBeDefined();
    });

    it("should throw error for unknown category", async () => {
      await expect(getCategoryMetadata("unknown")).rejects.toThrow();
    });
  });

  describe("Principle structure validation", () => {
    it("should have all required fields in each principle", async () => {
      const allPrinciples = await getAllPrinciples();

      allPrinciples.forEach((principle) => {
        expect(principle.id).toBeDefined();
        expect(principle.name).toBeDefined();
        expect(principle.description).toBeDefined();
        expect(principle.source).toBeDefined();
        expect(principle.applicable_when).toBeDefined();
        expect(Array.isArray(principle.applicable_when)).toBe(true);
        expect(principle.example).toBeDefined();
        expect(typeof principle.xp_bonus).toBe("number");
      });
    });

    it("should have valid xp_bonus values", async () => {
      const allPrinciples = await getAllPrinciples();

      allPrinciples.forEach((principle) => {
        expect(principle.xp_bonus).toBeGreaterThanOrEqual(0);
        expect(principle.xp_bonus).toBeLessThanOrEqual(10);
      });
    });
  });
});
