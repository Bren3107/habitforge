import {
  calculateConfidence,
  distanceToSuccessScore,
  averageDistancesToSuccessScore,
  confidenceLevel,
  calculateConstraintFit,
  estimateMotivationSentiment,
  scorePrincipleMotivationFit,
} from "../confidence";

describe("Confidence Module", () => {
  describe("calculateConfidence", () => {
    it("should return score between 0.0 and 1.0", () => {
      const score = calculateConfidence(0.5, 0.5, 0.5);

      expect(score).toBeGreaterThanOrEqual(0.0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it("should apply correct weighting formula", () => {
      // constraint_fit: 0.4, similar_case_success: 0.4, motivation: 0.2
      const score = calculateConfidence(1.0, 0.5, 0.0);

      // Expected: (1.0 * 0.4) + (0.5 * 0.4) + (0.0 * 0.2) = 0.4 + 0.2 + 0 = 0.6
      expect(score).toBeCloseTo(0.6, 5);
    });

    it("should return 1.0 when all inputs are 1.0", () => {
      const score = calculateConfidence(1.0, 1.0, 1.0);

      expect(score).toBeCloseTo(1.0, 5);
    });

    it("should return 0.0 when all inputs are 0.0", () => {
      const score = calculateConfidence(0.0, 0.0, 0.0);

      expect(score).toBeCloseTo(0.0, 5);
    });

    it("should clamp inputs outside 0-1 range", () => {
      const score1 = calculateConfidence(1.5, 0.5, 0.5);
      const score2 = calculateConfidence(-0.5, 0.5, 0.5);

      // Both should be valid scores
      expect(score1).toBeGreaterThanOrEqual(0.0);
      expect(score1).toBeLessThanOrEqual(1.0);
      expect(score2).toBeGreaterThanOrEqual(0.0);
      expect(score2).toBeLessThanOrEqual(1.0);
    });

    it("should weight constraint fit and similarity equally", () => {
      const score1 = calculateConfidence(0.8, 0.2, 0.5);
      const score2 = calculateConfidence(0.2, 0.8, 0.5);

      // Both should be equal (0.8 * 0.4 + 0.2 * 0.4 + 0.5 * 0.2)
      expect(score1).toBeCloseTo(score2, 5);
    });

    it("should weight motivation at 0.2 (lower than fit and similarity)", () => {
      const scoreHighMotivation = calculateConfidence(0.5, 0.5, 1.0);
      const scoreLowMotivation = calculateConfidence(0.5, 0.5, 0.0);

      const diff = scoreHighMotivation - scoreLowMotivation;
      // Difference should be 0.2 (1.0 - 0.0) * 0.2 = 0.2
      expect(diff).toBeCloseTo(0.2, 5);
    });
  });

  describe("distanceToSuccessScore", () => {
    it("should return 1.0 for distance 0 (identical)", () => {
      const score = distanceToSuccessScore(0);

      expect(score).toBeCloseTo(1.0, 5);
    });

    it("should return 0.5 for distance 1 (orthogonal)", () => {
      const score = distanceToSuccessScore(1);

      expect(score).toBeCloseTo(0.5, 5);
    });

    it("should return 0.0 for distance 2 (opposite)", () => {
      const score = distanceToSuccessScore(2);

      expect(score).toBeCloseTo(0.0, 5);
    });

    it("should clamp negative results to 0.0", () => {
      const score = distanceToSuccessScore(3.0); // Beyond 2

      expect(score).toBeCloseTo(0.0, 5);
    });

    it("should be monotonically decreasing", () => {
      const score1 = distanceToSuccessScore(0.5);
      const score2 = distanceToSuccessScore(1.0);
      const score3 = distanceToSuccessScore(1.5);

      expect(score1).toBeGreaterThan(score2);
      expect(score2).toBeGreaterThan(score3);
    });
  });

  describe("averageDistancesToSuccessScore", () => {
    it("should return 0.5 for empty array", () => {
      const score = averageDistancesToSuccessScore([]);

      expect(score).toBeCloseTo(0.5, 5);
    });

    it("should average distances correctly", () => {
      const distances = [0, 1, 2];
      const score = averageDistancesToSuccessScore(distances);

      // Average distance: (0 + 1 + 2) / 3 = 1
      // Success score for 1: 0.5
      expect(score).toBeCloseTo(0.5, 5);
    });

    it("should handle single distance", () => {
      const score = averageDistancesToSuccessScore([1.0]);

      expect(score).toBeCloseTo(0.5, 5);
    });

    it("should handle identical distances", () => {
      const distances = [0.5, 0.5, 0.5];
      const score = averageDistancesToSuccessScore(distances);

      // Average: 0.5, success score: 1 - (0.5 / 2) = 0.75
      expect(score).toBeCloseTo(0.75, 5);
    });
  });

  describe("confidenceLevel", () => {
    it("should classify >= 0.8 as Very High", () => {
      expect(confidenceLevel(0.8)).toBe("Very High");
      expect(confidenceLevel(1.0)).toBe("Very High");
    });

    it("should classify 0.6-0.8 as High", () => {
      expect(confidenceLevel(0.6)).toBe("High");
      expect(confidenceLevel(0.7)).toBe("High");
      expect(confidenceLevel(0.79)).toBe("High");
    });

    it("should classify 0.4-0.6 as Medium", () => {
      expect(confidenceLevel(0.4)).toBe("Medium");
      expect(confidenceLevel(0.5)).toBe("Medium");
      expect(confidenceLevel(0.59)).toBe("Medium");
    });

    it("should classify 0.2-0.4 as Low", () => {
      expect(confidenceLevel(0.2)).toBe("Low");
      expect(confidenceLevel(0.3)).toBe("Low");
      expect(confidenceLevel(0.39)).toBe("Low");
    });

    it("should classify < 0.2 as Very Low", () => {
      expect(confidenceLevel(0.0)).toBe("Very Low");
      expect(confidenceLevel(0.1)).toBe("Very Low");
      expect(confidenceLevel(0.19)).toBe("Very Low");
    });
  });

  describe("calculateConstraintFit", () => {
    it("should return 0.5 for no user constraints", () => {
      const fit = calculateConstraintFit([], ["low_time", "low_energy"]);

      expect(fit).toBeCloseTo(0.5, 5);
    });

    it("should return 0.0 for no principle applicable_when", () => {
      const fit = calculateConstraintFit(["low_time"], []);

      expect(fit).toBeCloseTo(0.0, 5);
    });

    it("should return 0.8 for general applicability", () => {
      const fit = calculateConstraintFit(
        ["low_time", "low_energy"],
        ["general"]
      );

      expect(fit).toBeCloseTo(0.8, 5);
    });

    it("should calculate matching constraints correctly", () => {
      const fit = calculateConstraintFit(
        ["low_time", "low_energy", "low_motivation"],
        ["low_time", "low_energy", "high_consistency"]
      );

      // 2 out of 3 constraints match: 2/3 = 0.667
      expect(fit).toBeCloseTo(2 / 3, 5);
    });

    it("should be case-sensitive for constraint matching", () => {
      const fit = calculateConstraintFit(
        ["low_time"],
        ["low_TIME"] // Different case
      );

      // Should not match
      expect(fit).toBeCloseTo(0.0, 5);
    });

    it("should handle partial matches", () => {
      const fit = calculateConstraintFit(["low_time", "high_energy"], [
        "low_time",
      ]);

      // 1 out of 2: 0.5
      expect(fit).toBeCloseTo(0.5, 5);
    });
  });

  describe("estimateMotivationSentiment", () => {
    it("should return 0.5 for neutral input", () => {
      const score = estimateMotivationSentiment("I want to build a habit");

      expect(score).toBeCloseTo(0.5, 1);
    });

    it("should increase score for positive keywords", () => {
      const score = estimateMotivationSentiment(
        "I am really excited and motivated to improve"
      );

      expect(score).toBeGreaterThan(0.5);
    });

    it("should decrease score for negative keywords", () => {
      const score = estimateMotivationSentiment(
        "I am struggling and this is too hard"
      );

      expect(score).toBeLessThan(0.5);
    });

    it("should be case-insensitive", () => {
      const score1 = estimateMotivationSentiment("I am EXCITED");
      const score2 = estimateMotivationSentiment("I am excited");

      expect(score1).toBeCloseTo(score2, 5);
    });

    it("should clamp result to 0-1", () => {
      const positiveScore = estimateMotivationSentiment(
        "excited motivated determined want really passionate love eager thrilled confident"
      );
      const negativeScore = estimateMotivationSentiment(
        "struggling don't can't hard tired impossible never fail"
      );

      expect(positiveScore).toBeLessThanOrEqual(1.0);
      expect(negativeScore).toBeGreaterThanOrEqual(0.0);
    });

    it("should handle mixed sentiment", () => {
      const score = estimateMotivationSentiment(
        "I am excited about this but struggling with energy"
      );

      expect(score).toBeGreaterThanOrEqual(0.0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it("should handle empty string", () => {
      const score = estimateMotivationSentiment("");

      expect(score).toBeCloseTo(0.5, 5);
    });
  });

  describe("scorePrincipleMotivationFit", () => {
    it("should return high score for high motivation factors", () => {
      const score = scorePrincipleMotivationFit([
        "high_motivation",
        "high_self_efficacy",
      ]);

      expect(score).toBeGreaterThan(0.5);
    });

    it("should return lower score for low motivation factors", () => {
      const score = scorePrincipleMotivationFit(["low_motivation"]);

      expect(score).toBeLessThanOrEqual(0.3);
    });

    it("should return neutral for no motivation-related factors", () => {
      const score = scorePrincipleMotivationFit([
        "general",
        "needs_cue",
        "low_time",
      ]);

      expect(score).toBeLessThanOrEqual(0.3);
    });

    it("should handle empty applicable_when", () => {
      const score = scorePrincipleMotivationFit([]);

      expect(score).toBeGreaterThanOrEqual(0.0);
      expect(score).toBeLessThanOrEqual(0.3);
    });

    it("should cap score at 0.9", () => {
      const score = scorePrincipleMotivationFit([
        "high_motivation",
        "high_self_efficacy",
        "high_energy",
        "high_consistency",
        "social_support_available",
      ]);

      expect(score).toBeLessThanOrEqual(0.9);
    });
  });

  describe("Weighted formula integration", () => {
    it("should combine all three factors correctly in realistic scenario", () => {
      // User with good constraint fit, mediocre similar cases, and high motivation
      const score = calculateConfidence(0.9, 0.4, 0.9);

      // (0.9 * 0.4) + (0.4 * 0.4) + (0.9 * 0.2)
      // = 0.36 + 0.16 + 0.18 = 0.70
      expect(score).toBeCloseTo(0.7, 5);
    });

    it("should rank plans by confidence score", () => {
      const plan1 = calculateConfidence(0.8, 0.8, 0.5); // Very good fit
      const plan2 = calculateConfidence(0.5, 0.5, 0.5); // Medium
      const plan3 = calculateConfidence(0.2, 0.2, 0.2); // Poor fit

      expect(plan1).toBeGreaterThan(plan2);
      expect(plan2).toBeGreaterThan(plan3);
    });
  });
});
