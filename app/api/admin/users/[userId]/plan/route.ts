import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    console.log("🔍 [ADMIN PLAN UPDATE] === STARTING PLAN UPDATE ===")
    console.log("🔍 [ADMIN PLAN UPDATE] Target user ID:", params.userId)

    // Get current user (admin)
    const user = await getCurrentUser()
    console.log("🔍 [ADMIN PLAN UPDATE] Admin user:", user ? { id: user.id, email: user.email } : "NO USER")

    if (!user) {
      console.log("❌ [ADMIN PLAN UPDATE] Not authenticated")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    console.log("🔍 [ADMIN PLAN UPDATE] Checking admin privileges for user:", user.id)
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${user.id} AND is_admin = true
    `
    console.log("📊 [ADMIN PLAN UPDATE] Admin check result:", adminCheck)

    if (adminCheck.length === 0) {
      console.log("❌ [ADMIN PLAN UPDATE] Access denied - not admin")
      return NextResponse.json(
        { success: false, message: "Access denied - admin privileges required" },
        { status: 403 },
      )
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
      console.log("📊 [ADMIN PLAN UPDATE] Request body:", requestBody)
    } catch (parseError) {
      console.error("❌ [ADMIN PLAN UPDATE] Failed to parse request body:", parseError)
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 })
    }

    const { plan } = requestBody

    if (!plan) {
      console.log("❌ [ADMIN PLAN UPDATE] No plan specified")
      return NextResponse.json({ success: false, message: "Plan is required" }, { status: 400 })
    }

    // Validate target user exists
    console.log("🔍 [ADMIN PLAN UPDATE] Checking if target user exists:", params.userId)
    const targetUserCheck = await sql`
      SELECT id, email, first_name, last_name, plan_type 
      FROM users 
      WHERE id = ${params.userId}
    `
    console.log("📊 [ADMIN PLAN UPDATE] Target user check:", targetUserCheck)

    if (targetUserCheck.length === 0) {
      console.log("❌ [ADMIN PLAN UPDATE] Target user not found")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const targetUser = targetUserCheck[0]
    console.log("✅ [ADMIN PLAN UPDATE] Target user found:", {
      id: targetUser.id,
      email: targetUser.email,
      currentPlan: targetUser.plan_type,
      newPlan: plan,
    })

    // Get available plans from database
    console.log("🔍 [ADMIN PLAN UPDATE] Fetching available plans")
    const availablePlans = await sql`
      SELECT plan_type, name, is_active FROM plan_templates WHERE is_active = true
    `
    console.log("📊 [ADMIN PLAN UPDATE] Available plans:", availablePlans)

    const validPlans = availablePlans.map((p) => p.plan_type)
    console.log("📊 [ADMIN PLAN UPDATE] Valid plan types:", validPlans)

    if (!validPlans.includes(plan)) {
      console.log("❌ [ADMIN PLAN UPDATE] Invalid plan selected:", plan)
      return NextResponse.json(
        {
          success: false,
          message: `Invalid plan selected: ${plan}. Available plans: ${validPlans.join(", ")}`,
          availablePlans: validPlans,
        },
        { status: 400 },
      )
    }

    // Update user plan
    console.log(`🔄 [ADMIN PLAN UPDATE] Updating user ${params.userId} plan from ${targetUser.plan_type} to ${plan}`)

    const updateResult = await sql`
      UPDATE users 
      SET 
        plan_type = ${plan},
        updated_at = NOW()
      WHERE id = ${params.userId}
      RETURNING id, email, first_name, last_name, plan_type, updated_at
    `
    console.log("📊 [ADMIN PLAN UPDATE] Update result:", updateResult)

    if (updateResult.length === 0) {
      console.log("❌ [ADMIN PLAN UPDATE] Update failed - no rows affected")
      return NextResponse.json({ success: false, message: "Failed to update user plan" }, { status: 500 })
    }

    const updatedUser = updateResult[0]
    console.log("✅ [ADMIN PLAN UPDATE] Plan updated successfully:", {
      userId: updatedUser.id,
      email: updatedUser.email,
      oldPlan: targetUser.plan_type,
      newPlan: updatedUser.plan_type,
      updatedAt: updatedUser.updated_at,
    })

    console.log(
      `📤 [ADMIN PLAN UPDATE] Admin ${user.id} (${user.email}) assigned plan ${plan} to user ${params.userId} (${updatedUser.email})`,
    )

    return NextResponse.json({
      success: true,
      message: `Plan updated successfully to ${plan}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        plan: updatedUser.plan_type,
        updatedAt: updatedUser.updated_at,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN PLAN UPDATE] Unexpected error:", error)
    console.error("❌ [ADMIN PLAN UPDATE] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      { status: 500 },
    )
  }
}
