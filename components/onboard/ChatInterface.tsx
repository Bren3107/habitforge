"use client";

/**
 * ChatInterface - Step 4 of onboarding wizard
 * Displays Claude's follow-up questions and captures user answers
 */

import { useEffect, useRef, useState } from "react";
import { useConversation } from "@/hooks/useConversation";

interface ChatInterfaceProps {
  sessionId: string | null;
  onComplete: () => void;
  onError: (error: string) => void;
}

export function ChatInterface({
  sessionId,
  onComplete,
  onError,
}: ChatInterfaceProps) {
  const { state, respondToQuestion, reset } = useConversation();
  const [userAnswer, setUserAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "assistant" | "user"; content: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with session
  useEffect(() => {
    if (sessionId && state.status === "idle") {
      setChatHistory([]);
    }
  }, [sessionId, state.status]);

  // Add initial question to chat
  useEffect(() => {
    if (
      state.currentQuestion &&
      !chatHistory.some((m) => m.content === state.currentQuestion)
    ) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: state.currentQuestion || "" },
      ]);
    }
  }, [state.currentQuestion, chatHistory]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle context complete
  useEffect(() => {
    if (state.context_complete && state.status === "complete") {
      onComplete();
    }
  }, [state.context_complete, state.status, onComplete]);

  // Handle errors
  useEffect(() => {
    if (state.error) {
      onError(state.error);
    }
  }, [state.error, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userAnswer.trim() || !sessionId) return;

    // Add user message to chat
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userAnswer },
    ]);
    setUserAnswer("");

    // Get next question
    try {
      await respondToQuestion(sessionId, userAnswer);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to process response";
      onError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {chatHistory.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-[var(--accent-ember)] text-[var(--bg-base)]"
                  : "bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border)]"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}

        {state.status === "loading" && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-raised)] text-[var(--text-secondary)] px-4 py-2 rounded-lg border border-[var(--border)]">
              <p className="text-sm">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      {!state.context_complete && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Your answer..."
            disabled={state.status === "loading"}
            className="flex-1 px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-ember)]"
          />
          <button
            type="submit"
            disabled={
              state.status === "loading" || !userAnswer.trim() || !sessionId
            }
            className="px-6 py-2 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-semibold hover:bg-[var(--accent-fire)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      )}

      {/* Complete State */}
      {state.context_complete && state.status === "complete" && (
        <div className="text-center p-4 bg-[var(--bg-raised)] rounded-lg border border-[var(--border)]">
          <p className="text-[var(--text-primary)] font-semibold">
            ✓ Ready to generate your personalized plan!
          </p>
        </div>
      )}
    </div>
  );
}
