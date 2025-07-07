import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = params.deviceId
    const body = await request.json()
    const { status = "online", currentItem = null, progress = 0, performanceMetrics = {}, timestamp } = body

    console.log(`💓 [HEARTBEAT] Device ${deviceId}:`, {
      status,
      currentItem,
      progress,
      performanceMetrics,
    })

    // First, verify the device exists
    const deviceCheck = await sql`
      SELECT id, name, user_id FROM devices WHERE id = ${Number.parseInt(deviceId)}
    `

    if (deviceCheck.length === 0) {
      console.error(`❌ [HEARTBEAT] Device ${deviceId} not found`)
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    // Update device status and last seen
    await sql`
      UPDATE devices 
      SET 
        status = ${status},
        last_seen = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${Number.parseInt(deviceId)}
    `

    // Insert or update heartbeat record
    const heartbeatResult = await sql`
      INSERT INTO device_heartbeats (
        device_id, 
        status, 
        current_item_id, 
        progress, 
        performance_metrics, 
        created_at,
        updated_at
      )
      VALUES (
        ${Number.parseInt(deviceId)}, 
        ${status}, 
        ${currentItem ? Number.parseInt(currentItem) : null}, 
        ${Number.parseFloat(progress)}, 
        ${JSON.stringify(performanceMetrics)}, 
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (device_id) DO UPDATE SET
        status = EXCLUDED.status,
        current_item_id = EXCLUDED.current_item_id,
        progress = EXCLUDED.progress,
        performance_metrics = EXCLUDED.performance_metrics,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, created_at, updated_at
    `

    console.log(`✅ [HEARTBEAT] Recorded for device ${deviceId}:`, heartbeatResult[0])

    return NextResponse.json({
      success: true,
      message: "Heartbeat recorded successfully",
      data: {
        deviceId: Number.parseInt(deviceId),
        heartbeatId: heartbeatResult[0]?.id,
        timestamp: new Date().toISOString(),
        status,
        progress: Number.parseFloat(progress),
      },
    })
  } catch (error) {
    console.error(`❌ [HEARTBEAT] Error for device ${params.deviceId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record heartbeat",
        details: error instanceof Error ? error.message : "Unknown error",
        deviceId: params.deviceId,
      },
      { status: 500 },
    )
  }
}
