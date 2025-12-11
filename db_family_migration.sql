-- Family Sharing Migration Script

-- 1. Create Core Family Tables
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS family_members (
    family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (family_id, user_id)
);

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    invited_by UUID REFERENCES auth.users(id)
);

-- 2. Add family_id to existing tables
-- We use DO blocks to avoid errors if columns already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'family_id') THEN
        ALTER TABLE wallets ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'family_id') THEN
        ALTER TABLE transactions ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transaction_categories' AND column_name = 'family_id') THEN
        ALTER TABLE transaction_categories ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_cards' AND column_name = 'family_id') THEN
        ALTER TABLE credit_cards ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Data Migration: Create Families for existing users and link data
-- This is a one-time operation for existing data
DO $$
DECLARE 
    temp_user RECORD;
    temp_family_id UUID;
BEGIN
    FOR temp_user IN SELECT DISTINCT user_id FROM wallets UNION SELECT DISTINCT user_id FROM transactions LOOP
        -- check if user already has a family created in a previous run (optional, but good for idempotency)
        SELECT id INTO temp_family_id FROM families WHERE owner_id = temp_user.user_id LIMIT 1;
        
        IF temp_family_id IS NULL THEN
            INSERT INTO families (name, owner_id) VALUES ('Minha Família', temp_user.user_id) RETURNING id INTO temp_family_id;
            INSERT INTO family_members (family_id, user_id, role) VALUES (temp_family_id, temp_user.user_id, 'owner');
        END IF;

        -- Migrar dados
        UPDATE wallets SET family_id = temp_family_id WHERE user_id = temp_user.user_id AND family_id IS NULL;
        UPDATE transactions SET family_id = temp_family_id WHERE user_id = temp_user.user_id AND family_id IS NULL;
        UPDATE transaction_categories SET family_id = temp_family_id WHERE user_id = temp_user.user_id AND family_id IS NULL;
        UPDATE credit_cards SET family_id = temp_family_id WHERE user_id = temp_user.user_id AND family_id IS NULL;
    END LOOP;
END $$;

-- 4. Enable RLS on new tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Helper function to check membership (performance optimization)
CREATE OR REPLACE FUNCTION is_family_member(param_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members WHERE family_id = param_family_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Families
DROP POLICY IF EXISTS "Users can view their families" ON families;
CREATE POLICY "Users can view their families" ON families
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM family_members WHERE family_id = families.id AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their families" ON families;
CREATE POLICY "Users can update their families" ON families
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM family_members WHERE family_id = families.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Policies for Members
DROP POLICY IF EXISTS "Users can view members of their families" ON family_members;
CREATE POLICY "Users can view members of their families" ON family_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM family_members fm WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid())
    );

-- UPDATED Policies for functional tables (Wallets, Transactions, etc.)
-- We drop old policies and add new family-based ones

-- Wallets
DROP POLICY IF EXISTS "Users can view their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can insert their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can delete their own wallets" ON wallets;

CREATE POLICY "Family members can view wallets" ON wallets
    FOR SELECT USING (is_family_member(family_id));

CREATE POLICY "Family members can insert wallets" ON wallets
    FOR INSERT WITH CHECK (is_family_member(family_id));

CREATE POLICY "Family members can update wallets" ON wallets
    FOR UPDATE USING (is_family_member(family_id));

CREATE POLICY "Family members can delete wallets" ON wallets
    FOR DELETE USING (is_family_member(family_id));


-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

CREATE POLICY "Family members can view transactions" ON transactions
    FOR SELECT USING (is_family_member(family_id));

CREATE POLICY "Family members can insert transactions" ON transactions
    FOR INSERT WITH CHECK (is_family_member(family_id));

CREATE POLICY "Family members can update transactions" ON transactions
    FOR UPDATE USING (is_family_member(family_id));

CREATE POLICY "Family members can delete transactions" ON transactions
    FOR DELETE USING (is_family_member(family_id));


-- Categories
DROP POLICY IF EXISTS "Users can view their own categories" ON transaction_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON transaction_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON transaction_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON transaction_categories;

CREATE POLICY "Family members can view categories" ON transaction_categories
    FOR SELECT USING (is_family_member(family_id));

CREATE POLICY "Family members can insert categories" ON transaction_categories
    FOR INSERT WITH CHECK (is_family_member(family_id));

-- Credit Cards
DROP POLICY IF EXISTS "Users can view their own credit cards" ON credit_cards;
DROP POLICY IF EXISTS "Users can insert their own credit cards" ON credit_cards;
DROP POLICY IF EXISTS "Users can update their own credit cards" ON credit_cards;
DROP POLICY IF EXISTS "Users can delete their own credit cards" ON credit_cards;

CREATE POLICY "Family members can view credit cards" ON credit_cards
    FOR SELECT USING (is_family_member(family_id));

CREATE POLICY "Family members can insert credit cards" ON credit_cards
    FOR INSERT WITH CHECK (is_family_member(family_id));

CREATE POLICY "Family members can update credit cards" ON credit_cards
    FOR UPDATE USING (is_family_member(family_id));

CREATE POLICY "Family members can delete credit cards" ON credit_cards
    FOR DELETE USING (is_family_member(family_id));

-- Force refresh
NOTIFY pgrst, 'reload config';
