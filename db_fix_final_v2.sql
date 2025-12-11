-- FINAL FIX V2
-- Addresses:
-- 1. "Error updating profile" -> Missing INSERT policy on profiles.
-- 2. "Wrong Family" -> Updates RPC to prioritize the correct family.

-- PART 1: FIX PROFILES RLS
-- Users need to be able to INSERT their own profile if it doesn't exist yet (for upsert).
CREATE POLICY "Insert Own Profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Ensure UPDATE policy covers all columns
DROP POLICY IF EXISTS "Update Own Profile" ON profiles;
CREATE POLICY "Update Own Profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- PART 2: IMPROVE FAMILY SELECTION RPC
-- Logic: If user is in multiple families, prefer the most recently joined one, 
-- OR specifically avoid single-member families if a multi-member family exists.
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    f_id UUID;
BEGIN
    -- Try to find a family where the user is NOT the owner first (e.g. they were invited)
    -- OR simply select the most recently joined one.
    SELECT family_id INTO f_id
    FROM family_members
    WHERE user_id = auth.uid()
    ORDER BY 
        CASE WHEN role = 'owner' THEN 2 ELSE 1 END ASC, -- Prefer 'member' (1) over 'owner' (2)
        joined_at DESC -- Tie-break: Newest first
    LIMIT 1;
    
    RETURN f_id;
END;
$$;

-- PART 3: RE-RUN ORPHAN CLEANUP (Just in case)
DO $$
DECLARE
    r RECORD;
    orphan_family_id UUID;
BEGIN
    FOR r IN 
        SELECT user_id, count(*) as c 
        FROM family_members 
        GROUP BY user_id 
        HAVING count(*) > 1
    LOOP
        SELECT f.id INTO orphan_family_id
        FROM families f
        JOIN family_members fm ON f.id = fm.family_id
        WHERE f.owner_id = r.user_id 
        AND f.name = 'Minha Família'
        AND (SELECT count(*) FROM family_members WHERE family_id = f.id) = 1;

        IF orphan_family_id IS NOT NULL THEN
            DELETE FROM family_members WHERE family_id = orphan_family_id;
            DELETE FROM families WHERE id = orphan_family_id;
        END IF;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload config';
