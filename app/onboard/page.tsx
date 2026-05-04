"use client";

import { useRouter } from "next/navigation";
import { OnboardWizard } from "@/components/onboard/OnboardWizard";

export default function OnboardPage() {
  const router = useRouter();

  const handleConversationComplete = (sessionId: string) => {
    // Save session ID and navigate to plan generation
    sessionStorage.setItem("habitforge_session", sessionId);
    router.push(`/results?session=${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: "Fraunces" }}>
            Forge Your Habit
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Let's build a personalized habit plan grounded in behavioral psychology.
          </p>
        </div>

        <OnboardWizard onConversationComplete={handleConversationComplete} />
      </div>
    </div>
  );
}
