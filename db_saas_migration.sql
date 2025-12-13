-- Add SaaS columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'editor')),
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial' CHECK (plan_type IN ('trial', 'individual', 'family')),
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'suspended', 'trial_expired')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Performance Indices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_status ON profiles(plan_status);

-- RLS: Allow Admins to View/Edit ALL profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'profiles'
        AND policyname = 'Admins can view and edit all profiles'
    ) THEN
        CREATE POLICY "Admins can view and edit all profiles" ON profiles
        FOR ALL USING (
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
    END IF;
END
$$;

-- RLS: Allow Admins to View ALL transactions (and other tables)
-- Note: You might need to add similar policies to 'transactions', 'wallets', etc if you want admins to see user data.
-- For strict privacy, maybe admins ONLY see profile metadata (plans), not financial data?
-- The request says: "Visualizar... quantos clientes, quantos pendentes...". 
-- It does NOT explicitly say "View user financial data". 
-- "Cada usuário/família deve ter seus acessos blindados". -> Implies Admin might NOT see user data, only metrics.
-- However, "Ativar/Desativar" user implies managing the profile.

-- Let's stick to Profile management for Admin for now.

-- UPDATE your own user to admin (Replace 'YOUR_EMAIL' with your actual email to bootstrap)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
