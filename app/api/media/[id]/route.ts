import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fileId = Number.parseInt(params.id)
    if (isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 })
    }

    const sql = getDb()

    // First, check if the file exists and belongs to the user
    const existingFile = await sql`
      SELECT id, file_size, original_name 
      FROM media_files 
      WHERE id = ${fileId} AND user_id = ${user.id}
    `

    if (existingFile.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = existingFile[0]

    // Delete the file from the database
    await sql`
      DELETE FROM media_files 
      WHERE id = ${fileId} AND user_id = ${user.id}
    `

    // Update user's storage usage in the USERS table (not user_plans)
    await sql`
      UPDATE users 
      SET 
        media_files_count = GREATEST(0, COALESCE(media_files_count, 0) - 1),
        storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes::bigint, 0) - ${file.file_size})
      WHERE id = ${user.id}
    `

    console.log(`✅ File deleted: ${file.original_name}, Size: ${file.file_size} bytes`)

    return NextResponse.json({
      success: true,
      message: `File "${file.original_name}" deleted successfully`,
      debug: {
        file_id: fileId,
        file_size: file.file_size,
        user_id: user.id,
      },
    })
  } catch (error) {
    console.error("Error deleting media file:", error)
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
