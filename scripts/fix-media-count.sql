-- Fix the media files count and storage for all users
UPDATE users 
SET 
  media_files_count = (
    SELECT COUNT(*) 
    FROM media_files 
    WHERE media_files.user_id = users.id
  ),
  storage_used_bytes = (
    SELECT COALESCE(SUM(file_size), 0) 
    FROM media_files 
    WHERE media_files.user_id = users.id
  );

-- Show the corrected counts
SELECT 
  id as user_id,
  email,
  media_files_count,
  storage_used_bytes,
  (SELECT COUNT(*) FROM media_files WHERE user_id = users.id) as actual_files
FROM users 
WHERE media_files_count > 0 OR storage_used_bytes > 0;
