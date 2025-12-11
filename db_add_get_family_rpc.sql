-- Create a specific function to get the user's family ID
-- This bypasses RLS complexity by running as the system (SECURITY DEFINER)
-- but carefully checking auth.uid() so it's still secure.

CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres/admin)
AS $$
DECLARE
    f_id UUID;
BEGIN
    SELECT family_id INTO f_id
    FROM family_members
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN f_id;
END;
$$;

-- Force refresh schema cache
NOTIFY pgrst, 'reload config';
