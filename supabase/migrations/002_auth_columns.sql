-- Make session_token nullable (auth users won't have one)
ALTER TABLE users ALTER COLUMN session_token DROP NOT NULL;

-- Add identity columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
