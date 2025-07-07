import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${user.id} AND is_admin = true
    `

    if (adminCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const { userId, plan } = await request.json()

    if (!userId || !plan) {
      return NextResponse.json({ success: false, message: "userId and plan are required" }, { status: 400 })
    }

    // Test the update
    const updateResult = await sql`
      UPDATE users 
      SET plan_type = ${plan}
      WHERE id = ${userId}
      RETURNING id, email, plan_type
    `

    return NextResponse.json({
      success: true,
      message: "Test update successful",
      result: updateResult[0] || null,
    })
  } catch (error) {
    console.error("Test plan update error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Test update failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
