import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    console.log("🔍 Debug: Starting password reset...")
    console.log("🔍 Token:", token?.substring(0, 10) + "...")
    console.log("🔍 Password length:", password?.length)

    // Step 1: Find the user
    const users = await sql`
      SELECT id, email, reset_token, reset_token_expires
      FROM users 
      WHERE reset_token = ${token}
    `

    console.log("📊 Users found:", users.length)

    if (users.length === 0) {
      return NextResponse.json({ error: "No user found with that token" })
    }

    const user = users[0]
    console.log("👤 User found:", {
      id: user.id,
      email: user.email,
      idType: typeof user.id,
      tokenMatch: user.reset_token === token,
    })

    // Step 2: Try the simplest possible update
    try {
      console.log("🔄 Attempting simple update...")

      const result = await sql`
        UPDATE users 
        SET password = 'test123'
        WHERE id = ${user.id}
        RETURNING id, email
      `

      console.log("✅ Update successful:", result)
      return NextResponse.json({
        success: true,
        message: "Update worked!",
        result: result,
      })
    } catch (updateError) {
      console.error("❌ Update failed:", {
        message: updateError.message,
        code: updateError.code,
        detail: updateError.detail,
        hint: updateError.hint,
        constraint: updateError.constraint,
        table: updateError.table,
        column: updateError.column,
      })

      return NextResponse.json({
        error: "Update failed",
        details: {
          message: updateError.message,
          code: updateError.code,
          detail: updateError.detail,
          hint: updateError.hint,
        },
      })
    }
  } catch (error) {
    console.error("❌ General error:", error)
    return NextResponse.json({
      error: "General error",
      details: error.message,
    })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Debug endpoint ready" })
}
