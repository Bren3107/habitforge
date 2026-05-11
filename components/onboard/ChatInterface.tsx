"use client";

import { useEffect, useRef, useState } from "react";
import { useConversation } from "@/hooks/useConversation";

const TOTAL_QUESTIONS = 4;
const GREETING = "Let's build something that actually sticks.";

interface ChatInterfaceProps {
  sessionId: string | null;
  initialQuestion: string | null;
  initialSuggestions?: string[];
  onComplete: () => void;
  onError: (error: string) => void;
}

export function ChatInterface({
  sessionId,
  initialQuestion,
  initialSuggestions = [],
  onComplete,
  onError,
}: ChatInterfaceProps) {
  const { state, respondToQuestion } = useConversation();
  const [userAnswer, setUserAnswer] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "assistant" | "user"; content: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with first question
  useEffect(() => {
    if (sessionId && initialQuestion) {
      setChatHistory([{ role: "assistant", content: initialQuestion }]);
    }
  }, [sessionId, initialQuestion]);

  // Add new questions as they arrive and update suggestions
  useEffect(() => {
    if (
      state.currentQuestion &&
      !chatHistory.some((m) => m.content === state.currentQuestion)
    ) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: state.currentQuestion || "" },
      ]);
      setSuggestions(state.suggestions);
    }
  }, [state.currentQuestion, state.suggestions, chatHistory]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, state.status]);

  // Trigger completion
  useEffect(() => {
    if (state.context_complete && state.status === "complete") {
      onComplete();
    }
  }, [state.context_complete, state.status, onComplete]);

  // Surface errors
  useEffect(() => {
    if (state.error) {
      onError(state.error);
    }
  }, [state.error, onError]);

  const questionNumber = Math.min(
    chatHistory.filter((m) => m.role === "assistant").length,
    TOTAL_QUESTIONS
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !sessionId) return;

    const answer = userAnswer.trim();
    setChatHistory((prev) => [...prev, { role: "user", content: answer }]);
    setUserAnswer("");
    setSuggestions([]); // Optimistic clear while loading

    try {
      await respondToQuestion(sessionId, answer);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to process response";
      onError(errorMsg);
    }
  };

  const handleChipClick = (chip: string) => {
    setUserAnswer(chip);
  };

  const isTyping = userAnswer.length > 0;

  return (
    <div className="flex flex-col min-h-[300px] max-h-[60vh] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[var(--text-secondary)]">
          Question {questionNumber} of {TOTAL_QUESTIONS}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < questionNumber
                  ? "bg-[var(--accent-ember)]"
                  : "bg-[var(--bg-raised)] border border-[var(--border)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {/* One-time greeting above first question */}
        <p className="text-xs text-[var(--text-secondary)] italic">{GREETING}</p>

        {chatHistory.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-sm px-4 py-2 rounded-lg ${
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
            <div className="bg-[var(--bg-raised)] text-[var(--text-secondary)] px-4 py-2 rounded-lg border border-[var(--border)] animate-pulse">
              <p className="text-sm">Crafting your next question...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!state.context_complete && (
        <div>
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
              disabled={state.status === "loading" || !userAnswer.trim() || !sessionId}
              className="px-6 py-2 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-semibold hover:bg-[var(--accent-fire)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>

          {/* Suggestion chips */}
          {suggestions.length > 0 && !isTyping && (
            <div className="flex gap-2 flex-wrap mt-3">
              {suggestions.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="text-xs px-3 py-1 rounded-full border border-[var(--accent-ember)] border-opacity-40 text-[var(--text-secondary)] hover:border-opacity-100 hover:text-[var(--text-primary)] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete state */}
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
