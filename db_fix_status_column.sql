-- Add status column to transactions table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'status') THEN
        ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed'));
        RAISE NOTICE 'Added status column';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
