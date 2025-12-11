-- ENHANCED DASHBOARD RPC
-- Guarantees we get email/name from auth.users if profiles table is empty/missing

CREATE OR REPLACE FUNCTION get_family_dashboard_data(target_family_id UUID)
RETURNS TABLE (
    members_json JSONB,
    invites_json JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin
SET search_path = public, auth
AS $$
BEGIN
    -- Security Check
    IF NOT EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_id = target_family_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    RETURN QUERY
    SELECT 
        -- Fetch Members with ROBUST Fallback to auth.users
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
            JOIN auth.users au ON au.id = fm.user_id -- JOIN against auth.users to get guaranteed data
            WHERE fm.family_id = target_family_id
        ) as members_json,
        
        -- Fetch Invites
        (
            SELECT jsonb_agg(t) FROM invitations t WHERE t.family_id = target_family_id
        ) as invites_json;
END;
$$;
