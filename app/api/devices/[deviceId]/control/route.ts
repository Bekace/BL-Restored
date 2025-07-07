import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎮 [DEVICE CONTROL API] POST request for device:", params.deviceId)

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("❌ [DEVICE CONTROL API] No token provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number }
    console.log("✅ [DEVICE CONTROL API] Token verified for user:", decoded.userId)

    const { action } = await request.json()
    console.log("🎮 [DEVICE CONTROL API] Control action:", action, "for device:", params.deviceId)

    // Validate action
    const validActions = ["play", "pause", "stop", "restart"]
    if (!validActions.includes(action)) {
      console.log("❌ [DEVICE CONTROL API] Invalid action:", action)
      return NextResponse.json({ success: false, error: "Invalid control action" }, { status: 400 })
    }

    // Verify device ownership and get current status
    const deviceResult = await sql`
      SELECT d.id, d.name, d.status, d.assigned_playlist_id, d.playlist_status, p.name as playlist_name
      FROM devices d
      LEFT JOIN playlists p ON d.assigned_playlist_id = p.id
      WHERE d.id = ${params.deviceId} AND d.user_id = ${decoded.userId}
    `

    if (deviceResult.length === 0) {
      console.log("❌ [DEVICE CONTROL API] Device not found or not owned by user")
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]

    // Check if device is online
    if (device.status !== "online") {
      console.log("❌ [DEVICE CONTROL API] Device is offline")
      return NextResponse.json({ success: false, error: "Device is offline" }, { status: 400 })
    }

    // Check if playlist is assigned for play/restart actions
    if ((action === "play" || action === "restart") && !device.assigned_playlist_id) {
      console.log("❌ [DEVICE CONTROL API] No playlist assigned for play/restart action")
      return NextResponse.json({ success: false, error: "No playlist assigned to device" }, { status: 400 })
    }

    // Map control actions to playlist status
    const statusMap: Record<string, string> = {
      play: "playing",
      pause: "paused",
      stop: "stopped",
      restart: "playing",
    }

    const newStatus = statusMap[action]
    console.log("🎮 [DEVICE CONTROL API] Updating playlist status to:", newStatus)

    // Update device status
    await sql`
      UPDATE devices 
      SET playlist_status = ${newStatus},
          last_control_action = ${action},
          last_control_time = NOW(),
          updated_at = NOW()
      WHERE id = ${params.deviceId}
    `

    console.log("✅ [DEVICE CONTROL API] Control action completed successfully")

    const actionMessages: Record<string, string> = {
      play: `Started playing "${device.playlist_name}" on "${device.name}"`,
      pause: `Paused playback on "${device.name}"`,
      stop: `Stopped playback on "${device.name}"`,
      restart: `Restarted "${device.playlist_name}" on "${device.name}"`,
    }

    return NextResponse.json({
      success: true,
      message: actionMessages[action],
      device: {
        id: device.id,
        name: device.name,
        playlistStatus: newStatus,
        lastControlAction: action,
      },
    })
  } catch (error) {
    console.error("💥 [DEVICE CONTROL API] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to control device" }, { status: 500 })
  }
}
