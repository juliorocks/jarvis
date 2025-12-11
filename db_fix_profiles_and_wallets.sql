-- 1. Create a trigger to auto-create profile on signup
-- This ensures 'profiles' table always has a row for every user.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Backfill missing profiles (Fix for existing "strange numbers")
-- Inserts a profile for any user that doesn't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Verify Wallet Permissions (for editing)
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view wallets" ON wallets
  FOR SELECT USING (
    exists (select 1 from family_members where family_id = wallets.family_id and user_id = auth.uid())
  );

CREATE POLICY "Family members can insert wallets" ON wallets
  FOR INSERT WITH CHECK (
    -- User must be in the family they are trying to add a wallet to
    exists (select 1 from family_members where family_id = wallets.family_id and user_id = auth.uid())
  );

CREATE POLICY "Owners and creators can update wallets" ON wallets
  FOR UPDATE USING (
    -- Owner of the family OR Creator of the wallet
    exists (select 1 from family_members where family_id = wallets.family_id and user_id = auth.uid() and role = 'owner')
    OR
    user_id = auth.uid()
  );

CREATE POLICY "Owners and creators can delete wallets" ON wallets
  FOR DELETE USING (
     exists (select 1 from family_members where family_id = wallets.family_id and user_id = auth.uid() and role = 'owner')
    OR
    user_id = auth.uid()
  );
