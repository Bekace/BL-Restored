-- Add admin role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Update existing users to have 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create admin user (you can change the email to your preferred admin email)
INSERT INTO users (email, password_hash, first_name, last_name, role, plan_type, created_at)
VALUES ('admin@signagecloud.com', 'admin123', 'Admin', 'User', 'admin', 'enterprise', NOW())
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Create plan_features table for flexible feature management
CREATE TABLE IF NOT EXISTS plan_features (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(50) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  feature_value TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plan features
INSERT INTO plan_features (plan_type, feature_name, feature_value, is_enabled) VALUES
-- Free Plan Features
('free', 'Custom Branding', 'false', false),
('free', 'Priority Support', 'false', false),
('free', 'Advanced Analytics', 'false', false),
('free', 'API Access', 'false', false),
('free', 'White Label', 'false', false),

-- Pro Plan Features  
('pro', 'Custom Branding', 'true', true),
('pro', 'Priority Support', 'true', true),
('pro', 'Advanced Analytics', 'true', true),
('pro', 'API Access', 'limited', true),
('pro', 'White Label', 'false', false),

-- Enterprise Plan Features
('enterprise', 'Custom Branding', 'true', true),
('enterprise', 'Priority Support', 'true', true),
('enterprise', 'Advanced Analytics', 'true', true),
('enterprise', 'API Access', 'full', true),
('enterprise', 'White Label', 'true', true),
('enterprise', 'Dedicated Support', 'true', true),
('enterprise', 'Custom Integrations', 'true', true)

ON CONFLICT DO NOTHING;

-- Create admin_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'plan', 'user', 'feature', etc.
  target_id VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
