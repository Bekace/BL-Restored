import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    console.log("🔍 Looking for reset token...")

    // Find user with this token
    const users = await sql`
      SELECT id, email, reset_token, reset_token_expires
      FROM users 
      WHERE reset_token = ${token}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 })
    }

    const user = users[0]
    console.log("👤 Found user ID:", user.id)

    // Check if token is expired
    const expiresAt = new Date(user.reset_token_expires)
    const now = new Date()

    if (expiresAt < now) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    console.log("✅ Token is valid, updating password...")

    // Update password using the correct column name
    await sql`
      UPDATE users 
      SET password_hash = ${password},
          reset_token = NULL,
          reset_token_expires = NULL
      WHERE id = ${user.id}
    `

    console.log("✅ Password updated successfully")

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("❌ Reset password error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Reset password endpoint is working",
    method: "POST required",
    status: "OK",
  })
}
