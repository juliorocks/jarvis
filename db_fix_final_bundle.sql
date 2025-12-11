-- DATA INTEGRITY & INVITE FIXES (Final Bundle)

-- 1. PUBLIC INVITE DETAILS (Essential for the Invite Page to work)
-- This allows anyone with the token to see the invite details (Safe: token is the secret)
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

-- 2. MY INVITES LOOKUP (Rescue "Orphan" Users)
-- Allows a logged-in user to find invites sent to their email
CREATE OR REPLACE FUNCTION get_my_pending_invites()
RETURNS TABLE (
    id uuid,
    family_id uuid,
    token uuid,
    family_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.family_id,
        i.token,
        f.name as family_name
    FROM invitations i
    JOIN families f ON f.id = i.family_id
    WHERE 
        i.email = (select email from auth.users where id = auth.uid()) 
        AND i.status = 'pending';
END;
$$;

-- 3. ACCEPT INVITE RPC (Secure Backend Acceptance)
-- Prevents RLS issues when inserting into family_members
CREATE OR REPLACE FUNCTION accept_invite_by_token(token_arg uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    invite_record record;
    user_email text;
BEGIN
    -- Get current user email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

    -- Find invite
    SELECT * INTO invite_record FROM invitations WHERE token = token_arg;

    IF invite_record IS NULL THEN
        RAISE EXCEPTION 'Convite não encontrado';
    END IF;

    IF invite_record.status <> 'pending' THEN
        RAISE EXCEPTION 'Convite já aceito ou expirado';
    END IF;

    -- Verify email matches (optional strict check, can be relaxed if needed)
    -- IF invite_record.email <> user_email THEN
    --    RAISE EXCEPTION 'Este convite é para outro email';
    -- END IF;

    -- Insert Member
    INSERT INTO family_members (family_id, user_id, role)
    VALUES (invite_record.family_id, auth.uid(), 'member')
    ON CONFLICT (family_id, user_id) DO NOTHING;

    -- Update Invite Status
    UPDATE invitations SET status = 'accepted' WHERE id = invite_record.id;

    RETURN TRUE;
END;
$$;

-- 4. FIX MEMBER VISIBILITY (Just in case)
CREATE OR REPLACE FUNCTION is_family_member(param_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members WHERE family_id = param_family_id AND user_id = auth.uid()
  );
END;
$$;

-- Refresh permissions
GRANT EXECUTE ON FUNCTION get_invite_details TO public;
GRANT EXECUTE ON FUNCTION get_my_pending_invites TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invite_by_token TO authenticated;
