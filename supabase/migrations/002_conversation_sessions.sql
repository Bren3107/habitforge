-- Conversation sessions for onboarding flow
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id TEXT PRIMARY KEY,
  user_context JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS conversation_sessions_last_accessed_idx
  ON conversation_sessions(last_accessed);

-- Allow service role full access
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON conversation_sessions FOR ALL USING (true);
