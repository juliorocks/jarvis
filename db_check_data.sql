-- CHECK DATA EXISTENCE
SELECT count(*) FROM profiles;
-- Também verifique se seu usuário está lá
SELECT * FROM profiles WHERE email = 'jhowmktoficial@gmail.com';
