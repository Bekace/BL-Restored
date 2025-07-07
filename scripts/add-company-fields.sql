-- Add company address and phone fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);

-- Update existing users with sample data (optional)
UPDATE users 
SET 
  company_address = '123 Business Street, City, State 12345',
  company_phone = '+1 (555) 123-4567',
  updated_at = CURRENT_TIMESTAMP
WHERE company IS NOT NULL AND company_address IS NULL;
