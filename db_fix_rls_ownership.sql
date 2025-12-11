-- Fix Family RLS Ownership Deadlock
-- Problem: When a user creates a family, they cannot "see" it (SELECT) to get the ID back because they are not yet a member.
-- Fix: Update SELECT policy to allow owners to view their families.

DROP POLICY IF EXISTS "Users can view their families" ON families;

CREATE POLICY "Users can view their families" ON families
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM family_members WHERE family_id = families.id AND user_id = auth.uid())
    );

-- Force refresh
NOTIFY pgrst, 'reload config';
