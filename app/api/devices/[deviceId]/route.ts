import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

// DELETE device
export async function DELETE(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🗑️ [DELETE DEVICE] Starting device deletion...")

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { deviceId } = params
    console.log("🗑️ [DELETE DEVICE] Request:", { deviceId, userId: user.id })

    // Verify device belongs to user
    const deviceCheck = await sql`
      SELECT id, name, user_id 
      FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    if (deviceCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    const deviceName = deviceCheck[0].name

    // Delete device heartbeats first (foreign key constraint)
    await sql`
      DELETE FROM device_heartbeats 
      WHERE device_id = ${deviceId}
    `

    // Delete the device
    await sql`
      DELETE FROM devices 
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    console.log("🗑️ [DELETE DEVICE] Device deleted successfully:", deviceName)

    return NextResponse.json({
      success: true,
      message: `Device "${deviceName}" deleted successfully`,
    })
  } catch (error) {
    console.error("🗑️ [DELETE DEVICE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// GET device details
export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { deviceId } = params

    const device = await sql`
      SELECT 
        d.*,
        p.name as assigned_playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.id = ${deviceId} AND d.user_id = ${user.id}
    `

    if (device.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device: device[0],
    })
  } catch (error) {
    console.error("Error fetching device:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT device (update settings)
export async function PUT(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { deviceId } = params
    const body = await request.json()
    const { name, device_type, platform, screen_resolution } = body

    // Verify device belongs to user
    const deviceCheck = await sql`
      SELECT id FROM devices WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    if (deviceCheck.length === 0) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    // Update device
    await sql`
      UPDATE devices 
      SET 
        name = ${name},
        device_type = ${device_type},
        platform = ${platform},
        screen_resolution = ${screen_resolution},
        updated_at = NOW()
      WHERE id = ${deviceId} AND user_id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Device updated successfully",
    })
  } catch (error) {
    console.error("Error updating device:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
