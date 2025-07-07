-- Ensure devices table exists with all required columns
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) DEFAULT 'web_browser',
    platform VARCHAR(255) DEFAULT 'web',
    capabilities TEXT DEFAULT '[]',
    screen_resolution VARCHAR(50) DEFAULT '',
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'offline',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns if they don't exist
ALTER TABLE devices ADD COLUMN IF NOT EXISTS capabilities TEXT DEFAULT '[]';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(50) DEFAULT '';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_type ON devices(device_type);

-- Ensure device_heartbeats table exists
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'online',
    performance_metrics TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id)
);

-- Create indexes for heartbeats
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_status ON device_heartbeats(status);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_updated_at ON device_heartbeats(updated_at);
