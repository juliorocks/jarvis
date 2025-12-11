-- Fix Roles and Remove Orphan Families
-- Problem: Invited users might have automatically created a "Minha Família" (Owner) when they logged in, 
-- effectively having 2 families. They need to see the one they were invited to.

DO $$
DECLARE
    r RECORD;
    orphan_family_id UUID;
BEGIN
    -- For each user who is a member of MORE THAN 1 family
    FOR r IN 
        SELECT user_id, count(*) as c 
        FROM family_members 
        GROUP BY user_id 
        HAVING count(*) > 1
    LOOP
        -- Find if they have a "Minha Família" that they own and is empty (only them)
        -- We will assume the family named 'Minha Família' where they are owner is the auto-generated one to delete.
        SELECT f.id INTO orphan_family_id
        FROM families f
        JOIN family_members fm ON f.id = fm.family_id
        WHERE f.owner_id = r.user_id 
        AND f.name = 'Minha Família'
        AND (SELECT count(*) FROM family_members WHERE family_id = f.id) = 1; -- Only has 1 member (the user themselves)

        IF orphan_family_id IS NOT NULL THEN
            RAISE NOTICE 'Removing orphan family % for user %', orphan_family_id, r.user_id;
            
            -- Delete the membership first (cascade takes care of family if we set it up, but let's be explicit)
            DELETE FROM family_members WHERE family_id = orphan_family_id;
            DELETE FROM families WHERE id = orphan_family_id;
        END IF;
    END LOOP;
END $$;

-- Force refresh
NOTIFY pgrst, 'reload config';
