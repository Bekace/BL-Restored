-- Create playlists system tables
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'scheduled', 'paused')),
    loop_enabled BOOLEAN DEFAULT true,
    schedule_enabled BOOLEAN DEFAULT false,
    start_time TIME,
    end_time TIME,
    selected_days TEXT[], -- Array of day names: ['monday', 'tuesday', etc.]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist items table (links playlists to media files)
CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    media_file_id INTEGER NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    duration INTEGER DEFAULT 30, -- Duration in seconds, can override media file duration
    transition_type VARCHAR(50) DEFAULT 'fade',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create playlist assignments table (links playlists to screens/devices)
CREATE TABLE IF NOT EXISTS playlist_assignments (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, device_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_assignments_playlist_id ON playlist_assignments(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_assignments_device_id ON playlist_assignments(device_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_updated_at();
