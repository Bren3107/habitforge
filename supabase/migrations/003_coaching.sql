-- Add parent_plan_id to habit_plans for tracking plan adaptation lineage
ALTER TABLE habit_plans
  ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES habit_plans(id) ON DELETE SET NULL;

-- Coaching messages cached per user per week
CREATE TABLE IF NOT EXISTS coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES habit_plans(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  message TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, plan_id, week_number)
);
