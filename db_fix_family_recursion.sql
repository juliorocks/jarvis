-- FIX FAMILY RECURSION (Error 500 on families/family_members)
-- The error happens because policies reference each other or themselves.
-- Solution: Use a SECURITY DEFINER function to verify membership without triggering RLS.

-- 1. Create the Security Helper Function
CREATE OR REPLACE FUNCTION public.check_is_member(lookup_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: Runs as owner, bypassing RLS recursion
SET search_path = public
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

-- 2. Update Families Policy
-- Reset
DROP POLICY IF EXISTS "User View Families" ON families;

-- New Policy uses the function
CREATE POLICY "User View Families" ON families
FOR SELECT USING (
  check_is_member(id)
);

-- 3. Update Family Members Policy
-- Reset
DROP POLICY IF EXISTS "User View Members" ON family_members;

-- New Policy uses the function
-- "I can see a member row IF I am a member of that row's family"
CREATE POLICY "User View Members" ON family_members
FOR SELECT USING (
  check_is_member(family_id)
);

-- 4. Ensure Admin Access is still there (re-applying just in case)
DROP POLICY IF EXISTS "Admin All Families" ON families;
CREATE POLICY "Admin All Families" ON families
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

DROP POLICY IF EXISTS "Admin All Members" ON family_members;
CREATE POLICY "Admin All Members" ON family_members
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- 5. Force Refresh
NOTIFY pgrst, 'reload config';
