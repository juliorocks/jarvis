-- Database Repair Script: Ensure every user has a Family
-- This script fixes "zombie" states where a user might own a family but isn't listed as a member.

DO $$
DECLARE
    u RECORD;
    f_id UUID;
BEGIN
    -- Iterate over ALL users in the system
    FOR u IN SELECT id FROM auth.users LOOP
        
        -- Check if user is already a member of ANY family
        IF NOT EXISTS (SELECT 1 FROM family_members WHERE user_id = u.id) THEN
            RAISE NOTICE 'Fixing user %', u.id;
            
            -- 1. Check if user already OWNS a family (but isn't a member due to previous error)
            SELECT id INTO f_id FROM families WHERE owner_id = u.id LIMIT 1;
            
            IF f_id IS NOT NULL THEN
                -- Found an orphan family, just add the member record
                INSERT INTO family_members (family_id, user_id, role) 
                VALUES (f_id, u.id, 'owner');
                RAISE NOTICE 'Linked user % to existing family %', u.id, f_id;
            ELSE
                -- 2. User has nothing. Create a new Family.
                INSERT INTO families (name, owner_id) 
                VALUES ('Minha Família', u.id) 
                RETURNING id INTO f_id;
                
                INSERT INTO family_members (family_id, user_id, role) 
                VALUES (f_id, u.id, 'owner');
                RAISE NOTICE 'Created new family % for user %', f_id, u.id;
            END IF;
        END IF;
        
    END LOOP;
END $$;
