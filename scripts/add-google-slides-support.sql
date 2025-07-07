-- Add Google Slides support to media files
ALTER TABLE media_files 
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS media_source VARCHAR(50) DEFAULT 'upload',
ADD COLUMN IF NOT EXISTS embed_settings JSONB;

-- Update file_type enum to include 'presentation'
-- Note: Since we can't easily alter enum in PostgreSQL, we'll use varchar check constraint
ALTER TABLE media_files 
DROP CONSTRAINT IF EXISTS media_files_file_type_check;

ALTER TABLE media_files 
ADD CONSTRAINT media_files_file_type_check 
CHECK (file_type IN ('image', 'video', 'document', 'presentation', 'other'));

-- Add index for external URLs
CREATE INDEX IF NOT EXISTS idx_media_files_external_url ON media_files(external_url);
CREATE INDEX IF NOT EXISTS idx_media_files_source ON media_files(media_source);
