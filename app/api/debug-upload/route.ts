import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    const sql = getDb()

    // Test database connection
    const dbTest = await sql`SELECT NOW() as current_time`

    // Check if media_files table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('media_files', 'users', 'plan_limits')
    `

    // Check user data
    const userCheck = user
      ? await sql`
      SELECT id, email, plan_type, media_files_count, storage_used_bytes 
      FROM users 
      WHERE id = ${user.id}
    `
      : []

    return NextResponse.json({
      database_connection: dbTest[0],
      current_user: user ? { id: user.id, email: user.email } : null,
      tables_exist: tableCheck.map((t) => t.table_name),
      user_data: userCheck[0] || null,
      blob_token: process.env.BLOB_READ_WRITE_TOKEN ? "✅ Available" : "❌ Missing",
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    })
  }
}
