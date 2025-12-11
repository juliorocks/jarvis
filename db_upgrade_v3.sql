-- UPGRADE V3: Permissions, Renaming, and Fixes

-- 1. Add View Permission Column
ALTER TABLE family_members 
ADD COLUMN IF NOT EXISTS can_view_all BOOLEAN DEFAULT FALSE;

-- Owner always has can_view_all = TRUE (enforced by app logic or trigger, but default false is safer for new members)
-- Update existing owners to have TRUE
UPDATE family_members SET can_view_all = TRUE WHERE role = 'owner' OR role = 'admin';

-- 2. Update RLS for Transactions/Wallets to respect this
-- Function to check view permission
CREATE OR REPLACE FUNCTION can_view_family_data(param_family_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_perm BOOLEAN;
    user_role TEXT;
BEGIN
    SELECT can_view_all, role INTO user_perm, user_role
    FROM family_members 
    WHERE family_id = param_family_id 
    AND user_id = auth.uid();

    -- Owners/Admins or users with permission can view EVERYTHING in the family
    IF user_role IN ('owner', 'admin') OR user_perm = TRUE THEN
        RETURN TRUE;
    END IF;

    -- Otherwise, RLS policies will need to filter by user_id separately.
    -- This function specifically checks "Can I view the WHOLE family data?"
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- We need to adjust the policies on Transactions/Wallets.
-- Previous Policy: "Family members can view transactions" -> USING (is_family_member(family_id))
-- NEW Policy Logic: 
-- IF (can_view_family_data(family_id)) -> SHOW ALL
-- ELSE -> SHOW ONLY MY OWN (user_id = auth.uid())

DROP POLICY IF EXISTS "Family members can view transactions" ON transactions;
CREATE POLICY "Family members can view transactions" ON transactions
    FOR SELECT USING (
        (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())) -- Must be in family
        AND 
        (
            user_id = auth.uid() -- Can always see own
            OR 
            can_view_family_data(family_id) -- Can see all if perm granted
        )
    );

-- Repeat for Wallets (Optional: Usually wallets are shared? If request implies private wallets, we apply same logic)
-- User asked "deciding if guest can see all transactions". Let's apply to transactions for sure.
-- For wallets, usually visibility is needed to select them. Let's keep wallets shared for now unless requested otherwise.

-- 3. Fix Profile Updates (Missing Insert)
DROP POLICY IF EXISTS "Insert Own Profile" ON profiles;
CREATE POLICY "Insert Own Profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());
    
DROP POLICY IF EXISTS "Update Own Profile" ON profiles;
CREATE POLICY "Update Own Profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- 4. Fix Family Selection (RPC)
-- Logic: Prefer 'member' role (meaning I was invited) over 'owner' (default auto-create)
-- UNLESS I am an owner of a Real Family (more than 1 person).
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    f_id UUID;
BEGIN
    SELECT family_id INTO f_id
    FROM family_members fm
    JOIN families f ON f.id = fm.family_id
    WHERE fm.user_id = auth.uid()
    ORDER BY 
        (SELECT count(*) FROM family_members WHERE family_id = fm.family_id) DESC, -- Prefer families with more people (Active ones)
        fm.joined_at DESC -- Tie-break: Newest
    LIMIT 1;
    
    RETURN f_id;
END;
$$;

-- 5. Force Orphan Cleanup (Aggressive)
-- Removes single-member 'Minha Família' if user has another family
DELETE FROM families 
WHERE id IN (
    SELECT f.id FROM families f
    JOIN family_members fm ON f.id = fm.family_id
    WHERE f.name = 'Minha Família'
    AND f.owner_id = fm.user_id
    AND (SELECT count(*) FROM family_members WHERE family_id = f.id) = 1
    AND EXISTS (SELECT 1 FROM family_members WHERE user_id = fm.user_id AND family_id != f.id)
);

-- Force refresh
NOTIFY pgrst, 'reload config';
