-- Execute Device Migration Script
-- This script adds missing columns to devices table and fixes the pairing system

BEGIN;

-- Add missing columns to devices table
DO $$ 
BEGIN
    -- Add assigned_playlist_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id') THEN
        ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER REFERENCES playlists(id);
        RAISE NOTICE 'Added assigned_playlist_id column to devices table';
    END IF;

    -- Add playlist_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'playlist_status') THEN
        ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(20) DEFAULT 'none';
        RAISE NOTICE 'Added playlist_status column to devices table';
    END IF;

    -- Add last_control_action column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'last_control_action') THEN
        ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(50);
        RAISE NOTICE 'Added last_control_action column to devices table';
    END IF;

    -- Add last_control_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'last_control_time') THEN
        ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
        RAISE NOTICE 'Added last_control_time column to devices table';
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
        ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to devices table';
    END IF;

    -- Add user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'user_id') THEN
        ALTER TABLE devices ADD COLUMN user_id INTEGER REFERENCES users(id);
        RAISE NOTICE 'Added user_id column to devices table';
    END IF;
END $$;

-- Create or update device_pairing_codes table
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    screen_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    device_id INTEGER REFERENCES devices(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to device_pairing_codes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'completed_at') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN completed_at TIMESTAMP;
        RAISE NOTICE 'Added completed_at column to device_pairing_codes table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'device_pairing_codes' AND column_name = 'device_id') THEN
        ALTER TABLE device_pairing_codes ADD COLUMN device_id INTEGER REFERENCES devices(id);
        RAISE NOTICE 'Added device_id column to device_pairing_codes table';
    END IF;
END $$;

-- Create device_heartbeats table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    status VARCHAR(20) DEFAULT 'online',
    current_item_id INTEGER,
    progress DECIMAL(5,2) DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_playlist ON devices(assigned_playlist_id);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id);

-- Create trigger for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to devices table
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to device_pairing_codes table
DROP TRIGGER IF EXISTS update_device_pairing_codes_updated_at ON device_pairing_codes;
CREATE TRIGGER update_device_pairing_codes_updated_at
    BEFORE UPDATE ON device_pairing_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to device_heartbeats table
DROP TRIGGER IF EXISTS update_device_heartbeats_updated_at ON device_heartbeats;
CREATE TRIGGER update_device_heartbeats_updated_at
    BEFORE UPDATE ON device_heartbeats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing devices to have default values
UPDATE devices 
SET 
    playlist_status = COALESCE(playlist_status, 'none'),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE playlist_status IS NULL OR updated_at IS NULL;

-- Clean up expired pairing codes
DELETE FROM device_pairing_codes WHERE expires_at < CURRENT_TIMESTAMP;

COMMIT;

-- Show results
SELECT 'DEVICES TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

SELECT 'DEVICE_PAIRING_CODES TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'device_pairing_codes' 
ORDER BY ordinal_position;

SELECT 'CURRENT DEVICES' as info;
SELECT id, name, device_type, status, playlist_status, user_id, created_at, updated_at
FROM devices 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'CURRENT PAIRING CODES' as info;
SELECT id, code, screen_name, device_type, user_id, expires_at, used_at, device_id, completed_at
FROM device_pairing_codes 
WHERE expires_at > CURRENT_TIMESTAMP
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'MIGRATION COMPLETED SUCCESSFULLY' as status;
