-- Make a user admin by email
-- Replace 'your-email@example.com' with the actual email address

UPDATE users 
SET is_admin = true 
WHERE email = 'bekace.multimedia@gmail.com';

-- Verify the update
SELECT id, email, first_name, last_name, is_admin 
FROM users 
WHERE email = 'bekace.multimedia@gmail.com';
