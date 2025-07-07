-- First, check if devices table exists and what columns it has
DO $$
BEGIN
    -- Drop and recreate devices table with proper schema
    DROP TABLE IF EXISTS device_heartbeats CASCADE;
    DROP TABLE IF EXISTS devices CASCADE;
    
    -- Create devices table with all required columns
    CREATE TABLE devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Device',
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

    -- Create device_heartbeats table
    CREATE TABLE device_heartbeats (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'online',
        performance_metrics TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id)
    );

    -- Create indexes for better performance
    CREATE INDEX idx_devices_status ON devices(status);
    CREATE INDEX idx_devices_user_id ON devices(user_id);
    CREATE INDEX idx_devices_device_type ON devices(device_type);
    CREATE INDEX idx_devices_name ON devices(name);
    
    CREATE INDEX idx_device_heartbeats_device_id ON device_heartbeats(device_id);
    CREATE INDEX idx_device_heartbeats_status ON device_heartbeats(status);
    CREATE INDEX idx_device_heartbeats_updated_at ON device_heartbeats(updated_at);

    -- Insert some test devices for development
    INSERT INTO devices (name, device_type, platform, status) VALUES
    ('Test Device 1', 'web_browser', 'Chrome', 'offline'),
    ('Test Device 2', 'fire_tv', 'Fire TV', 'offline'),
    ('Test Device 3', 'android_tv', 'Android TV', 'offline');

    RAISE NOTICE 'Devices table recreated successfully with proper schema';
END $$;
