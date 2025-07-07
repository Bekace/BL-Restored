import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

// GET all devices for the current user
export async function GET(request: NextRequest) {
  try {
    console.log("📱 [DEVICES] Fetching devices...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("📱 [DEVICES] No user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("📱 [DEVICES] User ID:", user.id)

    // Fetch devices with playlist information
    const devices = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.last_seen,
        d.created_at,
        d.updated_at,
        d.assigned_playlist_id,
        d.playlist_status,
        d.platform,
        d.screen_resolution,
        p.name as assigned_playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.user_id = ${user.id}
      ORDER BY d.created_at DESC
    `

    console.log("📱 [DEVICES] Found devices:", devices.length)

    return NextResponse.json({
      success: true,
      devices: devices,
    })
  } catch (error) {
    console.error("📱 [DEVICES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch devices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST create new device
export async function POST(request: NextRequest) {
  try {
    console.log("📱 [DEVICES] Creating new device...")

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, device_type, platform, screen_resolution, pairing_code } = body

    console.log("📱 [DEVICES] Create request:", { name, device_type, platform, userId: user.id })

    // Verify pairing code if provided
    if (pairing_code) {
      const pairingCheck = await sql`
        SELECT id, device_name, device_type, platform, screen_resolution
        FROM device_pairing_codes 
        WHERE code = ${pairing_code} 
        AND expires_at > NOW() 
        AND completed_at IS NULL
      `

      if (pairingCheck.length === 0) {
        return NextResponse.json({ success: false, error: "Invalid or expired pairing code" }, { status: 400 })
      }

      const pairingData = pairingCheck[0]

      // Create device from pairing data
      const result = await sql`
        INSERT INTO devices (
          user_id, 
          name, 
          device_type, 
          platform, 
          screen_resolution, 
          status, 
          created_at, 
          updated_at
        )
        VALUES (
          ${user.id}, 
          ${pairingData.device_name || name}, 
          ${pairingData.device_type || device_type}, 
          ${pairingData.platform || platform}, 
          ${pairingData.screen_resolution || screen_resolution}, 
          'offline', 
          NOW(), 
          NOW()
        )
        RETURNING id, name
      `

      // Mark pairing code as completed
      await sql`
        UPDATE device_pairing_codes 
        SET completed_at = NOW(), device_id = ${result[0].id}
        WHERE code = ${pairing_code}
      `

      console.log("📱 [DEVICES] Device created from pairing code:", result[0])

      return NextResponse.json({
        success: true,
        message: "Device paired successfully",
        device: result[0],
      })
    } else {
      // Create device manually
      const result = await sql`
        INSERT INTO devices (
          user_id, 
          name, 
          device_type, 
          platform, 
          screen_resolution, 
          status, 
          created_at, 
          updated_at
        )
        VALUES (
          ${user.id}, 
          ${name}, 
          ${device_type || "web_browser"}, 
          ${platform || "Web"}, 
          ${screen_resolution || "1920x1080"}, 
          'offline', 
          NOW(), 
          NOW()
        )
        RETURNING id, name
      `

      console.log("📱 [DEVICES] Device created manually:", result[0])

      return NextResponse.json({
        success: true,
        message: "Device created successfully",
        device: result[0],
      })
    }
  } catch (error) {
    console.error("📱 [DEVICES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
