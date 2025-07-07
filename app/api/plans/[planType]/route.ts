import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { planType: string } }) {
  try {
    const { planType } = params
    const sql = getDb()

    // Get plan limits from plan_templates table
    const planData = await sql`
      SELECT 
        plan_type,
        max_media_files,
        max_storage_bytes,
        max_screens,
        price_monthly,
        features
      FROM plan_templates 
      WHERE plan_type = ${planType} AND is_active = true
      LIMIT 1
    `

    if (planData.length === 0) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 })
    }

    const plan = planData[0]

    return NextResponse.json({
      success: true,
      plan: {
        plan_type: plan.plan_type,
        max_media_files: Number(plan.max_media_files),
        max_storage_bytes: Number(plan.max_storage_bytes),
        max_screens: Number(plan.max_screens),
        price_monthly: Number(plan.price_monthly),
        features: typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features || [],
      },
    })
  } catch (error) {
    console.error("Get plan limits error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch plan limits" }, { status: 500 })
  }
}
