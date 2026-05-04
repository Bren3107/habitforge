"use client";

interface StepMotivationProps {
  value: string;
  onChange: (value: string) => void;
}

export function StepMotivation({ value, onChange }: StepMotivationProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[var(--text-primary)] font-semibold mb-2 text-lg">
          Why does this matter to you?
        </label>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          What will change in your life? Why is this the right time to build this habit?
        </p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="I want this because..."
          className="w-full px-4 py-3 bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-ember)] resize-none"
          rows={3}
        />
      </div>

      <div className="p-4 bg-[var(--bg-raised)] rounded-lg border border-[var(--border)]">
        <p className="text-[var(--text-secondary)] text-sm">
          <span className="font-semibold text-[var(--accent-ember)]">🔥 The secret:</span> Habits stick when
          they're tied to deeper values. Think long-term impact, not just the
          action.
        </p>
      </div>
    </div>
  );
}
