-- Add soft delete columns to media_files table
ALTER TABLE media_files 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);

-- Create index for better performance when filtering deleted files
CREATE INDEX IF NOT EXISTS idx_media_files_deleted_at ON media_files(deleted_at);

-- Update existing files to ensure they're not marked as deleted
UPDATE media_files SET deleted_at = NULL WHERE deleted_at IS NULL;
