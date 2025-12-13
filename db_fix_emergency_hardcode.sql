-- EMERGENCY FIX: Hardcoded Admin Access to bypass Recursion
-- This uses the JWT properties directly, avoiding ANY database query during policy check.
-- This guarantees NO recursion (Error 500).

-- 1. Reset Policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Clean up potentially problematic functions
DROP FUNCTION IF EXISTS public.get_my_role();

-- 3. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create "Bulletproof" Access Policy
-- Users see themselves OR 'jhowmktoficial@gmail.com' sees EVERYONE.
CREATE POLICY "Universal Access" ON profiles
FOR ALL USING (
  auth.uid() = id 
  OR 
  (select auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

-- 5. Fix Families Access as well
DROP POLICY IF EXISTS "Admins can view all families" ON families;
CREATE POLICY "Admins can view all families" ON families
FOR SELECT USING (
  (select auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

DROP POLICY IF EXISTS "Admins can view all family members" ON family_members;
CREATE POLICY "Admins can view all family members" ON family_members
FOR SELECT USING (
  (select auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

-- 6. Ensure role is admin in DB (for UI logic)
UPDATE profiles SET role = 'admin' WHERE email = 'jhowmktoficial@gmail.com';
