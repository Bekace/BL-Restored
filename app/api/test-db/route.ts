import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("Testing database connection...")

    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`
    console.log("Database connection successful:", result)

    // Test users table
    const users = await sql`SELECT COUNT(*) as user_count FROM users`
    console.log("Users table accessible:", users)

    // Check if reset token fields exist
    try {
      const columns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('reset_token', 'reset_token_expires')
      `
      console.log("Reset token columns:", columns)
    } catch (columnError) {
      console.log("Column check error:", columnError)
    }

    return NextResponse.json({
      success: true,
      database_time: result[0].current_time,
      user_count: users[0].user_count,
      message: "Database connection working",
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
