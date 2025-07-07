import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    const sql = getDb()

    console.log("Starting device migration...")

    // Add assigned_playlist_id column if it doesn't exist
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'devices' AND column_name = 'assigned_playlist_id') THEN
              ALTER TABLE devices ADD COLUMN assigned_playlist_id INTEGER REFERENCES playlists(id) ON DELETE SET NULL;
              RAISE NOTICE 'Added assigned_playlist_id column to devices table';
          ELSE
              RAISE NOTICE 'assigned_playlist_id column already exists in devices table';
          END IF;
        END $$;
      `
      console.log("✓ assigned_playlist_id column processed")
    } catch (error) {
      console.log("assigned_playlist_id column error:", error.message)
    }

    // Add playlist_status column if it doesn't exist
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'devices' AND column_name = 'playlist_status') THEN
              ALTER TABLE devices ADD COLUMN playlist_status VARCHAR(20) DEFAULT 'none';
              RAISE NOTICE 'Added playlist_status column to devices table';
          ELSE
              RAISE NOTICE 'playlist_status column already exists in devices table';
          END IF;
        END $$;
      `
      console.log("✓ playlist_status column processed")
    } catch (error) {
      console.log("playlist_status column error:", error.message)
    }

    // Add last_control_action column if it doesn't exist
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'devices' AND column_name = 'last_control_action') THEN
              ALTER TABLE devices ADD COLUMN last_control_action VARCHAR(50);
              RAISE NOTICE 'Added last_control_action column to devices table';
          ELSE
              RAISE NOTICE 'last_control_action column already exists in devices table';
          END IF;
        END $$;
      `
      console.log("✓ last_control_action column processed")
    } catch (error) {
      console.log("last_control_action column error:", error.message)
    }

    // Add last_control_time column if it doesn't exist
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'devices' AND column_name = 'last_control_time') THEN
              ALTER TABLE devices ADD COLUMN last_control_time TIMESTAMP;
              RAISE NOTICE 'Added last_control_time column to devices table';
          ELSE
              RAISE NOTICE 'last_control_time column already exists in devices table';
          END IF;
        END $$;
      `
      console.log("✓ last_control_time column processed")
    } catch (error) {
      console.log("last_control_time column error:", error.message)
    }

    // Add updated_at column if it doesn't exist
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'devices' AND column_name = 'updated_at') THEN
              ALTER TABLE devices ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
              RAISE NOTICE 'Added updated_at column to devices table';
          ELSE
              RAISE NOTICE 'updated_at column already exists in devices table';
          END IF;
        END $$;
      `
      console.log("✓ updated_at column processed")
    } catch (error) {
      console.log("updated_at column error:", error.message)
    }

    // Create indexes
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                         WHERE tablename = 'devices' AND indexname = 'idx_devices_assigned_playlist') THEN
              CREATE INDEX idx_devices_assigned_playlist ON devices(assigned_playlist_id);
              RAISE NOTICE 'Created index idx_devices_assigned_playlist';
          ELSE
              RAISE NOTICE 'Index idx_devices_assigned_playlist already exists';
          END IF;
        END $$;
      `
      console.log("✓ assigned_playlist index processed")
    } catch (error) {
      console.log("assigned_playlist index error:", error.message)
    }

    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                         WHERE tablename = 'devices' AND indexname = 'idx_devices_playlist_status') THEN
              CREATE INDEX idx_devices_playlist_status ON devices(playlist_status);
              RAISE NOTICE 'Created index idx_devices_playlist_status';
          ELSE
              RAISE NOTICE 'Index idx_devices_playlist_status already exists';
          END IF;
        END $$;
      `
      console.log("✓ playlist_status index processed")
    } catch (error) {
      console.log("playlist_status index error:", error.message)
    }

    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                         WHERE tablename = 'devices' AND indexname = 'idx_devices_user_id') THEN
              CREATE INDEX idx_devices_user_id ON devices(user_id);
              RAISE NOTICE 'Created index idx_devices_user_id';
          ELSE
              RAISE NOTICE 'Index idx_devices_user_id already exists';
          END IF;
        END $$;
      `
      console.log("✓ user_id index processed")
    } catch (error) {
      console.log("user_id index error:", error.message)
    }

    // Update existing devices to have default playlist status
    try {
      const updateResult = await sql`
        UPDATE devices SET playlist_status = 'none' WHERE playlist_status IS NULL
      `
      console.log("✓ Updated existing devices with default playlist_status")
    } catch (error) {
      console.log("Update playlist_status error:", error.message)
    }

    // Check final table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `

    console.log("Device migration completed successfully!")
    console.log("Final table structure:", columns)

    return NextResponse.json({
      success: true,
      message: "Device migration completed successfully",
      columns: columns,
    })
  } catch (error) {
    console.error("Device migration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Device migration failed",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
