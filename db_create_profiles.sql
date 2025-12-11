-- Create Profiles table for proper user display
-- This corresponds to the request to show names/emails instead of User IDs.

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view profiles of people in their same family
-- We use the secure check function we created earlier if possible, or a direct join.
-- To avoid complex recursion, let's keep it simple: Any authenticated user can view basic profiles? 
-- Or strictly family? Let's go with Family for privacy.
CREATE POLICY "View Family Profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members my_fam
            JOIN family_members their_fam ON my_fam.family_id = their_fam.family_id
            WHERE my_fam.user_id = auth.uid()
            AND their_fam.user_id = profiles.id
        )
    );

CREATE POLICY "Update Own Profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Force refresh
NOTIFY pgrst, 'reload config';
