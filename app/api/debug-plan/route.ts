import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const sql = getDb()

    // Test database connection
    const testResult = await sql`SELECT NOW() as current_time`

    // Check if user exists
    const userCheck = user ? await sql`SELECT * FROM users WHERE id = ${user.id}` : []

    // Check plan_limits table
    const planLimitsCheck = await sql`SELECT * FROM plan_limits LIMIT 3`

    return NextResponse.json({
      database_connection: testResult[0],
      current_user: user ? { id: user.id, email: user.email } : null,
      user_in_db: userCheck[0] || null,
      plan_limits_available: planLimitsCheck,
      tables_exist: {
        users: userCheck.length > 0 || "No user found",
        plan_limits: planLimitsCheck.length > 0 || "No plan limits found",
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    })
  }
}
