-- FIX: RLS Recursion on Admin Check
-- We use a secure function to check the role, bypassing RLS for the check itself.

-- 1. Create a function to get the current user's role securely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin), bypassing RLS
SET search_path = public -- Secure search path
AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$;

-- 2. Update Policies to use the function instead of direct table query
-- This prevents the "Infinite Recursion" loop when querying profiles table from within a profiles policy.

-- PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  get_my_role() = 'admin'
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  get_my_role() = 'admin'
);

-- FAMILIES
DROP POLICY IF EXISTS "Admins can view all families" ON families;
CREATE POLICY "Admins can view all families" ON families
FOR SELECT USING (
  get_my_role() = 'admin'
);

-- FAMILY MEMBERS
DROP POLICY IF EXISTS "Admins can view all family members" ON family_members;
CREATE POLICY "Admins can view all family members" ON family_members
FOR SELECT USING (
  get_my_role() = 'admin'
);

-- 3. Verify Own Profile Access (Standard)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (
  auth.uid() = id
);

-- 4. Double check your user is admin
-- UPDATE profiles SET role = 'admin' WHERE email = 'jhowmktoficial@gmail.com';
