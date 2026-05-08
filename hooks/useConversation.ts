/**
 * useConversation - Manages conversation flow during onboarding
 * Handles state machine: idle → started → answering questions → complete
 */

import { useState, useCallback } from "react";
import { conversationAPI } from "@/lib/api";
import type { StartConversationRequest } from "@/lib/api";

export interface ConversationState {
  status: "idle" | "loading" | "answering" | "complete" | "error";
  sessionId: string | null;
  currentQuestion: string | null;
  context_complete: boolean;
  suggestions: string[];
  error: string | null;
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>({
    status: "idle",
    sessionId: null,
    currentQuestion: null,
    context_complete: false,
    suggestions: [],
    error: null,
  });

  const startConversation = useCallback(
    async (request: StartConversationRequest) => {
      setState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const response = await conversationAPI.start(request);

        setState((prev) => ({
          ...prev,
          status: response.context_complete ? "complete" : "answering",
          sessionId: response.sessionId,
          currentQuestion: response.question,
          context_complete: response.context_complete,
        }));

        return response;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to start conversation";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMsg,
        }));
        throw error;
      }
    },
    []
  );

  const respondToQuestion = useCallback(
    async (sessionId: string, answer: string) => {
      setState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const response = await conversationAPI.respond({
          sessionId,
          user_answer: answer,
        });

        setState((prev) => ({
          ...prev,
          status: response.context_complete ? "complete" : "answering",
          currentQuestion: response.question,
          context_complete: response.context_complete,
          suggestions: response.suggestions ?? [],
        }));

        return response;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to process response";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMsg,
        }));
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      sessionId: null,
      currentQuestion: null,
      context_complete: false,
      suggestions: [],
      error: null,
    });
  }, []);

  return {
    state,
    startConversation,
    respondToQuestion,
    reset,
  };
}
