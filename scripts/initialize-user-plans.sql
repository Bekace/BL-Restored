-- Initialize existing users with free plan data
UPDATE users 
SET 
  plan_type = 'free',
  media_files_count = 0,
  storage_used_bytes = 0,
  screens_count = 0,
  plan_expires_at = NULL
WHERE plan_type IS NULL OR plan_type = '';

-- Verify the update
SELECT id, email, plan_type, media_files_count, storage_used_bytes, screens_count 
FROM users 
LIMIT 5;
