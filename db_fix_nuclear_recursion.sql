-- NUCLEAR FIX FOR RECURSION
-- 1. Disable RLS immediately to stop the crashing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL possible policies to clear the slate
-- We drop by name. If it doesn't exist, it skips (IF EXISTS)

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view and edit all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Universal Access" ON profiles;

-- 3. Also drop the function if it still exists
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- 4. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create the SINGLE, SAFEST, EMAIL-BASED policy
-- This checks JWT directly. Zero database queries. Zero recursion.
CREATE POLICY "Profiles Policy" ON profiles
FOR ALL USING (
  id = auth.uid() 
  OR 
  (auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

-- 6. Fix Families (Just in case they are also recursive)
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all families" ON families;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all families" ON families
FOR SELECT USING (
  (auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);

ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all family members" ON family_members;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all family members" ON family_members
FOR SELECT USING (
  (auth.jwt() ->> 'email') = 'jhowmktoficial@gmail.com'
);
