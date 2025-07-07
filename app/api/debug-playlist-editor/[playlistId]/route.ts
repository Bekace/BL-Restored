import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  console.log("🔍 [DEBUG PLAYLIST EDITOR] Starting debug for playlist:", params.playlistId)

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", step: "auth" }, { status: 401 })
    }

    const sql = getDb()
    const playlistId = Number.parseInt(params.playlistId)

    if (isNaN(playlistId)) {
      return NextResponse.json({ error: "Invalid playlist ID", step: "validation" }, { status: 400 })
    }

    // Step 1: Check if playlist exists
    const playlistExists = await sql`
      SELECT id, name, user_id FROM playlists WHERE id = ${playlistId}
    `

    if (playlistExists.length === 0) {
      return NextResponse.json({
        error: "Playlist not found",
        step: "playlist_lookup",
        debug: { playlistId, userId: user.id },
      })
    }

    // Step 2: Check ownership
    if (playlistExists[0].user_id !== user.id) {
      return NextResponse.json({
        error: "Playlist not owned by user",
        step: "ownership_check",
        debug: {
          playlistId,
          userId: user.id,
          playlistOwnerId: playlistExists[0].user_id,
        },
      })
    }

    // Step 3: Get full playlist data
    const playlist = await sql`
      SELECT * FROM playlists WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    // Step 4: Get playlist items
    const items = await sql`
      SELECT 
        pi.*,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      ORDER BY pi.position ASC
    `

    // Step 5: Get media files for library
    const mediaFiles = await sql`
      SELECT * FROM media_files WHERE user_id = ${user.id} ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      debug: {
        user: { id: user.id, email: user.email },
        playlist: playlist[0],
        items: items,
        mediaFiles: mediaFiles,
        counts: {
          items: items.length,
          mediaFiles: mediaFiles.length,
        },
        steps: [
          "✅ User authenticated",
          "✅ Playlist ID validated",
          "✅ Playlist found",
          "✅ Ownership verified",
          "✅ Data retrieved",
        ],
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG PLAYLIST EDITOR] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        step: "exception",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
