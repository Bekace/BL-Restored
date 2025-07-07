import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sql = getDb()

    // Get actual count from media_files table
    const actualCount = await sql`
      SELECT COUNT(*) as actual_count 
      FROM media_files 
      WHERE user_id = ${user.id}
    `

    // Get stored count from users table
    const storedCount = await sql`
      SELECT media_files_count, storage_used_bytes 
      FROM users 
      WHERE id = ${user.id}
    `

    // Get actual storage used
    const actualStorage = await sql`
      SELECT COALESCE(SUM(file_size), 0) as actual_storage 
      FROM media_files 
      WHERE user_id = ${user.id}
    `

    // List all files for debugging
    const allFiles = await sql`
      SELECT id, original_name, file_size, created_at 
      FROM media_files 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      user_id: user.id,
      actual_files_count: Number(actualCount[0].actual_count),
      stored_files_count: storedCount[0].media_files_count,
      actual_storage_bytes: Number(actualStorage[0].actual_storage),
      stored_storage_bytes: storedCount[0].storage_used_bytes,
      files: allFiles,
      mismatch: {
        files: Number(actualCount[0].actual_count) !== storedCount[0].media_files_count,
        storage: Number(actualStorage[0].actual_storage) !== Number(storedCount[0].storage_used_bytes),
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Debug failed" }, { status: 500 })
  }
}
