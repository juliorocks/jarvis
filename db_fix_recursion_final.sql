-- FIX INFINITE RECURSION FINAL
-- The problem: Querying 'family_members' inside a policy on 'family_members' triggers RLS -> infinite loop.
-- The solution: A function defined as SECURITY DEFINER runs as the owner (admin), bypassing RLS for that specific check.

-- 1. Create the Secure Check Function
CREATE OR REPLACE FUNCTION check_is_member_secure(lookup_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs as admin to bypass RLS recursion
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM family_members 
    WHERE family_id = lookup_family_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Update 'family_members' Policies
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Drop all previous overlapping policies to be clean
DROP POLICY IF EXISTS "Users can view family members" ON family_members;
DROP POLICY IF EXISTS "Users can view members of their families" ON family_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON family_members;
DROP POLICY IF EXISTS "Users can view other family members" ON family_members;
DROP POLICY IF EXISTS "Users can join families" ON family_members;

-- New Clean Policy: View if it's ME or if I'm a MEMBER (using secure check)
CREATE POLICY "View Family Members" ON family_members
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR
    check_is_member_secure(family_id)
  );

-- Re-add insert policy for self-joining (needed for invite acceptance or creation)
CREATE POLICY "Join Family" ON family_members
    FOR INSERT WITH CHECK (user_id = auth.uid());


-- 3. Update 'invitations' Policies to use the secure check too (safer)
DROP POLICY IF EXISTS "Family members can view invitations" ON invitations;
CREATE POLICY "View Invitations" ON invitations
    FOR SELECT USING ( check_is_member_secure(family_id) );
    
DROP POLICY IF EXISTS "Family members can create invitations" ON invitations;
CREATE POLICY "Create Invitations" ON invitations
    FOR INSERT WITH CHECK ( check_is_member_secure(family_id) );

DROP POLICY IF EXISTS "Family members can cancel invitations" ON invitations;
CREATE POLICY "Cancel Invitations" ON invitations
    FOR DELETE USING ( check_is_member_secure(family_id) );

-- Force refresh
NOTIFY pgrst, 'reload config';
