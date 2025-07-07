import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 [DEBUG DEVICES] Starting debug query...")

    // Get all devices with user and pairing information
    const devices = await sql`
      SELECT 
        d.id as device_id,
        d.name as device_name,
        d.device_type,
        d.status,
        d.user_id,
        d.created_at as device_created,
        d.updated_at as device_updated,
        u.email as user_email,
        dpc.code as pairing_code,
        dpc.screen_name,
        dpc.used_at,
        dpc.completed_at,
        dpc.created_at as pairing_created
      FROM devices d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN device_pairing_codes dpc ON d.id = dpc.device_id
      ORDER BY d.created_at DESC
    `

    // Get table structure
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'devices' 
      ORDER BY ordinal_position
    `

    // Get user count
    const userCountResult = await sql`SELECT COUNT(*) as count FROM users`
    const userCount = userCountResult[0]?.count || 0

    // Calculate summary
    const summary = {
      totalDevices: devices.length,
      devicesWithUsers: devices.filter((d) => d.user_id !== null).length,
      devicesWithPairing: devices.filter((d) => d.pairing_code !== null).length,
      completedPairings: devices.filter((d) => d.completed_at !== null).length,
    }

    console.log("🔍 [DEBUG DEVICES] Summary:", summary)
    console.log("🔍 [DEBUG DEVICES] Devices:", devices)

    return NextResponse.json({
      success: true,
      data: {
        devices,
        tableStructure,
        userCount,
        summary,
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG DEVICES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to debug devices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
