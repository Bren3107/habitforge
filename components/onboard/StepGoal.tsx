"use client";

import { useState } from "react";

interface StepGoalProps {
  value: string;
  onChange: (value: string) => void;
}

export function StepGoal({ value, onChange }: StepGoalProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[var(--text-primary)] font-semibold mb-2">
          What habit do you want to build?
        </label>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          Be specific. Examples: "Exercise 3x per week", "Read 30 minutes daily",
          "Complete 2 deep work sessions"
        </p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="I want to..."
          className="w-full px-4 py-3 bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-ember)] resize-none"
          rows={3}
        />
      </div>

      <div className="p-4 bg-[var(--bg-raised)] rounded-lg border border-[var(--border)]">
        <p className="text-[var(--text-secondary)] text-sm">
          <span className="font-semibold text-[var(--accent-ember)]">💡 Tip:</span> Specific goals are
          easier to build into habits. "Exercise regularly" vs "Walk 30 mins on
          weekday mornings"
        </p>
      </div>
    </div>
  );
}
