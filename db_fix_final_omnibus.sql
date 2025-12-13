-- OMNIBUS FIX: COMPLETE RLS RESET
-- This script addresses all potential failure points:
-- 1. Recursion: Uses direct JWT access (memory) instead of DB queries.
-- 2. Dependencies: Uses dynamic SQL to drop ALL policies on 'profiles', regardless of name.
-- 3. Case Sensitivity: Uses ILIKE for email checks.
-- 4. Caching: Forces a schema cache reload at the end.

BEGIN;

-- 1. Disable RLS temporarily to ensure we can operate
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies on 'profiles' dynamically
-- This ensures no "hidden" policies with different names are left behind causing recursion.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. Drop ALL policies on 'families' and 'family_members' dynamically
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'families' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON families', pol.policyname);
    END LOOP;
END $$;

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'family_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON family_members', pol.policyname);
    END LOOP;
END $$;

-- 4. Drop the problematic function and any dependents
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- 5. Create ROBUST, NON-RECURSIVE Policies for Profiles
-- A. View/Select: Users see themselves OR Admin (via JWT Email) sees everyone.
CREATE POLICY "Profiles View Policy" ON profiles
FOR SELECT USING (
  auth.uid() = id 
  OR 
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- B. Update: Users update themselves OR Admin updates everyone.
CREATE POLICY "Profiles Update Policy" ON profiles
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- C. Insert: Users insert themselves.
CREATE POLICY "Profiles Insert Policy" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 6. Create Simple Admin Policies for Families
-- Admins can see everything.
CREATE POLICY "Admin All Families" ON families
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

CREATE POLICY "Admin All Members" ON family_members
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- 7. Restore User Access for Families (Standard Logic)
-- Users verify membership by checking the table directly (Standard RLS)
-- Note: To avoid recursion here, we ensure we don't query 'profiles' inside these policies.
CREATE POLICY "User View Families" ON families
FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_members WHERE family_id = id AND user_id = auth.uid())
);

CREATE POLICY "User View Members" ON family_members
FOR SELECT USING (
  EXISTS (SELECT 1 FROM family_members WHERE family_id = family_members.family_id AND user_id = auth.uid())
);

-- 8. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 9. Force Cache Refresh
NOTIFY pgrst, 'reload config';

COMMIT;
