-- Consolidated Permissions Fix for Admin Panel
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 2. Allow Users to view their own profile (Critical for Admin Check recursion)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- 3. Allow Admins to view ALL profiles
-- Note: usage of EXISTS avoids some recursion if the own-profile policy exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Allow Admins to update profiles (Status/Plan)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. FAMILY ACCESS FOR ADMINS

-- Families
DROP POLICY IF EXISTS "Admins can view all families" ON families;
CREATE POLICY "Admins can view all families" ON families
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Family Members
DROP POLICY IF EXISTS "Admins can view all family members" ON family_members;
CREATE POLICY "Admins can view all family members" ON family_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. Ensure yourself is Admin (Replace with your specific email found in Auth)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
