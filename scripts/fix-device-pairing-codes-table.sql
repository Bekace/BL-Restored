-- First, ensure the device_pairing_codes table exists with the correct structure
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL
);

-- Add missing columns if they don't exist
ALTER TABLE device_pairing_codes 
ADD COLUMN IF NOT EXISTS screen_name VARCHAR(255) DEFAULT 'Unknown Screen';

ALTER TABLE device_pairing_codes 
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50) DEFAULT 'unknown';

ALTER TABLE device_pairing_codes 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id);

-- Clean up any expired codes
DELETE FROM device_pairing_codes WHERE expires_at < CURRENT_TIMESTAMP;

-- Insert some test codes for immediate testing
INSERT INTO device_pairing_codes (code, expires_at, created_at) 
VALUES 
  ('TEST01', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP),
  ('TEST02', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP),
  ('DEMO01', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP)
ON CONFLICT (code) DO UPDATE SET
  expires_at = EXCLUDED.expires_at,
  created_at = EXCLUDED.created_at;
