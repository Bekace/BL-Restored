-- Fix the URL column length to handle base64 data URLs
ALTER TABLE media_files ALTER COLUMN url TYPE TEXT;

-- Also fix thumbnail_url if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'media_files' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE media_files ALTER COLUMN thumbnail_url TYPE TEXT;
    END IF;
END $$;

-- Check the updated structure
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'media_files' 
AND column_name IN ('url', 'thumbnail_url');
