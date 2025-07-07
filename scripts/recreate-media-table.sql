-- Safely recreate the media_files table with all required columns
-- First, drop dependent objects, then recreate everything

-- Drop dependent tables/constraints first
DROP TABLE IF EXISTS playlist_items CASCADE;

-- Now we can safely drop and recreate media_files
DROP TABLE IF EXISTS media_files CASCADE;

CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'document', 'other'
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- for videos in seconds
  dimensions VARCHAR(20), -- e.g., "1920x1080"
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recreate playlist_items table that depends on media_files
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    media_file_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- display duration in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_media_files_user_id ON media_files(user_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);
CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_media_file_id ON playlist_items(media_file_id);

-- Insert some sample data for testing (optional)
-- This will be removed once real uploads work
INSERT INTO media_files (user_id, filename, original_name, file_type, file_size, mime_type, storage_url) 
SELECT 
  id::uuid as user_id,
  'sample-image.jpg' as filename,
  'Sample Image.jpg' as original_name,
  'image' as file_type,
  1024000 as file_size,
  'image/jpeg' as mime_type,
  '/placeholder.svg?height=200&width=300' as storage_url
FROM users 
WHERE email = 'bekace.multimedia@gmail.com'
LIMIT 1;
