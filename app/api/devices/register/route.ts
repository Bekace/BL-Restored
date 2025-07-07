import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("📱 [DEVICE REGISTER] Starting device registration...")

    const body = await request.json()
    const { deviceCode, pairingCode, name, deviceType, type, platform, userAgent, screenResolution, capabilities } =
      body

    // Support both deviceCode and pairingCode for backward compatibility
    const code = deviceCode || pairingCode

    console.log("📱 [DEVICE REGISTER] Registration request:", {
      code,
      name,
      deviceType: deviceType || type,
      platform,
      screenResolution,
      capabilities,
    })

    if (!code || !name) {
      return NextResponse.json(
        {
          success: false,
          error: "Pairing code and device name are required",
        },
        { status: 400 },
      )
    }

    // Find the pairing code
    const pairingRecord = await sql`
      SELECT 
        id,
        code,
        screen_name,
        device_type,
        user_id,
        expires_at,
        device_id
      FROM device_pairing_codes 
      WHERE code = ${code}
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (pairingRecord.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired pairing code",
        },
        { status: 400 },
      )
    }

    const pairing = pairingRecord[0]

    // Check if device already exists for this pairing code
    if (pairing.device_id) {
      console.log("📱 [DEVICE REGISTER] Device already registered for this code")

      // Update existing device with latest info
      const updatedDevice = await sql`
        UPDATE devices 
        SET 
          last_seen = NOW(),
          status = 'online',
          updated_at = NOW()
        WHERE id = ${pairing.device_id}
        RETURNING id, name, device_type, status
      `

      return NextResponse.json({
        success: true,
        device: updatedDevice[0],
        message: "Device reconnected successfully",
      })
    }

    // Create new device - only use columns that exist in the database
    const deviceResult = await sql`
      INSERT INTO devices (
        name,
        device_type,
        status,
        platform,
        capabilities,
        screen_resolution,
        created_at,
        last_seen,
        updated_at
      ) VALUES (
        ${name},
        ${deviceType || type || pairing.device_type},
        'online',
        ${platform || "unknown"},
        ${JSON.stringify(capabilities || [])},
        ${screenResolution || "unknown"},
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id, name, device_type, status, created_at
    `

    const device = deviceResult[0]

    // Link the device to the pairing code
    await sql`
      UPDATE device_pairing_codes 
      SET 
        device_id = ${device.id},
        used_at = NOW()
      WHERE id = ${pairing.id}
    `

    console.log("📱 [DEVICE REGISTER] Device registered successfully:", {
      deviceId: device.id,
      deviceName: device.name,
      pairingCode: code,
    })

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        deviceType: device.device_type,
        status: device.status,
        createdAt: device.created_at,
      },
      message: "Device registered successfully",
    })
  } catch (error) {
    console.error("📱 [DEVICE REGISTER] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to register device",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
