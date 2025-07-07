import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [CHECK CONNECTION] Starting connection check...")

    const body = await request.json()
    const { pairingCode } = body

    console.log("🔍 [CHECK CONNECTION] Checking code:", pairingCode)

    if (!pairingCode) {
      return NextResponse.json({ success: false, error: "Pairing code is required" }, { status: 400 })
    }

    // Check if pairing code exists and get device info
    const result = await sql`
      SELECT 
        pc.id,
        pc.code,
        pc.screen_name,
        pc.device_type,
        pc.user_id,
        pc.expires_at,
        pc.used_at,
        pc.device_id,
        pc.completed_at,
        d.id as device_exists,
        d.name as device_name,
        d.status as device_status
      FROM device_pairing_codes pc
      LEFT JOIN devices d ON pc.device_id = d.id
      WHERE pc.code = ${pairingCode}
      AND pc.expires_at > NOW()
      ORDER BY pc.created_at DESC
      LIMIT 1
    `

    console.log("🔍 [CHECK CONNECTION] Query result:", result)

    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: "Invalid or expired pairing code",
      })
    }

    const pairing = result[0]

    // Check if device is connected
    const isConnected = pairing.device_exists && pairing.used_at
    const isCompleted = pairing.completed_at !== null

    console.log("🔍 [CHECK CONNECTION] Status:", {
      isConnected,
      isCompleted,
      deviceExists: !!pairing.device_exists,
      usedAt: pairing.used_at,
      completedAt: pairing.completed_at,
    })

    return NextResponse.json({
      success: true,
      connected: isConnected,
      completed: isCompleted,
      pairingInfo: {
        code: pairing.code,
        screenName: pairing.screen_name,
        deviceType: pairing.device_type,
        expiresAt: pairing.expires_at,
        usedAt: pairing.used_at,
        completedAt: pairing.completed_at,
      },
      deviceInfo: pairing.device_exists
        ? {
            id: pairing.device_id,
            name: pairing.device_name,
            status: pairing.device_status,
          }
        : null,
    })
  } catch (error) {
    console.error("🔍 [CHECK CONNECTION] Error:", error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: "Failed to check connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
