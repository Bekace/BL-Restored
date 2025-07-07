-- Check current user data
SELECT 
    id,
    email,
    first_name,
    last_name,
    plan_type,
    media_files_count,
    storage_used_bytes,
    screens_count,
    created_at
FROM users 
WHERE email = 'bekace.multimedia@gmail.com';

-- Check available plans
SELECT * FROM plan_limits ORDER BY price_monthly;

-- Update user to Pro plan (if that's what you want)
UPDATE users 
SET 
    plan_type = 'pro',
    updated_at = NOW()
WHERE email = 'bekace.multimedia@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    plan_type,
    media_files_count,
    storage_used_bytes,
    updated_at
FROM users 
WHERE email = 'bekace.multimedia@gmail.com';
