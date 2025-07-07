import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

function generatePairingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔗 [GENERATE CODE] Starting pairing code generation...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🔗 [GENERATE CODE] No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { screenName, deviceType } = body

    console.log("🔗 [GENERATE CODE] Request:", { screenName, deviceType, userId: user.id })

    if (!screenName || !deviceType) {
      return NextResponse.json(
        {
          success: false,
          error: "Screen name and device type are required",
        },
        { status: 400 },
      )
    }

    // Generate a unique pairing code
    let pairingCode = ""
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      pairingCode = generatePairingCode()

      const existing = await sql`
        SELECT id FROM device_pairing_codes 
        WHERE code = ${pairingCode} 
        AND expires_at > NOW()
      `

      isUnique = existing.length === 0
      attempts++
    }

    if (!isUnique) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate unique pairing code",
        },
        { status: 500 },
      )
    }

    // Insert the pairing code into the database
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    const insertResult = await sql`
      INSERT INTO device_pairing_codes (
        code, 
        screen_name, 
        device_type, 
        user_id, 
        expires_at,
        created_at
      ) VALUES (
        ${pairingCode},
        ${screenName},
        ${deviceType},
        ${user.id},
        ${expiresAt.toISOString()},
        NOW()
      )
      RETURNING id, code, screen_name, device_type, expires_at, created_at
    `

    const pairingRecord = insertResult[0]

    console.log("🔗 [GENERATE CODE] Pairing code created:", {
      code: pairingRecord.code,
      screenName: pairingRecord.screen_name,
      deviceType: pairingRecord.device_type,
      expiresAt: pairingRecord.expires_at,
    })

    return NextResponse.json({
      success: true,
      pairingCode: pairingRecord.code,
      code: pairingRecord.code, // For backward compatibility
      screenName: pairingRecord.screen_name,
      deviceType: pairingRecord.device_type,
      expiresAt: pairingRecord.expires_at,
      message: "Pairing code generated successfully",
    })
  } catch (error) {
    console.error("🔗 [GENERATE CODE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate pairing code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
