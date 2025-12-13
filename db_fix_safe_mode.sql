-- SAFE MODE: Fix Recursion by SIMPLIFYING Policies
-- We remove the "Siblings see siblings" logic temporarily to restore system stability.

-- 1. FAMILIES
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User View Families" ON families;
DROP POLICY IF EXISTS "Admin All Families" ON families;
DROP POLICY IF EXISTS "Admins can view all families" ON families;

-- Re-enable
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Safe Admin Policy
CREATE POLICY "Admin All Families" ON families
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- Safe User Policy (Owner only) from now
-- Users can only see families they OWN.
CREATE POLICY "User View Own Families" ON families
FOR SELECT USING (
  owner_id = auth.uid()
);


-- 2. FAMILY MEMBERS
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User View Members" ON family_members;
DROP POLICY IF EXISTS "Admin All Members" ON family_members;
DROP POLICY IF EXISTS "Admins can view all family members" ON family_members;

-- Re-enable
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Safe Admin Policy
CREATE POLICY "Admin All Members" ON family_members
FOR ALL USING (
  (auth.jwt() ->> 'email') ILIKE 'jhowmktoficial@gmail.com'
);

-- Safe User Policy (Self only)
-- Users can only see THEIR OWN membership row.
-- They won't see siblings for now, but Admin Panel will work.
CREATE POLICY "User View Self Membership" ON family_members
FOR SELECT USING (
  user_id = auth.uid()
);

-- 3. Force Refresh
NOTIFY pgrst, 'reload config';
