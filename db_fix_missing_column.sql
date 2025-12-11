-- Migration to ensure category_id exists in transactions table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- Check if category_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'category_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE transactions 
        ADD COLUMN category_id UUID REFERENCES transaction_categories(id);
        
        RAISE NOTICE 'Added category_id column to transactions table';
    ELSE
        RAISE NOTICE 'category_id column already exists';
    END IF;
END $$;

-- Force a schema cache reload via SQL if possible (Supabase specific)
NOTIFY pgrst, 'reload config';
