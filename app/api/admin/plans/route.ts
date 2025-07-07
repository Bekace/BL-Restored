import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("Admin plans API: Starting request")

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    let adminCheck
    try {
      adminCheck = await sql`
        SELECT is_admin FROM users WHERE id = ${user.id} AND is_admin = true
      `
    } catch (err) {
      console.log("Admin plans API: is_admin column error:", err.message)
      return NextResponse.json({ success: false, message: "Admin access not configured" }, { status: 403 })
    }

    if (adminCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Check if plan_templates table exists
    try {
      // Get plans with subscriber counts
      const plansWithCounts = await sql`
        SELECT 
          pt.*,
          COALESCE(user_counts.subscriber_count, 0) as subscriber_count
        FROM plan_templates pt
        LEFT JOIN (
          SELECT 
            plan_type,
            COUNT(*) as subscriber_count
          FROM users 
          WHERE plan_type IS NOT NULL
          GROUP BY plan_type
        ) user_counts ON pt.plan_type = user_counts.plan_type
        ORDER BY pt.sort_order ASC, pt.created_at ASC
      `

      console.log("Admin plans API: Found", plansWithCounts.length, "plans with subscriber counts")

      return NextResponse.json({
        success: true,
        plans: plansWithCounts.map((plan) => ({
          ...plan,
          features: typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features || [],
          subscriber_count: Number(plan.subscriber_count) || 0,
        })),
      })
    } catch (tableErr) {
      console.log("Admin plans API: plan_templates table error:", tableErr.message)

      // Return empty plans if table doesn't exist yet
      return NextResponse.json({
        success: true,
        plans: [],
        message: "Plan templates table not found - please run database setup",
      })
    }
  } catch (error) {
    console.error("Admin plans API: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + error.message,
      },
      { status: 500 },
    )
  }
}

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
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const {
      plan_type,
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

    console.log("Creating plan with data:", {
      plan_type,
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
    })

    // Create new plan
    const newPlan = await sql`
      INSERT INTO plan_templates (
        plan_type, name, description, max_media_files, max_storage_bytes, 
        max_screens, price_monthly, price_yearly, features, is_active, sort_order
      ) VALUES (
        ${plan_type}, ${name}, ${description}, ${max_media_files}, ${max_storage_bytes},
        ${max_screens}, ${price_monthly}, ${price_yearly}, ${JSON.stringify(features)}, 
        ${is_active}, ${sort_order}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      plan: {
        ...newPlan[0],
        features: typeof newPlan[0].features === "string" ? JSON.parse(newPlan[0].features) : newPlan[0].features || [],
        subscriber_count: 0, // New plans start with 0 subscribers
      },
      message: "Plan created successfully",
    })
  } catch (error) {
    console.error("Create plan error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create plan: " + error.message,
      },
      { status: 500 },
    )
  }
}
