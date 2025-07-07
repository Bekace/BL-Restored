-- Debug script to check devices table and relationships

-- Check devices table structure
SELECT 'DEVICES TABLE STRUCTURE' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'devices' 
ORDER BY ordinal_position;

-- Check all devices
SELECT 'ALL DEVICES' as info;
SELECT d.id, d.name, d.device_type, d.status, d.user_id, d.created_at, d.updated_at
FROM devices d
ORDER BY d.created_at DESC;

-- Check devices with user information
SELECT 'DEVICES WITH USERS' as info;
SELECT d.id, d.name, d.device_type, d.status, d.user_id, u.email, u.first_name, u.last_name
FROM devices d
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.created_at DESC;

-- Check pairing codes
SELECT 'PAIRING CODES' as info;
SELECT dpc.id, dpc.code, dpc.screen_name, dpc.device_id, dpc.user_id, dpc.used_at, dpc.completed_at, dpc.created_at
FROM device_pairing_codes dpc
ORDER BY dpc.created_at DESC;

-- Check users
SELECT 'USERS' as info;
SELECT id, email, first_name, last_name, is_admin, created_at
FROM users
ORDER BY created_at DESC;

-- Summary statistics
SELECT 'SUMMARY' as info;
SELECT 
  (SELECT COUNT(*) FROM devices) as total_devices,
  (SELECT COUNT(*) FROM devices WHERE user_id IS NOT NULL) as devices_with_users,
  (SELECT COUNT(*) FROM device_pairing_codes) as total_pairing_codes,
  (SELECT COUNT(*) FROM device_pairing_codes WHERE completed_at IS NOT NULL) as completed_pairings,
  (SELECT COUNT(*) FROM users) as total_users;
