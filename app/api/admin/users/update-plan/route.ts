import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [UPDATE PLAN] Starting plan update...")

    // Check if user is admin
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Verify admin status
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${currentUser.id}
    `

    if (!adminCheck[0]?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userEmail, newPlan } = await request.json()
    console.log("📊 [UPDATE PLAN] Request:", { userEmail, newPlan })

    if (!userEmail || !newPlan) {
      return NextResponse.json({ error: "User email and plan are required" }, { status: 400 })
    }

    // Verify the plan exists
    const planCheck = await sql`
      SELECT * FROM plan_limits WHERE plan_type = ${newPlan}
    `

    if (planCheck.length === 0) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    console.log("✅ [UPDATE PLAN] Plan verified:", planCheck[0])

    // Update the user's plan
    const updateResult = await sql`
      UPDATE users 
      SET 
        plan_type = ${newPlan},
        updated_at = NOW()
      WHERE email = ${userEmail}
      RETURNING id, email, plan_type, updated_at
    `

    if (updateResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ [UPDATE PLAN] User updated:", updateResult[0])

    return NextResponse.json({
      success: true,
      message: `User ${userEmail} updated to ${newPlan} plan`,
      user: updateResult[0],
    })
  } catch (error) {
    console.error("❌ [UPDATE PLAN] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update user plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
