-- Fix Invitations RLS
-- I forgot to add policies for the invitations table, so RLS is blocking everything by default.

-- 1. Helper function (if not already exists, but it should from previous script)
-- We'll assume is_family_member exists. If it might not, we can inline the check.

-- Policy: Members can view invitations for their family
DROP POLICY IF EXISTS "Family members can view invitations" ON invitations;
CREATE POLICY "Family members can view invitations" ON invitations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM family_members WHERE family_id = invitations.family_id AND user_id = auth.uid())
    );

-- Policy: Members can insert invitations
DROP POLICY IF EXISTS "Family members can create invitations" ON invitations;
CREATE POLICY "Family members can create invitations" ON invitations
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM family_members WHERE family_id = invitations.family_id AND user_id = auth.uid())
    );

-- Policy: Members can delete (cancel) invitations
DROP POLICY IF EXISTS "Family members can cancel invitations" ON invitations;
CREATE POLICY "Family members can cancel invitations" ON invitations
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM family_members WHERE family_id = invitations.family_id AND user_id = auth.uid())
    );

-- Force refresh
NOTIFY pgrst, 'reload config';
