-- Create device heartbeats table if it doesn't exist
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'online',
    current_item_id INTEGER,
    progress DECIMAL(5,2) DEFAULT 0,
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id)
);

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'device_heartbeats_device_id_fkey'
    ) THEN
        ALTER TABLE device_heartbeats 
        ADD CONSTRAINT device_heartbeats_device_id_fkey 
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_created_at ON device_heartbeats(created_at);

-- Insert some test heartbeat data
INSERT INTO device_heartbeats (device_id, status, current_item_id, progress, performance_metrics, created_at, updated_at)
SELECT 
    d.id,
    'online',
    NULL,
    0,
    '{"cpu": 45, "memory": 60, "network": "good"}',
    CURRENT_TIMESTAMP - INTERVAL '5 minutes',
    CURRENT_TIMESTAMP - INTERVAL '5 minutes'
FROM devices d
WHERE NOT EXISTS (
    SELECT 1 FROM device_heartbeats h WHERE h.device_id = d.id
)
LIMIT 5;
