-- FIX: Allow users to view their own profile
-- Without this, the middleware cannot read the 'role' to verify if you are Admin.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
    END IF;
END
$$;

-- Ensure the role is set (just in case)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
