-- Fix devices that don't have proper user associations
-- This will help with devices that were created but not properly linked to users

-- First, let's see what we have
SELECT 'DEVICES WITHOUT USERS' as info;
SELECT id, name, device_type, status, user_id, created_at 
FROM devices 
WHERE user_id IS NULL;

-- Update device ID 4 to belong to user ID 8 (based on the debug data showing user 8 is active)
-- You can modify this based on which user should own which device
UPDATE devices 
SET user_id = 8, updated_at = CURRENT_TIMESTAMP
WHERE id = 4 AND user_id IS NULL;

-- Verify the update
SELECT 'UPDATED DEVICES' as info;
SELECT d.id, d.name, d.device_type, d.user_id, u.email
FROM devices d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.id IN (4, 5)
ORDER BY d.id;

-- Clean up test devices that aren't needed
DELETE FROM devices WHERE id IN (1, 2, 3) AND name LIKE 'Test Device%';

-- Final verification
SELECT 'FINAL DEVICE LIST' as info;
SELECT d.id, d.name, d.device_type, d.status, d.user_id, u.email
FROM devices d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.created_at DESC;
