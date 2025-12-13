-- EMERGENCY FIX v2: Hardcoded Admin Access to bypass Recursion
-- This version handles dependencies correctly using CASCADE

-- 1. Reset Policies on Profiles Table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Drop dependent policies on other tables explicitly first (Good practice)
DROP POLICY IF EXISTS "Admins can view all families" ON families;
DROP POLICY IF EXISTS "Admins can view all family members" ON family_members;

-- 3. Clean up potentially problematic functions using CASCADE to catch any stragglers
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- 4. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create "Bulletproof" Access Policy
-- Users see themselves OR 'jhowmktoficial@gmail.com' sees EVERYONE.
CREATE POLICY "Universal Access" ON profiles
FOR ALL USING (
  auth.uid() = id 
  OR 
  (select auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

-- 6. Fix Families Access as well
-- Re-create the policies we dropped in step 2, but using the safe check
CREATE POLICY "Admins can view all families" ON families
FOR SELECT USING (
  (select auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

CREATE POLICY "Admins can view all family members" ON family_members
FOR SELECT USING (
  (select auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

-- 7. Ensure role is admin in DB (for UI logic)
UPDATE profiles SET role = 'admin' WHERE email = 'jhowmktoficial@gmail.com';
