/**
 * Confidence scoring module
 *
 * Calculates a weighted confidence score for generated habit plans based on:
 * - Constraint fit (how well plan matches user's constraints)
 * - Similar case success (how similar top cases are)
 * - Motivation sentiment (intrinsic motivation level)
 */

/**
 * Weighted scoring formula:
 * confidence = (constraint_fit × 0.4) + (similar_case_success × 0.4) + (motivation_sentiment × 0.2)
 *
 * - constraint_fit: 0.0–1.0, how well plan matches user's constraints (ease, time, energy)
 * - similar_case_success: 0.0–1.0, how similar top cases are (1 - avg distance from embeddings)
 * - motivation_sentiment: 0.0–1.0, intrinsic motivation level inferred from conversation
 *
 * @param fit - Constraint fit score (0.0-1.0)
 * @param similarity - Similar case success score (0.0-1.0)
 * @param motivation - Motivation sentiment score (0.0-1.0)
 * @returns Confidence score between 0.0 and 1.0
 */
export function calculateConfidence(
  fit: number,
  similarity: number,
  motivation: number
): number {
  // Validate inputs
  const constraintFit = clamp(fit, 0.0, 1.0);
  const similarCaseSuccess = clamp(similarity, 0.0, 1.0);
  const motivationSentiment = clamp(motivation, 0.0, 1.0);

  // Apply weighted formula
  const confidence =
    constraintFit * 0.4 + similarCaseSuccess * 0.4 + motivationSentiment * 0.2;

  // Ensure result is within bounds
  return clamp(confidence, 0.0, 1.0);
}

/**
 * Clamp a value between min and max bounds
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert similarity distance to success score
 * Since pgvector's <-> operator returns distance (0 = identical, 2 = opposite),
 * this converts it to a success score where 1.0 = best match
 *
 * Distance mapping: 0 -> 1.0 (identical), 1 -> 0.0 (orthogonal), 2 -> -1.0 (opposite)
 * For a success score we clamp to [0, 1], so: 1.0 - (distance / 2)
 *
 * @param distance - Cosine distance from pgvector (0-2)
 * @returns Success score (0.0-1.0)
 */
export function distanceToSuccessScore(distance: number): number {
  // Convert distance to similarity score
  // Cosine distance ranges from 0 (identical) to 2 (opposite)
  // We map: 0 -> 1.0, 1 -> 0.5, 2 -> 0.0
  const successScore = Math.max(0, 1 - distance / 2);
  return clamp(successScore, 0.0, 1.0);
}

/**
 * Calculate average distance to success score for multiple similar cases
 *
 * @param distances - Array of cosine distances
 * @returns Average success score (0.0-1.0)
 */
export function averageDistancesToSuccessScore(distances: number[]): number {
  if (distances.length === 0) {
    return 0.5; // Neutral score if no cases
  }

  const averageDistance =
    distances.reduce((sum, d) => sum + d, 0) / distances.length;
  return distanceToSuccessScore(averageDistance);
}

/**
 * Interpret confidence level for presentation
 */
export function confidenceLevel(score: number): string {
  if (score >= 0.8) return "Very High";
  if (score >= 0.6) return "High";
  if (score >= 0.4) return "Medium";
  if (score >= 0.2) return "Low";
  return "Very Low";
}

/**
 * Calculate constraint fit score based on matching applicable_when constraints
 *
 * @param userConstraints - User's stated constraints (e.g., ["low_time", "low_energy"])
 * @param principleApplicableWhen - Principle's applicable_when tags
 * @returns Fit score (0.0-1.0)
 */
export function calculateConstraintFit(
  userConstraints: string[],
  principleApplicableWhen: string[]
): number {
  if (userConstraints.length === 0) {
    return 0.5; // Neutral if no constraints specified
  }

  if (principleApplicableWhen.length === 0) {
    return 0.0;
  }

  // Check if principle has "general" applicability
  if (principleApplicableWhen.includes("general")) {
    return 0.8; // High fit for general applicability
  }

  // Count how many user constraints are in principle's applicable_when
  const userConstraintSet = new Set(userConstraints);
  const matchingConstraints = principleApplicableWhen.filter((constraint) =>
    userConstraintSet.has(constraint)
  ).length;

  // Fit score = matching constraints / user constraints
  // This rewards principles that match more of the user's stated constraints
  return matchingConstraints / userConstraints.length;
}

/**
 * Estimate motivation sentiment from user input
 * This is a simple heuristic based on keywords
 *
 * @param userInput - User's stated goal or motivation
 * @returns Motivation score (0.0-1.0)
 */
export function estimateMotivationSentiment(userInput: string): number {
  const input = userInput.toLowerCase();

  // Positive motivation keywords
  const positiveKeywords = [
    "excited",
    "motivated",
    "determined",
    "want to",
    "looking forward",
    "passionate",
    "love",
    "eager",
    "thrilled",
    "confident",
    "really want",
    "definitely",
    "goal",
    "improve",
    "better",
    "challenge",
  ];

  // Negative motivation keywords
  const negativeKeywords = [
    "struggling",
    "don't",
    "can't",
    "too hard",
    "tired",
    "impossible",
    "never",
    "fail",
    "hard time",
    "no energy",
    "unmotivated",
    "reluctant",
    "forced",
  ];

  let score = 0.5; // Neutral baseline

  // Count positive keywords
  const positiveCount = positiveKeywords.filter((keyword) =>
    input.includes(keyword)
  ).length;

  // Count negative keywords
  const negativeCount = negativeKeywords.filter((keyword) =>
    input.includes(keyword)
  ).length;

  // Adjust score based on keyword counts
  score += positiveCount * 0.1;
  score -= negativeCount * 0.1;

  return clamp(score, 0.0, 1.0);
}

/**
 * Score intrinsic motivation factors based on principle characteristics
 *
 * @param principle - Principle object or applicable_when tags
 * @returns Motivation alignment score (0.0-1.0)
 */
export function scorePrincipleMotivationFit(
  applicableWhen: string[]
): number {
  const motivationPositiveFactors = [
    "high_motivation",
    "high_self_efficacy",
    "high_energy",
    "high_consistency",
    "social_support_available",
  ];

  const matchingFactors = applicableWhen.filter((tag) =>
    motivationPositiveFactors.includes(tag)
  ).length;

  return Math.min(0.9, (matchingFactors / motivationPositiveFactors.length) * 1.2);
}
