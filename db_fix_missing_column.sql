-- ENSURE created_at EXISTS
-- This script adds the column if it's missing, preventing the sort error.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Populate NULLs just in case
UPDATE profiles SET created_at = NOW() WHERE created_at IS NULL;

-- Also verify Safe Mode RLS is active
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
