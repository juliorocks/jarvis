-- Check who has admin role
SELECT id, email, full_name, role, plan_status 
FROM profiles 
WHERE role = 'admin';

-- If the list is empty, run this (replace YOUR_EMAIL):
-- UPDATE profiles SET role = 'admin' WHERE email = 'seu_email@exemplo.com';
