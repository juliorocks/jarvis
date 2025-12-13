-- DEFINITIVE FIX FOR PROFILE ACCESS (ERROR 500)
-- Run this in Supabase SQL Editor

-- 1. Reset Policies on Profiles Table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Re-create Helper Function (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$;

-- 3. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Simple "View Own" Policy
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (
  auth.uid() = id
);

-- 5. Create "Update Own" Policy (for user settings)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (
  auth.uid() = id
);

-- 6. Create "Admin View All" - USING THE FUNCTION to avoid recursion
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  get_my_role() = 'admin'
);

-- 7. Create "Admin Update All" - USING THE FUNCTION
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  get_my_role() = 'admin'
);

-- 8. Verify your user is admin (Just in case)
UPDATE profiles SET role = 'admin' WHERE email = 'jhowmktoficial@gmail.com';
