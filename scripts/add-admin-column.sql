-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Update existing users to have is_admin = false by default
UPDATE users SET is_admin = false WHERE is_admin IS NULL;

-- Now make the specific user an admin
UPDATE users 
SET is_admin = true 
WHERE email = 'bekace.multimedia@gmail.com';

-- Verify the admin status was set
SELECT id, email, first_name, last_name, is_admin, role
FROM users 
WHERE email = 'bekace.multimedia@gmail.com';
