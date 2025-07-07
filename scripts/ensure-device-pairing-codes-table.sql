-- Create device_pairing_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_pairing_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
    screen_name VARCHAR(255),
    device_type VARCHAR(100),
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_code ON device_pairing_codes(code);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_expires_at ON device_pairing_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_user_id ON device_pairing_codes(user_id);

-- Insert test pairing codes for development
INSERT INTO device_pairing_codes (code, expires_at, created_at) VALUES
('TEST01', CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP),
('TEST02', CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP),
('DEMO01', CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;
