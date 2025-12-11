-- Fix Family Members RLS Recursion
-- The previous policy relied on a recursive check that could fail or block viewing one's own membership.

DROP POLICY IF EXISTS "Users can view members of their families" ON family_members;
DROP POLICY IF EXISTS "Users can join families" ON family_members; -- clean up previous temporary fix if needed

-- 1. Simple Policy: View Own Membership (Breaks recursion)
CREATE POLICY "Users can view their own membership" ON family_members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- 2. Group Policy: View Other Members (Depends on having access to own membership via #1)
CREATE POLICY "Users can view other family members" ON family_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members AS my_membership 
            WHERE my_membership.family_id = family_members.family_id 
            AND my_membership.user_id = auth.uid()
        )
    );

-- Force refresh
NOTIFY pgrst, 'reload config';
