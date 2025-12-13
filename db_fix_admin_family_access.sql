-- Allow Admins to see all families
DROP POLICY IF EXISTS "Admins can view all families" ON families;
CREATE POLICY "Admins can view all families" ON families
FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow Admins to see all family members
DROP POLICY IF EXISTS "Admins can view all family members" ON family_members;
CREATE POLICY "Admins can view all family members" ON family_members
FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
