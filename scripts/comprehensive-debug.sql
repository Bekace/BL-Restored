-- Comprehensive debug script to check everything

-- 1. Check if devices table exists and its structure
SELECT 'DEVICES TABLE STRUCTURE' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

-- 2. Check all devices
SELECT 'ALL DEVICES' as section;
SELECT d.id, d.name, d.device_type, d.status, d.user_id, d.created_at, d.updated_at
FROM devices d
ORDER BY d.created_at DESC;

-- 3. Check devices with user information
SELECT 'DEVICES WITH USERS' as section;
SELECT 
  d.id as device_id,
  d.name as device_name,
  d.device_type,
  d.status,
  d.user_id,
  u.id as user_table_id,
  u.email,
  u.first_name,
  u.last_name,
  d.created_at as device_created
FROM devices d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.created_at DESC;

-- 4. Check pairing codes
SELECT 'PAIRING CODES' as section;
SELECT 
  dpc.id,
  dpc.code,
  dpc.screen_name,
  dpc.device_id,
  dpc.user_id,
  dpc.used_at,
  dpc.completed_at,
  dpc.created_at,
  d.name as device_name
FROM device_pairing_codes dpc
LEFT JOIN devices d ON dpc.device_id = d.id
ORDER BY dpc.created_at DESC;

-- 5. Check users
SELECT 'ALL USERS' as section;
SELECT id, email, first_name, last_name, is_admin, created_at
FROM users
ORDER BY created_at DESC;

-- 6. Check for orphaned devices
SELECT 'ORPHANED DEVICES' as section;
SELECT d.id, d.name, d.device_type, d.user_id, d.created_at
FROM devices d
WHERE d.user_id IS NULL
ORDER BY d.created_at DESC;

-- 7. Check devices for specific user (user ID 8 based on previous debug)
SELECT 'DEVICES FOR USER 8' as section;
SELECT d.id, d.name, d.device_type, d.status, d.user_id, d.created_at
FROM devices d
WHERE d.user_id = 8
ORDER BY d.created_at DESC;

-- 8. Summary statistics
SELECT 'SUMMARY STATISTICS' as section;
SELECT 
  (SELECT COUNT(*) FROM devices) as total_devices,
  (SELECT COUNT(*) FROM devices WHERE user_id IS NOT NULL) as devices_with_users,
  (SELECT COUNT(*) FROM devices WHERE user_id = 8) as devices_for_user_8,
  (SELECT COUNT(*) FROM device_pairing_codes) as total_pairing_codes,
  (SELECT COUNT(*) FROM device_pairing_codes WHERE completed_at IS NOT NULL) as completed_pairings,
  (SELECT COUNT(*) FROM users) as total_users;

-- 9. Fix orphaned devices (if any)
UPDATE devices 
SET user_id = 8, updated_at = CURRENT_TIMESTAMP
WHERE user_id IS NULL AND id IN (4, 5);

-- 10. Final verification after fix
SELECT 'FINAL VERIFICATION' as section;
SELECT 
  d.id,
  d.name,
  d.device_type,
  d.status,
  d.user_id,
  u.email,
  d.created_at
FROM devices d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.user_id = 8
ORDER BY d.created_at DESC;
