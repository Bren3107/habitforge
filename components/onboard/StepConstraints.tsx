"use client";

interface StepConstraintsProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function StepConstraints({ value, onChange }: StepConstraintsProps) {
  const v = value as any;
  return (
    <div className="space-y-6">
      {/* Daily Time */}
      <div>
        <label className="block text-[var(--text-primary)] font-semibold mb-2">
          How much time can you dedicate daily?
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={v.daily_time_minutes || 30}
            onChange={(e) =>
              onChange({
                ...value,
                daily_time_minutes: parseInt(e.target.value),
              })
            }
            className="flex-1 h-2 bg-[var(--bg-raised)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-ember)]"
          />
          <span className="text-[var(--text-primary)] font-semibold w-12 text-right">
            {v.daily_time_minutes || 30} min
          </span>
        </div>
      </div>

      {/* Energy Level */}
      <div>
        <label className="block text-[var(--text-primary)] font-semibold mb-3">
          Typical energy level?
        </label>
        <div className="flex gap-3">
          {(["low", "moderate", "high"] as const).map((level) => (
            <button
              key={level}
              onClick={() => onChange({ ...value, energy_level: level })}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                v.energy_level === level
                  ? "bg-[var(--accent-ember)] text-[var(--bg-base)]"
                  : "bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent-ember)]"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <label className="block text-[var(--text-primary)] font-semibold mb-2">
          Available resources (gym, tools, space, etc.)
        </label>
        <input
          type="text"
          value={v.equipment_available || ""}
          onChange={(e) =>
            onChange({ ...value, equipment_available: e.target.value })
          }
          placeholder="e.g., home gym, quiet space, computer"
          className="w-full px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-ember)]"
        />
      </div>

      {/* Schedule Pattern */}
      <div>
        <label className="block text-[var(--text-primary)] font-semibold mb-2">
          When do you typically have energy? (e.g., mornings, after work)
        </label>
        <input
          type="text"
          value={v.schedule_pattern || ""}
          onChange={(e) =>
            onChange({ ...value, schedule_pattern: e.target.value })
          }
          placeholder="e.g., 6-7am before work, 6-8pm after kids sleep"
          className="w-full px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-ember)]"
        />
      </div>

      <div className="p-4 bg-[var(--bg-raised)] rounded-lg border border-[var(--border)]">
        <p className="text-[var(--text-secondary)] text-sm">
          <span className="font-semibold text-[var(--accent-gold)]">⚒️ Forging constraints into strength:</span> These
          honest inputs help us build a plan that actually fits your life—not
          an idealized version.
        </p>
      </div>
    </div>
  );
}
