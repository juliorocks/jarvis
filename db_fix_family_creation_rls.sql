-- Fix RLS to allow Family Creation
-- New users need to be able to create a family and add themselves to it.

-- 1. Policies for families
DROP POLICY IF EXISTS "Users can insert families" ON families;
CREATE POLICY "Users can insert families" ON families
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 2. Policies for family_members
-- Allow users to add themselves to a family (needed when creating one)
DROP POLICY IF EXISTS "Users can join families" ON family_members;
CREATE POLICY "Users can join families" ON family_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Force refresh
NOTIFY pgrst, 'reload config';
