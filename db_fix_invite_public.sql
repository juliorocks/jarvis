-- RPC Function to allow public (anyone) to fetch invite details IF they have the token.
-- This bypasses RLS (Security Definer) but only exposes the specific invite matching the token.

CREATE OR REPLACE FUNCTION get_invite_details(lookup_token uuid)
RETURNS TABLE (
    id uuid,
    family_id uuid,
    email text,
    status text,
    token uuid,
    created_at timestamptz,
    family_name text,
    owner_id uuid,
    owner_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id, 
        i.family_id, 
        i.email, 
        i.status, 
        i.token, 
        i.created_at,
        f.name as family_name,
        f.owner_id,
        p.full_name as owner_name
    FROM invitations i
    JOIN families f ON f.id = i.family_id
    LEFT JOIN profiles p ON p.id = f.owner_id
    WHERE i.token = lookup_token;
END;
$$;
