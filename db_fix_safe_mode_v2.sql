-- SAFE MODE V2: Complete Reset of RLS
-- This script effectively "Turns Off and On" the security system with a clean slate.

BEGIN;

-- 1. Disable RLS temporarily on all affected tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies dynamically to ensure no hidden recursion remains
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('profiles', 'families', 'family_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. Drop potentially recursive functions just in case
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_member(UUID) CASCADE;
-- Note: We KEEP is_family_member as it is used by Wallets, but it is SECURITY DEFINER so it should be fine.

-- 4. Create SIMPLE, ATOMIC Policies for PROFILES
-- View: Self OR Hardcoded Admin
CREATE POLICY "Safe View Profiles" ON profiles
FOR SELECT USING (
  id = auth.uid() 
  OR 
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- Update: Self OR Hardcoded Admin
CREATE POLICY "Safe Update Profiles" ON profiles
FOR UPDATE USING (
  id = auth.uid() 
  OR 
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- Insert: Self only (System handles creation usually, but for completeness)
CREATE POLICY "Safe Insert Profiles" ON profiles
FOR INSERT WITH CHECK (
  id = auth.uid()
);

-- 5. Create SIMPLE, ATOMIC Policies for FAMILIES
-- Admin View All
CREATE POLICY "Safe Admin Families" ON families
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- User View OWN Families (No recursion, just Owner ID check)
CREATE POLICY "Safe Owner Families" ON families
FOR SELECT USING (
  owner_id = auth.uid()
);

-- Note: We temporarily disable "Member Viewing" of families to stop recursion.
-- Users will only see families they Create/Own for now. 
-- Once stability is confirmed, we can re-add member visibility carefully.

-- 6. Create SIMPLE, ATOMIC Policies for MEMBERS
-- Admin View All
CREATE POLICY "Safe Admin Members" ON family_members
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- User View SELF Membership (No recursion, just User ID check)
CREATE POLICY "Safe Self Member" ON family_members
FOR SELECT USING (
  user_id = auth.uid()
);

-- 7. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 8. Force Cache Refresh
NOTIFY pgrst, 'reload config';

COMMIT;
