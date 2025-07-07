-- Safe database setup that handles existing data properly

-- First, let's check if we need to convert user IDs from INTEGER to UUID
DO $$
DECLARE
    user_id_type TEXT;
BEGIN
    -- Check the current data type of users.id
    SELECT data_type INTO user_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- If it's INTEGER, we need to convert to UUID
    IF user_id_type = 'integer' THEN
        -- Add a temporary UUID column
        ALTER TABLE users ADD COLUMN temp_uuid_id UUID DEFAULT gen_random_uuid();
        
        -- Update all existing users with UUIDs
        UPDATE users SET temp_uuid_id = gen_random_uuid() WHERE temp_uuid_id IS NULL;
        
        -- Drop the old integer ID and rename the UUID column
        ALTER TABLE users DROP COLUMN id CASCADE;
        ALTER TABLE users RENAME COLUMN temp_uuid_id TO id;
        ALTER TABLE users ADD PRIMARY KEY (id);
        
        RAISE NOTICE 'Converted users.id from INTEGER to UUID';
    END IF;
END $$;

-- Ensure all required columns exist in users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create or update devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Create or update playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    loop_enabled BOOLEAN DEFAULT TRUE,
    schedule_enabled BOOLEAN DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    days_of_week TEXT[],
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create device_codes table
CREATE TABLE IF NOT EXISTS device_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(6) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    max_screens INTEGER,
    max_storage_gb INTEGER,
    max_users INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create features table
CREATE TABLE IF NOT EXISTS features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans if they don't exist
INSERT INTO plans (name, display_name, description, price_monthly, price_yearly, max_screens, max_storage_gb, max_users, features)
VALUES 
    ('free', 'Free Plan', 'Basic plan for testing', 0, 0, 1, 1, 1, '{"basic_support": true}'),
    ('monthly', 'Monthly Plan', 'Standard monthly subscription', 29.99, 299.99, 5, 10, 3, '{"priority_support": true, "advanced_analytics": true}'),
    ('yearly', 'Yearly Plan', 'Annual subscription with discount', 24.99, 249.99, 10, 50, 10, '{"priority_support": true, "advanced_analytics": true, "custom_branding": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert default features if they don't exist
INSERT INTO features (name, display_name, description, category, is_active)
VALUES 
    ('basic_support', 'Basic Support', 'Email support during business hours', 'support', true),
    ('priority_support', 'Priority Support', '24/7 priority email and chat support', 'support', true),
    ('advanced_analytics', 'Advanced Analytics', 'Detailed usage and performance analytics', 'analytics', true),
    ('custom_branding', 'Custom Branding', 'Remove branding and add your own', 'customization', true),
    ('api_access', 'API Access', 'Full REST API access for integrations', 'integration', true),
    ('bulk_operations', 'Bulk Operations', 'Bulk upload and management tools', 'management', true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_status ON playlists(status);

RAISE NOTICE 'Database setup completed successfully';
