import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🖥️ [CREATE SCREEN] Starting screen creation...")

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { pairingCode } = body

    console.log("🖥️ [CREATE SCREEN] Request:", { pairingCode, userId: user.id })

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Find the pairing code and associated device
    const pairingResult = await sql`
      SELECT 
        pc.id as pairing_id,
        pc.code,
        pc.screen_name,
        pc.device_type,
        pc.user_id,
        pc.device_id,
        pc.used_at,
        pc.completed_at,
        d.id as device_id,
        d.name as device_name,
        d.device_type as device_device_type,
        d.status as device_status
      FROM device_pairing_codes pc
      LEFT JOIN devices d ON pc.device_id = d.id
      WHERE pc.code = ${pairingCode}
      AND pc.user_id = ${user.id}
      AND pc.expires_at > NOW()
      ORDER BY pc.created_at DESC
      LIMIT 1
    `

    if (pairingResult.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid pairing code or not authorized" }, { status: 400 })
    }

    const pairing = pairingResult[0]

    if (!pairing.device_id) {
      return NextResponse.json(
        { success: false, error: "Device not connected yet. Please connect the device first." },
        { status: 400 },
      )
    }

    // Update the device to assign it to the user and mark as active
    const updatedDevice = await sql`
      UPDATE devices 
      SET 
        user_id = ${user.id},
        status = 'online',
        last_seen = NOW(),
        updated_at = NOW()
      WHERE id = ${pairing.device_id}
      RETURNING id, name, device_type, status, created_at, updated_at
    `

    if (updatedDevice.length === 0) {
      return NextResponse.json({ success: false, error: "Failed to update device" }, { status: 500 })
    }

    // Mark pairing as completed
    await sql`
      UPDATE device_pairing_codes 
      SET completed_at = NOW()
      WHERE id = ${pairing.pairing_id}
    `

    const screen = updatedDevice[0]

    console.log("🖥️ [CREATE SCREEN] Screen created successfully:", {
      screenId: screen.id,
      screenName: screen.name,
      deviceType: screen.device_type,
      status: screen.status,
    })

    return NextResponse.json({
      success: true,
      screen: {
        id: screen.id,
        name: screen.name,
        deviceType: screen.device_type,
        status: screen.status,
        createdAt: screen.created_at,
        updatedAt: screen.updated_at,
      },
      message: "Screen created successfully",
    })
  } catch (error) {
    console.error("🖥️ [CREATE SCREEN] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create screen",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
