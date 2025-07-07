-- Migration script to add missing columns and fix device tables
-- Run this to fix the devices table structure

BEGIN;

-- First, let's check what columns exist in the devices table
DO $$
BEGIN
    RAISE NOTICE 'Starting device table migration...';
END $$;

-- Add missing columns to devices table if they don't exist
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS assigned_playlist_id INTEGER REFERENCES playlists(id),
ADD COLUMN IF NOT EXISTS playlist_status VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS last_control_action VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_control_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create or update device_pairing_codes table
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    screen_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to device_pairing_codes if they don't exist
ALTER TABLE device_pairing_codes 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'device_pairing_codes_user_id_fkey'
    ) THEN
        ALTER TABLE device_pairing_codes 
        ADD CONSTRAINT device_pairing_codes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create device_heartbeats table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_playlist ON devices(assigned_playlist_id);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_created_at ON device_heartbeats(created_at);

-- Update existing devices to have default values
UPDATE devices 
SET 
    playlist_status = COALESCE(playlist_status, 'none'),
    updated_at = COALESCE(updated_at, created_at)
WHERE playlist_status IS NULL OR updated_at IS NULL;

-- Create trigger to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired pairing codes
DELETE FROM device_pairing_codes 
WHERE expires_at < CURRENT_TIMESTAMP AND completed_at IS NULL;

-- Show current table structures
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Checking table structures...';
END $$;

-- Display devices table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

-- Display device_pairing_codes table structure  
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'device_pairing_codes' 
ORDER BY ordinal_position;

-- Show current data counts
SELECT 
    'devices' as table_name, 
    COUNT(*) as record_count 
FROM devices
UNION ALL
SELECT 
    'device_pairing_codes' as table_name, 
    COUNT(*) as record_count 
FROM device_pairing_codes
UNION ALL
SELECT 
    'device_heartbeats' as table_name, 
    COUNT(*) as record_count 
FROM device_heartbeats;

-- Show sample devices data
SELECT 
    id,
    name,
    device_type,
    status,
    assigned_playlist_id,
    playlist_status,
    last_control_action,
    last_control_time,
    created_at,
    updated_at
FROM devices 
ORDER BY created_at DESC 
LIMIT 5;

COMMIT;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '✅ Device migration completed successfully!';
    RAISE NOTICE '✅ All missing columns have been added';
    RAISE NOTICE '✅ Indexes have been created for better performance';
    RAISE NOTICE '✅ Triggers have been set up for automatic timestamps';
    RAISE NOTICE '✅ You can now test the pairing code generation';
END $$;
