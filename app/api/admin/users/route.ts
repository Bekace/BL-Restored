import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    console.log("Admin users API: Starting request")

    const user = await getCurrentUser()
    console.log("Admin users API: Current user:", user?.email, user?.id)

    if (!user) {
      console.log("Admin users API: No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`
      SELECT is_admin FROM users WHERE id = ${user.id}
    `

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      console.log("Admin users API: User is not admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("Admin users API: User is admin, fetching users")

    // Get all users with their usage data
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name as "firstName",
        u.last_name as "lastName", 
        u.company,
        u.plan_type as plan,
        u.created_at as "createdAt",
        u.is_admin as "isAdmin",
        COALESCE(u.media_files_count, 0) as "mediaCount",
        COALESCE(u.storage_used_bytes, 0) as "storageUsed"
      FROM users u
      ORDER BY u.created_at DESC
    `

    console.log("Admin users API: Found", users.length, "users")

    return NextResponse.json({
      success: true,
      users: users,
    })
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
