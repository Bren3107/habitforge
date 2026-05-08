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
}

export interface RespondToQuestionRequest {
  sessionId: string;
  user_answer: string;
}

export interface RespondToQuestionResponse {
  question: string | null;
  context_complete: boolean;
}

export interface GeneratePlanRequest {
  sessionId: string;
  category?: "fitness" | "productivity" | "learning";
}

export interface GeneratePlanResponse {
  plan: HabitPlan;
  planId: string;
  category: string;
  principles_used: string[];
  message: string;
}

export interface GetPlanResponse {
  plan: HabitPlan;
  category: string;
  principles_used: string[];
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
  completed: boolean;
  notes?: string;
}

export interface CheckInResponse {
  xp_earned: number;
  total_xp: number;
  streak: number;
  badges_unlocked: string[];
}

export interface GamificationResponse {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  badges: string[];
  level: "rookie" | "explorer" | "achiever" | "master" | "legend";
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
  getStats: (userId: string): Promise<GamificationResponse> =>
    apiCall(`/api/gamification/${userId}`, "GET"),
};
