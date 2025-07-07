-- Add completed_at column to device_pairing_codes table
ALTER TABLE device_pairing_codes 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_device_pairing_codes_completed 
ON device_pairing_codes(completed_at);

-- Update existing records that have devices as completed
UPDATE device_pairing_codes 
SET completed_at = used_at 
WHERE used_at IS NOT NULL AND completed_at IS NULL;
