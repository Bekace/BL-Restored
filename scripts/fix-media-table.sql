-- Add missing columns to media_files table
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS dimensions VARCHAR(20);
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have a default mime_type if any exist
UPDATE media_files SET mime_type = 'application/octet-stream' WHERE mime_type IS NULL;
