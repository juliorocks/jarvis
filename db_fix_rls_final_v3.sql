-- FINAL RLS FIX - ATTEMPT 2 (With Drops)
-- Clean slate approach to avoid "already exists" errors

-- 1. Helper Function
CREATE OR REPLACE FUNCTION is_family_member(param_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members WHERE family_id = param_family_id AND user_id = auth.uid()
  );
END;
$$;

-- 2. Clean up Policies (DROP IF EXISTS)
DROP POLICY IF EXISTS "View Members" ON family_members;
DROP POLICY IF EXISTS "Users can view members of their families" ON family_members;
DROP POLICY IF EXISTS "Users can view own membership" ON family_members;
DROP POLICY IF EXISTS "Users can view team members" ON family_members;

-- 3. Re-create Policies
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Policy A: View Own Membership (Always allowed)
CREATE POLICY "Users can view own membership" ON family_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy B: View Team Members (Check via function)
CREATE POLICY "Users can view team members" ON family_members
    FOR SELECT USING (
        is_family_member(family_id)
    );

-- 4. Fix Profiles Visibility
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

-- 5. Force config reload
NOTIFY pgrst, 'reload config';
