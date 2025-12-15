-- FIX: Add missing columns to credit card usage JSON in dashboard RPC

DROP FUNCTION IF EXISTS get_family_dashboard_data(uuid);

CREATE OR REPLACE FUNCTION get_family_dashboard_data(target_family_id UUID)
RETURNS TABLE (
    members_json JSONB,
    invites_json JSONB,
    cards_usage_json JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM family_members WHERE family_id = target_family_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        -- 1. Members
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', fm.user_id,
                    'role', fm.role,
                    'joined_at', fm.joined_at,
                    'can_view_all', fm.can_view_all,
                    'profiles', jsonb_build_object(
                        'email', COALESCE(p.email, au.email),
                        'full_name', COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name')
                    )
                )
            )
            FROM family_members fm
            LEFT JOIN profiles p ON p.id = fm.user_id
            JOIN auth.users au ON au.id = fm.user_id
            WHERE fm.family_id = target_family_id
        ) as members_json,
        
        -- 2. Invites
        (SELECT jsonb_agg(t) FROM invitations t WHERE t.family_id = target_family_id) as invites_json,
        
        -- 3. Cards Usage (Current Month)
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', cc.id,
                    'name', cc.name,
                    'limit_amount', cc.limit_amount,
                    'closing_day', cc.closing_day,   -- Added
                    'due_day', cc.due_day,           -- Added
                    'current_invoice', COALESCE((
                        SELECT SUM(amount) 
                        FROM transactions t 
                        WHERE t.credit_card_id = cc.id 
                        AND t.type = 'expense'
                        AND date_trunc('month', t.date::date) = date_trunc('month', CURRENT_DATE)
                    ), 0)
                )
            )
            FROM credit_cards cc
            WHERE cc.family_id = target_family_id
        ) as cards_usage_json;
END;
$$;
