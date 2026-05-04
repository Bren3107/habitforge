"use client";

import { useState, useEffect } from "react";
import { useConversation } from "@/hooks/useConversation";
import { conversationAPI } from "@/lib/api";
import type { StartConversationRequest } from "@/lib/api";
import { StepGoal } from "./StepGoal";
import { StepMotivation } from "./StepMotivation";
import { StepConstraints } from "./StepConstraints";
import { ChatInterface } from "./ChatInterface";

type Step = "goal" | "motivation" | "constraints" | "chat";

interface OnboardWizardProps {
  onConversationComplete: (sessionId: string) => void;
}

export function OnboardWizard({
  onConversationComplete,
}: OnboardWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("goal");
  const [goal, setGoal] = useState("");
  const [motivation, setMotivation] = useState("");
  const [constraints, setConstraints] = useState<Record<string, unknown>>({
    daily_time_minutes: 30,
    energy_level: "moderate",
    equipment_available: "",
    schedule_pattern: "",
  });
  const [category, setCategory] = useState<"fitness" | "productivity" | "learning">(
    "fitness"
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const steps: Step[] = ["goal", "motivation", "constraints", "chat"];
  const currentStepIndex = steps.indexOf(currentStep);

  const canProceed =
    (currentStep === "goal" && goal.trim().length > 0) ||
    (currentStep === "motivation" && motivation.trim().length > 0) ||
    (currentStep === "constraints" && constraints.daily_time_minutes) ||
    currentStep === "chat";

  const handleNext = async () => {
    if (currentStep === "constraints") {
      // Start conversation with collected data
      setIsLoading(true);
      setError(null);

      try {
        const request: StartConversationRequest = {
          goal,
          motivation,
          constraints,
          category,
        };

        const response = await conversationAPI.start(request);
        setSessionId(response.sessionId);
        setCurrentStep("chat");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to start conversation";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0 && prevIndex < steps.length) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleChatComplete = () => {
    if (sessionId) {
      onConversationComplete(sessionId);
    }
  };

  const handleChatError = (msg: string) => {
    setError(msg);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  idx <= currentStepIndex
                    ? "bg-[var(--accent-ember)] text-[var(--bg-base)]"
                    : "bg-[var(--bg-raised)] text-[var(--text-secondary)] border border-[var(--border)]"
                }`}
              >
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    idx < currentStepIndex
                      ? "bg-[var(--accent-ember)]"
                      : "bg-[var(--bg-raised)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-[var(--text-secondary)] text-sm">
          {currentStep === "goal" && "What habit do you want to build?"}
          {currentStep === "motivation" && "Why does this matter?"}
          {currentStep === "constraints" && "Let's talk about your reality"}
          {currentStep === "chat" && "Final questions to personalize your plan"}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-[var(--error)] bg-opacity-10 border border-[var(--error)] rounded-lg">
          <p className="text-[var(--error)] text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm text-[var(--error)] underline mt-2 hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="mb-8 min-h-[300px]">
        {currentStep === "goal" && (
          <StepGoal value={goal} onChange={setGoal} />
        )}
        {currentStep === "motivation" && (
          <StepMotivation value={motivation} onChange={setMotivation} />
        )}
        {currentStep === "constraints" && (
          <>
            <div className="mb-6">
              <label className="block text-[var(--text-primary)] font-semibold mb-3">
                Which category?
              </label>
              <div className="flex gap-2">
                {(["fitness", "productivity", "learning"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      category === cat
                        ? "bg-[var(--accent-ember)] text-[var(--bg-base)]"
                        : "bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border)]"
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <StepConstraints value={constraints} onChange={setConstraints} />
          </>
        )}
        {currentStep === "chat" && sessionId && (
          <ChatInterface
            sessionId={sessionId}
            onComplete={handleChatComplete}
            onError={handleChatError}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep !== "chat" && (
        <div className="flex justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="px-6 py-2 bg-[var(--bg-raised)] text-[var(--text-primary)] rounded-lg font-semibold border border-[var(--border)] hover:border-[var(--accent-ember)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            className="px-6 py-2 bg-[var(--accent-ember)] text-[var(--bg-base)] rounded-lg font-semibold hover:bg-[var(--accent-fire)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Starting..." : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
