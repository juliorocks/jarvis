-- SUPER RPC for Dashboard Data
-- bypassing RLS checks to ensure owners/members ALWAYS see their data if linked correctly.

CREATE OR REPLACE FUNCTION get_family_dashboard_data(target_family_id UUID)
RETURNS TABLE (
    members_json JSONB,
    invites_json JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER -- Use admin privileges
SET search_path = public, auth
AS $$
BEGIN
    -- Security Check: Only allow if the requester is a member of this family
    IF NOT EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_id = target_family_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this family.';
    END IF;

    RETURN QUERY
    SELECT 
        -- Fetch Members
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', fm.user_id,
                    'role', fm.role,
                    'joined_at', fm.joined_at,
                    'can_view_all', fm.can_view_all,
                    'profiles', jsonb_build_object(
                        'email', p.email,
                        'full_name', p.full_name
                    )
                )
            )
            FROM family_members fm
            LEFT JOIN profiles p ON p.id = fm.user_id
            WHERE fm.family_id = target_family_id
        ) as members_json,
        
        -- Fetch Invites
        (
            SELECT jsonb_agg(t) FROM invitations t WHERE t.family_id = target_family_id
        ) as invites_json;
END;
$$;
