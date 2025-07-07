import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG PLAN UPDATE] Starting debug check")

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check admin status
    const adminCheck = await sql`
      SELECT id, email, is_admin FROM users WHERE id = ${user.id}
    `

    // Check available plans
    const availablePlans = await sql`
      SELECT plan_type, name, is_active FROM plan_templates ORDER BY plan_type
    `

    // Check all users and their current plans
    const allUsers = await sql`
      SELECT id, email, first_name, last_name, plan_type, is_admin 
      FROM users 
      ORDER BY id
    `

    return NextResponse.json({
      success: true,
      debug: {
        currentUser: adminCheck[0] || null,
        isAdmin: adminCheck[0]?.is_admin || false,
        availablePlans,
        allUsers,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Debug plan update error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Debug check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
