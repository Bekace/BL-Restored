-- Add plan and usage tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS media_files_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS screens_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;

-- Create plan_limits table for flexible plan management
CREATE TABLE IF NOT EXISTS plan_limits (
    id SERIAL PRIMARY KEY,
    plan_type VARCHAR(20) UNIQUE NOT NULL,
    max_media_files INTEGER NOT NULL,
    max_storage_bytes BIGINT NOT NULL,
    max_screens INTEGER NOT NULL,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    features TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert plan limits
INSERT INTO plan_limits (plan_type, max_media_files, max_storage_bytes, max_screens, price_monthly, features) VALUES
('free', 5, 104857600, 1, 0.00, ARRAY['Basic templates', 'Email support']),
('pro', 500, 5368709120, 999, 15.00, ARRAY['Advanced templates', 'Scheduling', 'Priority support', 'Analytics']),
('enterprise', -1, -1, -1, 99.00, ARRAY['Unlimited everything', 'Custom branding', 'API access', 'Dedicated support'])
ON CONFLICT (plan_type) DO UPDATE SET
    max_media_files = EXCLUDED.max_media_files,
    max_storage_bytes = EXCLUDED.max_storage_bytes,
    max_screens = EXCLUDED.max_screens,
    price_monthly = EXCLUDED.price_monthly,
    features = EXCLUDED.features;

-- Update existing media_files table structure
DROP TABLE IF EXISTS media_files;
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- for videos, in seconds
    dimensions VARCHAR(20), -- for images, e.g., "1920x1080"
    metadata JSONB, -- additional file metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

-- Update demo user to have some usage
UPDATE users SET 
    plan_type = 'free',
    media_files_count = 3,
    storage_used_bytes = 15728640,
    screens_count = 1
WHERE email = 'demo@signagecloud.com';
