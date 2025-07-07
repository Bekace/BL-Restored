-- Create playlists system with all necessary tables and relationships

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS playlist_assignments CASCADE;
DROP TABLE IF EXISTS playlist_items CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;

-- Create playlists table
CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'scheduled', 'paused')),
    loop_enabled BOOLEAN DEFAULT true,
    schedule_enabled BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    selected_days TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_items table (for media files in playlists)
CREATE TABLE playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    media_file_id INTEGER REFERENCES media_files(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    duration INTEGER, -- Override duration in seconds, NULL uses media file default
    transition_type VARCHAR(50) DEFAULT 'fade',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist_assignments table (assign playlists to devices)
CREATE TABLE playlist_assignments (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, device_id)
);

-- Create indexes for better performance
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_status ON playlists(status);
CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_position ON playlist_items(playlist_id, position);
CREATE INDEX idx_playlist_assignments_playlist_id ON playlist_assignments(playlist_id);
CREATE INDEX idx_playlist_assignments_device_id ON playlist_assignments(device_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_playlists_updated_at 
    BEFORE UPDATE ON playlists 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO playlists (user_id, name, description, status, loop_enabled) 
SELECT 
    id, 
    'Welcome Messages', 
    'Default welcome playlist for new users', 
    'draft', 
    true 
FROM users 
WHERE email = 'admin@example.com' 
LIMIT 1;

-- Verify tables were created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('playlists', 'playlist_items', 'playlist_assignments')
ORDER BY table_name, ordinal_position;
