import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { featureId: string } }) {
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

    const feature = await sql`
      SELECT * FROM plan_features WHERE id = ${params.featureId}
    `

    if (feature.length === 0) {
      return NextResponse.json({ success: false, message: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      feature: feature[0],
    })
  } catch (error) {
    console.error("Get feature error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { featureId: string } }) {
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

    const { feature_name, description, category, is_active } = await request.json()

    // Update feature
    const updatedFeature = await sql`
      UPDATE plan_features SET
        feature_name = ${feature_name},
        description = ${description},
        category = ${category},
        is_active = ${is_active}
      WHERE id = ${params.featureId}
      RETURNING *
    `

    if (updatedFeature.length === 0) {
      return NextResponse.json({ success: false, message: "Feature not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      feature: updatedFeature[0],
      message: "Feature updated successfully",
    })
  } catch (error) {
    console.error("Update feature error:", error)
    return NextResponse.json({ success: false, message: "Failed to update feature" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { featureId: string } }) {
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

    // Check if feature exists first
    const existingFeature = await sql`
      SELECT id, feature_name FROM plan_features WHERE id = ${params.featureId}
    `

    if (existingFeature.length === 0) {
      return NextResponse.json({ success: false, message: "Feature not found" }, { status: 404 })
    }

    // Check if feature is used in any plans
    const plansUsingFeature = await sql`
      SELECT COUNT(*) as count FROM plan_templates 
      WHERE features::text LIKE '%' || ${existingFeature[0].feature_name} || '%'
    `

    if (plansUsingFeature[0].count > 0) {
      return NextResponse.json(
        { success: false, message: "Cannot delete feature that is currently used in plans" },
        { status: 400 },
      )
    }

    // Delete feature
    const deletedFeature = await sql`
      DELETE FROM plan_features WHERE id = ${params.featureId}
      RETURNING *
    `

    if (deletedFeature.length === 0) {
      return NextResponse.json({ success: false, message: "Failed to delete feature" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully",
    })
  } catch (error) {
    console.error("Delete feature error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete feature" }, { status: 500 })
  }
}
