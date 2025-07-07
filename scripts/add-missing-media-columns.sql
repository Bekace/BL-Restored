-- Add missing columns to media_files table
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS storage_url TEXT;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS dimensions VARCHAR(20);
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE media_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Make sure storage_url is NOT NULL for new records
UPDATE media_files SET storage_url = '/placeholder.svg' WHERE storage_url IS NULL;
