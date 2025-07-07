-- Fix playlist_items table schema to use consistent column naming
-- This ensures proper foreign key relationships and data integrity

DO $$
BEGIN
    -- Check if media_file_id column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'media_file_id'
    ) THEN
        -- If media_id exists, rename it to media_file_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'playlist_items' AND column_name = 'media_id'
        ) THEN
            ALTER TABLE playlist_items RENAME COLUMN media_id TO media_file_id;
        ELSE
            -- Add media_file_id column
            ALTER TABLE playlist_items ADD COLUMN media_file_id INTEGER;
        END IF;
    END IF;

    -- Ensure duration and transition_type columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'duration'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN duration INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'playlist_items' AND column_name = 'transition_type'
    ) THEN
        ALTER TABLE playlist_items ADD COLUMN transition_type VARCHAR(50) DEFAULT 'fade';
    END IF;

    -- Drop existing foreign key constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'playlist_items_media_id_fkey' AND table_name = 'playlist_items'
    ) THEN
        ALTER TABLE playlist_items DROP CONSTRAINT playlist_items_media_id_fkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'playlist_items_media_file_id_fkey' AND table_name = 'playlist_items'
    ) THEN
        ALTER TABLE playlist_items DROP CONSTRAINT playlist_items_media_file_id_fkey;
    END IF;

    -- Add proper foreign key constraint
    ALTER TABLE playlist_items 
    ADD CONSTRAINT playlist_items_media_file_id_fkey 
    FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE;

    -- Set default values for existing records
    UPDATE playlist_items SET duration = 30 WHERE duration IS NULL;
    UPDATE playlist_items SET transition_type = 'fade' WHERE transition_type IS NULL OR transition_type = '';

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(playlist_id, position);

    RAISE NOTICE 'Playlist items schema fixed successfully';
END $$;
