-- DIAGNOSTIC: CHECK LATEST TRANSACTIONS
-- Run this in Supabase SQL Editor to see if the transaction was actually saved.

SELECT 
    t.description, 
    t.amount, 
    t.date, 
    t.family_id, 
    f.name as family_name,
    t.user_id,
    p.email as user_email
FROM transactions t
LEFT JOIN families f ON t.family_id = f.id
LEFT JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;
