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

    const mediaFiles = await sql`
      SELECT 
        id, filename, original_name, file_type, file_size, 
        mime_type, url, storage_url, thumbnail_url, duration, 
        dimensions, created_at
      FROM media_files 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    console.log("Raw media files from DB:", mediaFiles)

    // Format files for the frontend - ensuring compatibility with playlist editor
    const formattedFiles = mediaFiles.map((file) => ({
      id: file.id,
      filename: file.filename || "",
      original_name: file.original_name || file.filename || "Untitled",
      original_filename: file.original_name || file.filename || "Untitled", // Map original_name to original_filename for playlist editor
      file_type: file.file_type || "unknown",
      file_size: file.file_size || 0,
      mime_type: file.mime_type || "application/octet-stream",
      // Use url field first, then storage_url, then construct from filename
      url: file.url || file.storage_url || `https://blob.vercel-storage.com/${file.filename}`,
      thumbnail_url: file.thumbnail_url,
      duration: file.duration,
      dimensions: file.dimensions,
      created_at: file.created_at,
    }))

    console.log("Formatted files for frontend:", formattedFiles)

    // Return both formats for compatibility
    return NextResponse.json({
      success: true,
      files: formattedFiles, // For media library page
      media: formattedFiles, // For playlist editor
      total: mediaFiles.length,
    })
  } catch (error) {
    console.error("Error fetching media files:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch media files",
        success: false,
        files: [],
        media: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}
