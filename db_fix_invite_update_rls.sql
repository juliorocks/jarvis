-- Allow family members to update separate invitations (needed to accept them)
-- This policy was missing, causing the invite to stay "Pending" even after keeping "Accepted".

create policy "Family members can update invitations" on invitations
  for update using (
    exists (select 1 from family_members where family_id = invitations.family_id and user_id = auth.uid())
  );
