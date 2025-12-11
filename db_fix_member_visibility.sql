-- FIX MEMBER VISIBILITY ISSUES

-- 1. Ensure the helper function exists and is SECURITY DEFINER (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION is_family_member(param_family_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members WHERE family_id = param_family_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix family_members RLS Policy
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their families" ON family_members;
DROP POLICY IF EXISTS "View Members" ON family_members;

-- Use the function to break recursion
CREATE POLICY "View Members" ON family_members
    FOR SELECT USING (
        is_family_member(family_id)
    );

-- 3. Fix Profiles RLS (Crucial for seeing names/emails)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Allow authenticated users to view basic profile info (needed for family lists)
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING ( auth.role() = 'authenticated' );

-- 4. Force strict update for Family Name for Owner
DROP POLICY IF EXISTS "Users can update their families" ON families;
CREATE POLICY "Users can update their families" ON families
    FOR UPDATE USING (
        owner_id = auth.uid()
    );

-- Force reload schema cache
NOTIFY pgrst, 'reload config';
