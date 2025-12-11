-- FIX WALLET PERMISSIONS (Allow members to use/update wallets)
-- This is critical if the system tries to update wallet balances

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- 1. allow SELECT (Viewing) - Re-applying to be sure
DROP POLICY IF EXISTS "Family members can view wallets" ON wallets;
CREATE POLICY "Family members can view wallets" ON wallets
  FOR SELECT USING (
    exists (select 1 from family_members where family_id = wallets.family_id and user_id = auth.uid())
  );

-- 2. allow UPDATE (Changing Balance) - OPENING TO ALL FAMILY MEMBERS
-- Previously it was restricted to Owners/Creators.
-- Now any member can update a wallet (needed if they add a transaction to it)
DROP POLICY IF EXISTS "Family members can update wallets" ON wallets;
DROP POLICY IF EXISTS "Owners and creators can update wallets" ON wallets;

CREATE POLICY "Family members can update wallets" ON wallets
  FOR UPDATE USING (
    exists (select 1 from family_members where family_id = wallets.family_id and user_id = auth.uid())
  );

-- 3. allow INSERT (Creating new wallets)
DROP POLICY IF EXISTS "Family members can insert wallets" ON wallets;
CREATE POLICY "Family members can insert wallets" ON wallets
  FOR INSERT WITH CHECK (
    exists (select 1 from family_members where family_id = wallets.family_id and user_id = auth.uid())
  );

-- 4. allow DELETE (Only Owners or Creators)
DROP POLICY IF EXISTS "Owners and creators can delete wallets" ON wallets;
CREATE POLICY "Owners and creators can delete wallets" ON wallets
  FOR DELETE USING (
     user_id = auth.uid()
     OR
     exists (
        select 1 from family_members 
        where family_id = wallets.family_id 
        and user_id = auth.uid() 
        and role = 'owner'
     )
  );
