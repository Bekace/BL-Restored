import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    console.log("Debug: Starting admin debug check")

    const user = await getCurrentUser()
    console.log("Debug: Current user:", user)

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated", step: "auth" }, { status: 401 })
    }

    const sql = getDb()
    console.log("Debug: Database connection established")

    // Check if users table has is_admin column
    try {
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_admin'
      `
      console.log("Debug: is_admin column info:", tableInfo)
    } catch (err) {
      console.log("Debug: Error checking is_admin column:", err)
    }

    // Check if user is admin
    try {
      const adminCheck = await sql`
        SELECT id, email, is_admin FROM users WHERE id = ${user.id}
      `
      console.log("Debug: User admin check:", adminCheck)

      if (adminCheck.length === 0) {
        return NextResponse.json({ success: false, message: "User not found", step: "user_lookup" }, { status: 404 })
      }

      const userRecord = adminCheck[0]
      if (!userRecord.is_admin) {
        return NextResponse.json(
          {
            success: false,
            message: "Access denied - not admin",
            step: "admin_check",
            user: userRecord,
          },
          { status: 403 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Admin access confirmed",
        user: userRecord,
        step: "success",
      })
    } catch (err) {
      console.log("Debug: Error in admin check:", err)
      return NextResponse.json(
        {
          success: false,
          message: "Database error in admin check",
          error: err.message,
          step: "admin_check_error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Debug: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
        step: "general_error",
      },
      { status: 500 },
    )
  }
}
