-- Fix playlist_items schema to work with media_files table
-- This script safely migrates the playlist system

-- First, check if we need to add the media_file_id column
DO $$
BEGIN
    -- Add media_file_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'media_file_id'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN media_file_id INTEGER;
    END IF;

    -- Add duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'duration'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN duration INTEGER DEFAULT 30;
    END IF;

    -- Add transition_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'transition_type'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN transition_type VARCHAR(50) DEFAULT 'fade';
    END IF;
END $$;

-- Migrate data from media_id to media_file_id if needed
UPDATE playlist_items 
SET media_file_id = media_id 
WHERE media_file_id IS NULL AND media_id IS NOT NULL;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'playlist_items_media_file_id_fkey'
    ) THEN
        ALTER TABLE playlist_items 
        ADD CONSTRAINT playlist_items_media_file_id_fkey 
        FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_items_media_file_id ON playlist_items(media_file_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(playlist_id, position);

-- Update any NULL durations to default
UPDATE playlist_items SET duration = 30 WHERE duration IS NULL;
UPDATE playlist_items SET transition_type = 'fade' WHERE transition_type IS NULL;
