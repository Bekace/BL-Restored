-- Add device playlist management columns
-- This script safely adds columns for playlist assignment and control

DO $$
BEGIN
    -- Add assigned_playlist_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id') THEN
        ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER REFERENCES playlists(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added assigned_playlist_id column to devices table';
    ELSE
        RAISE NOTICE 'assigned_playlist_id column already exists in devices table';
    END IF;

    -- Add playlist_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'playlist_status') THEN
        ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(20) DEFAULT 'none';
        RAISE NOTICE 'Added playlist_status column to devices table';
    ELSE
        RAISE NOTICE 'playlist_status column already exists in devices table';
    END IF;

    -- Add last_control_action column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'last_control_action') THEN
        ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(50);
        RAISE NOTICE 'Added last_control_action column to devices table';
    ELSE
        RAISE NOTICE 'last_control_action column already exists in devices table';
    END IF;

    -- Add last_control_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'last_control_time') THEN
        ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
        RAISE NOTICE 'Added last_control_time column to devices table';
    ELSE
        RAISE NOTICE 'last_control_time column already exists in devices table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to devices table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in devices table';
    END IF;

    -- Create index on assigned_playlist_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'devices' AND indexname = 'idx_devices_assigned_playlist') THEN
        CREATE INDEX idx_devices_assigned_playlist ON devices(assigned_playlist_id);
        RAISE NOTICE 'Created index idx_devices_assigned_playlist';
    ELSE
        RAISE NOTICE 'Index idx_devices_assigned_playlist already exists';
    END IF;

    -- Create index on playlist_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'devices' AND indexname = 'idx_devices_playlist_status') THEN
        CREATE INDEX idx_devices_playlist_status ON devices(playlist_status);
        RAISE NOTICE 'Created index idx_devices_playlist_status';
    ELSE
        RAISE NOTICE 'Index idx_devices_playlist_status already exists';
    END IF;

    -- Create index on user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'devices' AND indexname = 'idx_devices_user_id') THEN
        CREATE INDEX idx_devices_user_id ON devices(user_id);
        RAISE NOTICE 'Created index idx_devices_user_id';
    ELSE
        RAISE NOTICE 'Index idx_devices_user_id already exists';
    END IF;

    -- Update existing devices to have default playlist status
    UPDATE devices SET playlist_status = 'none' WHERE playlist_status IS NULL;
    RAISE NOTICE 'Updated existing devices with default playlist_status';

    -- Add some sample data if devices table is empty
    IF NOT EXISTS (SELECT 1 FROM devices) THEN
        INSERT INTO devices (name, device_type, user_id, status, playlist_status, created_at, updated_at)
        SELECT 'Sample Screen 1', 'web_browser', u.id, 'offline', 'none', NOW(), NOW()
        FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM devices WHERE user_id = u.id)
        LIMIT 1;

        INSERT INTO devices (name, device_type, user_id, status, playlist_status, created_at, updated_at)
        SELECT 'Sample Screen 2', 'fire_tv', u.id, 'offline', 'none', NOW(), NOW()
        FROM users u
        WHERE NOT EXISTS (SELECT 1 FROM devices WHERE user_id = u.id AND name != 'Sample Screen 1')
        LIMIT 1;
    END IF;

END $$;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;
