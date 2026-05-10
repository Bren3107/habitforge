/**
 * Typed API client for all HabitForge endpoints
 * Provides type-safe fetch wrappers for conversation, plan, tracking, and gamification APIs
 */

import type { HabitPlan, QuestionResponse } from "@/lib/ai/llm";

// Types for API requests and responses

export interface StartConversationRequest {
  goal: string;
  motivation: string;
  constraints?: Record<string, unknown>;
  category?: "fitness" | "productivity" | "learning";
}

export interface StartConversationResponse {
  sessionId: string;
  question: string | null;
  context_complete: boolean;
  suggestions: string[];
  greeting: string;
}

export interface RespondToQuestionRequest {
  sessionId: string;
  user_answer: string;
}

export interface RespondToQuestionResponse {
  question: string | null;
  context_complete: boolean;
  suggestions: string[];
}

export interface GeneratePlanRequest {
  sessionId: string;
  category?: "fitness" | "productivity" | "learning";
}

export interface GeneratePlanResponse {
  plan: HabitPlan;
  planId: string;
  userId: string;
  category: string;
  principles_used: string[];
  message: string;
  confidenceScore: number;
  confidenceLevel: string;
}

export interface GetPlanResponse {
  plan: HabitPlan;
  planCreatedAt: string;
  category: string;
  principles_used: string[];
  confidenceScore: number;
  confidenceLevel: string;
}

export interface RefinePlanRequest {
  sessionId: string;
  updated_constraints?: Record<string, unknown>;
  category?: "fitness" | "productivity" | "learning";
}

export interface RefinePlanResponse {
  plan: HabitPlan;
  category: string;
  principles_used: string[];
  message: string;
}

export interface CheckInRequest {
  userId: string;
  planId: string;
  date: string;
  completed: boolean;
  notes?: string;
}

export interface CheckInResponse {
  xp_earned: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  new_badges: string[];
  level: string;
}

export interface LevelProgressData {
  level: string;
  nextLevel: string;
  current: number;
  threshold: number;
}

export interface HistoryEntry {
  date: string;
  completed: boolean;
  xp_earned: number;
}

export interface GamificationResponse {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  badges: string[];
  level: string;
  level_progress: LevelProgressData;
  history: HistoryEntry[];
}

// Utility function for API calls with error handling
async function apiCall<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: unknown
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(
      error.error || `API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// Conversation API
export const conversationAPI = {
  start: (req: StartConversationRequest): Promise<StartConversationResponse> =>
    apiCall("/api/conversation/start", "POST", req),

  respond: (req: RespondToQuestionRequest): Promise<RespondToQuestionResponse> =>
    apiCall("/api/conversation/respond", "POST", req),
};

// Plan API
export const planAPI = {
  generate: (req: GeneratePlanRequest): Promise<GeneratePlanResponse> =>
    apiCall("/api/plan/generate", "POST", req),

  get: (planId: string): Promise<GetPlanResponse> =>
    apiCall(`/api/plan/${planId}`, "GET"),

  refine: (req: RefinePlanRequest): Promise<RefinePlanResponse> =>
    apiCall("/api/plan/refine", "POST", req),
};

// Tracking API
export const trackingAPI = {
  checkin: (req: CheckInRequest): Promise<CheckInResponse> =>
    apiCall("/api/tracking/checkin", "POST", req),
};

// Gamification API
export const gamificationAPI = {
  getStats: (userId: string, planId?: string): Promise<GamificationResponse> =>
    apiCall(`/api/gamification/${userId}${planId ? `?planId=${encodeURIComponent(planId)}` : ""}`, "GET"),
};

// Coaching API
export interface WeeklyCoachingResponse {
  message: string | null;
  weekNumber: number;
  cached?: boolean;
  reason?: string;
}

export const coachingAPI = {
  getWeeklyMessage: (userId: string, planId: string): Promise<WeeklyCoachingResponse> =>
    apiCall(`/api/coaching/weekly?userId=${encodeURIComponent(userId)}&planId=${encodeURIComponent(planId)}`, "GET"),
};

// Plan adaptation
export interface AdaptPlanRequest {
  userId: string;
  planId: string;
  direction: "simplify" | "level_up";
}

export interface AdaptPlanResponse {
  plan: import("@/lib/ai/llm").HabitPlan;
  planId: string;
  direction: string;
  message: string;
}

export const adaptAPI = {
  adapt: (req: AdaptPlanRequest): Promise<AdaptPlanResponse> =>
    apiCall("/api/plan/adapt", "POST", req),
};
