import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get heartbeat statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total_heartbeats,
        COUNT(DISTINCT device_id) as unique_devices,
        COUNT(CASE WHEN status = 'online' THEN 1 END) as online_devices,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_devices,
        MAX(updated_at) as last_heartbeat
      FROM device_heartbeats
    `

    // Get recent heartbeat activity
    const recentActivity = await sql`
      SELECT 
        dh.device_id,
        d.name as device_name,
        d.device_type,
        dh.status,
        dh.performance_metrics,
        dh.updated_at
      FROM device_heartbeats dh
      LEFT JOIN devices d ON dh.device_id = d.id
      ORDER BY dh.updated_at DESC
      LIMIT 20
    `

    // Get devices without heartbeats
    const devicesWithoutHeartbeats = await sql`
      SELECT 
        d.id,
        d.name,
        d.device_type,
        d.status,
        d.created_at
      FROM devices d
      LEFT JOIN device_heartbeats dh ON d.id = dh.device_id
      WHERE dh.device_id IS NULL
      ORDER BY d.created_at DESC
    `

    // Get heartbeat activity over the last 24 hours
    const activityTimeline = await sql`
      SELECT 
        DATE_TRUNC('hour', updated_at) as hour,
        COUNT(*) as heartbeat_count,
        COUNT(DISTINCT device_id) as unique_devices
      FROM device_heartbeats
      WHERE updated_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', updated_at)
      ORDER BY hour DESC
    `

    return NextResponse.json({
      success: true,
      data: {
        statistics: stats[0] || {
          total_heartbeats: 0,
          unique_devices: 0,
          online_devices: 0,
          offline_devices: 0,
          last_heartbeat: null,
        },
        recentActivity: recentActivity || [],
        devicesWithoutHeartbeats: devicesWithoutHeartbeats || [],
        activityTimeline: activityTimeline || [],
      },
    })
  } catch (error) {
    console.error("[DEBUG HEARTBEATS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch heartbeat data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
