-- Create device_pairing_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires ON device_pairing_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user ON device_pairing_codes(user_id);

-- Create devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'web_browser',
    platform TEXT,
    capabilities JSONB DEFAULT '[]',
    screen_resolution VARCHAR(20),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_playlist_id INTEGER REFERENCES playlists(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'offline',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create device_heartbeats table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'online',
    current_item_id INTEGER,
    progress DECIMAL(5,2) DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_playlist ON devices(assigned_playlist_id);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device ON device_heartbeats(device_id);

-- Insert test pairing codes for development
INSERT INTO device_pairing_codes (code, expires_at) 
VALUES 
    ('TEST01', CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    ('TEST02', CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    ('DEMO01', CURRENT_TIMESTAMP + INTERVAL '1 hour')
ON CONFLICT (code) DO NOTHING;
