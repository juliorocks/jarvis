-- FINAL RLS FIX
-- 1. Redefine helper with strict security settings
CREATE OR REPLACE FUNCTION is_family_member(param_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Direct check avoiding policies
  RETURN EXISTS (
    SELECT 1 FROM family_members WHERE family_id = param_family_id AND user_id = auth.uid()
  );
END;
$$;

-- 2. Drop old policies
DROP POLICY IF EXISTS "View Members" ON family_members;
DROP POLICY IF EXISTS "Users can view members of their families" ON family_members;
DROP POLICY IF EXISTS "Users can view own membership" ON family_members;

-- 3. Policy: View Own Membership (Always allowed, non-recursive)
CREATE POLICY "Users can view own membership" ON family_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- 4. Policy: View Team Members (Uses Security Definer function to see others)
CREATE POLICY "Users can view team members" ON family_members
    FOR SELECT USING (
        is_family_member(family_id)
    );

-- 5. Profiles - ensure we can see the data
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
