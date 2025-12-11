-- EMERGENCY DEBUG: DISABLE RLS ON TRANSACTIONS & WALLETS
-- Use this to verify if RLS is the blocker
-- If this fixes the issue, we know the RLS policies were too strict or broken.

ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
