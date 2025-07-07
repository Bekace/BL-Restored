-- Create plan_templates table for managing subscription plans
CREATE TABLE IF NOT EXISTS plan_templates (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  max_media_files INTEGER NOT NULL DEFAULT 5,
  max_storage_bytes BIGINT NOT NULL DEFAULT 104857600, -- 100MB
  max_screens INTEGER NOT NULL DEFAULT 1,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create plan_features table for managing individual features
CREATE TABLE IF NOT EXISTS plan_features (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default features first
INSERT INTO plan_features (name, description, category) VALUES
('Basic media management', 'Upload and organize media files', 'media'),
('Advanced media management', 'Advanced organization with folders and tags', 'media'),
('Unlimited media files', 'No limit on number of media files', 'media'),
('Unlimited storage', 'No storage space limitations', 'storage'),
('Email support', 'Support via email during business hours', 'support'),
('Priority support', 'Faster response times and priority handling', 'support'),
('24/7 phone support', 'Round-the-clock phone and email support', 'support'),
('Analytics dashboard', 'Detailed usage and performance analytics', 'analytics'),
('Advanced analytics', 'In-depth reporting and custom dashboards', 'analytics'),
('Custom templates', 'Access to premium design templates', 'design'),
('Custom branding', 'White-label solution with your branding', 'design'),
('API access', 'Full API access for integrations', 'integration'),
('Community access', 'Access to community forums and resources', 'community'),
('Dedicated account manager', 'Personal account manager for enterprise clients', 'support')
ON CONFLICT (name) DO NOTHING;

-- Insert default plans
INSERT INTO plan_templates (plan_type, name, description, max_media_files, max_storage_bytes, max_screens, price_monthly, price_yearly, features, sort_order) VALUES
('free', 'Free Plan', 'Perfect for getting started', 5, 104857600, 1, 0.00, 0.00, '["Basic media management", "1 screen", "Email support", "Community access"]', 1),
('pro', 'Pro Plan', 'For growing businesses', 500, 5368709120, 10, 29.00, 290.00, '["Advanced media management", "10 screens", "Priority support", "Analytics dashboard", "Custom templates"]', 2),
('enterprise', 'Enterprise Plan', 'For large organizations', -1, -1, -1, 99.00, 990.00, '["Unlimited media files", "Unlimited storage", "Unlimited screens", "24/7 phone support", "Advanced analytics", "Custom branding", "API access", "Dedicated account manager"]', 3)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  max_media_files = EXCLUDED.max_media_files,
  max_storage_bytes = EXCLUDED.max_storage_bytes,
  max_screens = EXCLUDED.max_screens,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  updated_at = CURRENT_TIMESTAMP;

-- Update trigger for plan_templates
CREATE OR REPLACE FUNCTION update_plan_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_plan_templates_updated_at ON plan_templates;
CREATE TRIGGER update_plan_templates_updated_at
  BEFORE UPDATE ON plan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_templates_updated_at();
