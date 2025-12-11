-- DEBUG: TEMPORARY PERMISSIVE POLICY
-- Use this to verify if the issue is RLS or Data Missing.
-- If this works, my previous RLS was strict/broken.
-- If this fails (still 0 members), the Data is missing or FamilyID is wrong.

ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
