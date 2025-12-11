-- Comprehensive Column Fix for Transactions Table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Ensure wallet_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'wallet_id') THEN
        ALTER TABLE transactions ADD COLUMN wallet_id UUID REFERENCES wallets(id);
        RAISE NOTICE 'Added wallet_id column';
    END IF;

    -- 2. Ensure credit_card_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'credit_card_id') THEN
        ALTER TABLE transactions ADD COLUMN credit_card_id UUID REFERENCES credit_cards(id);
        RAISE NOTICE 'Added credit_card_id column';
    END IF;

    -- 3. Ensure category_id exists (Redundant if you ran the previous one, but safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'category_id') THEN
        ALTER TABLE transactions ADD COLUMN category_id UUID REFERENCES transaction_categories(id);
        RAISE NOTICE 'Added category_id column';
    END IF;

    -- 4. Ensure description exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'description') THEN
        ALTER TABLE transactions ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;

    -- 5. Add check constraint (if not already there - hard to check constraint existence easily in DO block without complex query, skipping constraint check for now as it's optional for functionality)
    
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
