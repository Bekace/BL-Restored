-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create device_codes table
CREATE TABLE IF NOT EXISTS device_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(6) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    screen_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'offline',
    location VARCHAR(255),
    resolution VARCHAR(20) DEFAULT '1920x1080',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    duration INTEGER, -- for videos, in seconds
    dimensions VARCHAR(20), -- for images, e.g., "1920x1080"
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    loop_enabled BOOLEAN DEFAULT TRUE,
    schedule_enabled BOOLEAN DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    days_of_week TEXT[], -- array of day names
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_items table
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
    media_file_id INTEGER REFERENCES media_files(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- display duration in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo user
INSERT INTO users (email, password_hash, first_name, last_name, company, plan) 
VALUES (
    'demo@signagecloud.com', 
    '$2b$10$rQZ9QmZ9QmZ9QmZ9QmZ9Qu',
    'Demo', 
    'User', 
    'SignageCloud Demo', 
    'monthly'
) ON CONFLICT (email) DO NOTHING;

-- Get the demo user ID for subsequent inserts
DO $$
DECLARE
    demo_user_id INTEGER;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@signagecloud.com';
    
    -- Insert demo devices
    INSERT INTO devices (device_id, user_id, screen_name, device_type, platform, api_key, status, location, last_seen)
    VALUES 
        ('device_demo1', demo_user_id, 'Lobby Display', 'firestick', 'android-tv', 'api_demo_key_1', 'online', 'Main Lobby', CURRENT_TIMESTAMP),
        ('device_demo2', demo_user_id, 'Reception Desk', 'android-tv', 'android-tv', 'api_demo_key_2', 'online', 'Reception Area', CURRENT_TIMESTAMP - INTERVAL '2 minutes'),
        ('device_demo3', demo_user_id, 'Cafeteria TV', 'web-browser', 'web', 'api_demo_key_3', 'offline', 'Employee Cafeteria', CURRENT_TIMESTAMP - INTERVAL '10 minutes')
    ON CONFLICT (device_id) DO NOTHING;
    
    -- Insert demo media files
    INSERT INTO media_files (user_id, filename, original_name, file_type, file_size, duration, dimensions, url, thumbnail_url)
    VALUES 
        (demo_user_id, 'summer-promo.mp4', 'summer-promo.mp4', 'video', 47185920, 150, '1920x1080', '/placeholder.svg?height=1080&width=1920', '/placeholder.svg?height=100&width=150'),
        (demo_user_id, 'company-logo.png', 'company-logo.png', 'image', 2202009, NULL, '1920x1080', '/placeholder.svg?height=1080&width=1920', '/placeholder.svg?height=100&width=150'),
        (demo_user_id, 'menu-board.jpg', 'menu-board.jpg', 'image', 3984588, NULL, '1366x768', '/placeholder.svg?height=768&width=1366', '/placeholder.svg?height=100&width=150')
    ON CONFLICT DO NOTHING;
    
    -- Insert demo playlists
    INSERT INTO playlists (user_id, name, description, status, days_of_week)
    VALUES 
        (demo_user_id, 'Welcome Messages', 'Greeting messages for lobby display', 'active', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        (demo_user_id, 'Menu & Announcements', 'Daily menu and company announcements', 'active', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        (demo_user_id, 'Company Info', 'Company overview and values', 'draft', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
    ON CONFLICT DO NOTHING;
    
END $$;
