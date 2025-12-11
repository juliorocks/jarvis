-- FIX TRANSACTIONS RLS
-- Ensure family members can fully manage transactions within their family

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 1. VIEW (SELECT)
DROP POLICY IF EXISTS "Family members can view transactions" ON transactions;
CREATE POLICY "Family members can view transactions" ON transactions
  FOR SELECT USING (
    -- Can see if you are the creator OR if it belongs to your family
    user_id = auth.uid() 
    OR 
    exists (select 1 from family_members where family_id = transactions.family_id and user_id = auth.uid())
  );

-- 2. INSERT
DROP POLICY IF EXISTS "Family members can insert transactions" ON transactions;
CREATE POLICY "Family members can insert transactions" ON transactions
  FOR INSERT WITH CHECK (
    -- Can insert if linking to a family you are a member of
    exists (select 1 from family_members where family_id = transactions.family_id and user_id = auth.uid())
  );

-- 3. UPDATE
DROP POLICY IF EXISTS "Family members can update transactions" ON transactions;
CREATE POLICY "Family members can update transactions" ON transactions
  FOR UPDATE USING (
    exists (select 1 from family_members where family_id = transactions.family_id and user_id = auth.uid())
  );

-- 4. DELETE
DROP POLICY IF EXISTS "Family members can delete transactions" ON transactions;
CREATE POLICY "Family members can delete transactions" ON transactions
  FOR DELETE USING (
    exists (select 1 from family_members where family_id = transactions.family_id and user_id = auth.uid())
  );
