import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { planId: string } }) {
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
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const planId = Number.parseInt(params.planId)
    if (isNaN(planId)) {
      return NextResponse.json({ success: false, message: "Invalid plan ID" }, { status: 400 })
    }

    const {
      name,
      description,
      max_media_files,
      max_storage_bytes,
      max_screens,
      price_monthly,
      price_yearly,
      features,
      is_active,
      sort_order,
    } = await request.json()

    // Update plan
    const updatedPlan = await sql`
      UPDATE plan_templates 
      SET 
        name = ${name},
        description = ${description},
        max_media_files = ${max_media_files},
        max_storage_bytes = ${max_storage_bytes},
        max_screens = ${max_screens},
        price_monthly = ${price_monthly},
        price_yearly = ${price_yearly},
        features = ${JSON.stringify(features)},
        is_active = ${is_active},
        sort_order = ${sort_order},
        updated_at = NOW()
      WHERE id = ${planId}
      RETURNING *
    `

    if (updatedPlan.length === 0) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 })
    }

    // Get subscriber count for the updated plan
    const subscriberCount = await sql`
      SELECT COUNT(*) as count FROM users WHERE plan_type = ${updatedPlan[0].plan_type}
    `

    return NextResponse.json({
      success: true,
      plan: {
        ...updatedPlan[0],
        features:
          typeof updatedPlan[0].features === "string"
            ? JSON.parse(updatedPlan[0].features)
            : updatedPlan[0].features || [],
        subscriber_count: Number(subscriberCount[0].count) || 0,
      },
      message: "Plan updated successfully",
    })
  } catch (error) {
    console.error("Update plan error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update plan: " + error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { planId: string } }) {
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
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const planId = Number.parseInt(params.planId)
    if (isNaN(planId)) {
      return NextResponse.json({ success: false, message: "Invalid plan ID" }, { status: 400 })
    }

    // Check if plan exists and get plan_type
    const existingPlan = await sql`
      SELECT plan_type FROM plan_templates WHERE id = ${planId}
    `

    if (existingPlan.length === 0) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 })
    }

    // Check if any users are subscribed to this plan
    const subscriberCount = await sql`
      SELECT COUNT(*) as count FROM users WHERE plan_type = ${existingPlan[0].plan_type}
    `

    if (Number(subscriberCount[0].count) > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete plan with ${subscriberCount[0].count} active subscribers`,
        },
        { status: 400 },
      )
    }

    // Delete the plan
    await sql`
      DELETE FROM plan_templates WHERE id = ${planId}
    `

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    })
  } catch (error) {
    console.error("Delete plan error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete plan: " + error.message,
      },
      { status: 500 },
    )
  }
}
