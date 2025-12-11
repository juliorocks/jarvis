-- FIXED RPC: RESOLVE AMBIGUITY
-- We rename the output column collision and use strict aliases to prevent "ambiguous column" error.

DROP FUNCTION IF EXISTS get_family_transactions(uuid);

CREATE OR REPLACE FUNCTION get_family_transactions(target_family_id UUID)
RETURNS TABLE (
    id UUID,
    description TEXT,
    amount NUMERIC,
    type TEXT,
    date DATE,
    category_id UUID,
    wallet_id UUID,
    credit_card_id UUID,
    status TEXT,
    creator_id UUID,     -- Renamed from user_id to avoid ambiguity
    created_at TIMESTAMPTZ,
    category_json JSONB,
    profile_json JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- 1. Security Check: Requesting User MUST be a member of the target family
    -- Usage of alias 'fm' ensures we refer to table column, not any variable
    IF NOT EXISTS (
        SELECT 1 FROM family_members fm
        WHERE fm.family_id = target_family_id AND fm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this family.';
    END IF;

    -- 2. Fetch Data
    RETURN QUERY
    SELECT 
        t.id,
        t.description,
        t.amount,
        t.type,
        t.date,
        t.category_id,
        t.wallet_id,
        t.credit_card_id,
        t.status,
        t.user_id AS creator_id, -- Map to new output name
        t.created_at,
        jsonb_build_object(
            'name', c.name,
            'icon', c.icon,
            'color', c.color
        ) as category_json,
        jsonb_build_object(
            'full_name', COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.email),
            'email', COALESCE(p.email, au.email)
        ) as profile_json
    FROM transactions t
    LEFT JOIN transaction_categories c ON t.category_id = c.id
    LEFT JOIN profiles p ON t.user_id = p.id
    LEFT JOIN auth.users au ON t.user_id = au.id
    WHERE t.family_id = target_family_id
    ORDER BY t.date DESC
    LIMIT 50;
END;
$$;
