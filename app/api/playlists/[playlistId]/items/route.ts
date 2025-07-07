import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = params.playlistId
    const sql = getDb()

    console.log("🎵 [PLAYLIST ITEMS API] Fetching items for playlist:", playlistId)

    // Get playlist items with complete media file details
    const items = await sql`
      SELECT 
        pi.id,
        pi.playlist_id,
        pi.media_file_id as media_id,
        pi.position,
        pi.duration,
        pi.transition_type,
        pi.created_at,
        mf.id as media_file_id,
        mf.filename,
        mf.original_name,
        mf.file_type,
        mf.file_size,
        mf.url,
        mf.thumbnail_url,
        mf.mime_type,
        mf.dimensions,
        mf.media_source,
        mf.external_url,
        mf.embed_settings,
        mf.created_at as media_created_at
      FROM playlist_items pi
      LEFT JOIN media_files mf ON pi.media_file_id = mf.id
      WHERE pi.playlist_id = ${playlistId}
      AND EXISTS (
        SELECT 1 FROM playlists p 
        WHERE p.id = pi.playlist_id 
        AND p.user_id = ${user.id}
      )
      ORDER BY pi.position ASC, pi.created_at ASC
    `

    console.log("🎵 [PLAYLIST ITEMS API] Found items:", items.length)

    // Transform the data to include both media and media_file properties for compatibility
    const transformedItems = items.map((item) => ({
      id: item.id,
      playlist_id: item.playlist_id,
      media_id: item.media_id,
      position: item.position,
      duration: item.duration || 30,
      transition_type: item.transition_type || "fade",
      created_at: item.created_at,
      // Include both formats for compatibility
      media: item.media_file_id
        ? {
            id: item.media_file_id,
            filename: item.filename,
            original_name: item.original_name,
            original_filename: item.original_name,
            file_type: item.file_type,
            file_size: item.file_size,
            url: item.url,
            thumbnail_url: item.thumbnail_url,
            mime_type: item.mime_type,
            dimensions: item.dimensions,
            media_source: item.media_source,
            external_url: item.external_url,
            embed_settings: item.embed_settings,
            created_at: item.media_created_at,
          }
        : null,
      media_file: item.media_file_id
        ? {
            id: item.media_file_id,
            filename: item.filename,
            original_name: item.original_name,
            original_filename: item.original_name,
            file_type: item.file_type,
            file_size: item.file_size,
            url: item.url,
            thumbnail_url: item.thumbnail_url,
            mime_type: item.mime_type,
            dimensions: item.dimensions,
            media_source: item.media_source,
            external_url: item.external_url,
            embed_settings: item.embed_settings,
            created_at: item.media_created_at,
          }
        : null,
    }))

    console.log("🎵 [PLAYLIST ITEMS API] Transformed items:", transformedItems.length)

    return NextResponse.json({
      success: true,
      items: transformedItems,
    })
  } catch (error) {
    console.error("Error fetching playlist items:", error)
    return NextResponse.json({ error: "Failed to fetch playlist items" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { playlistId: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const playlistId = params.playlistId
    const { media_id, duration = 30, transition_type = "fade" } = await request.json()

    if (!media_id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    const sql = getDb()

    console.log("➕ [PLAYLIST ITEMS API] Adding media to playlist:", { playlistId, media_id, duration })

    // Verify playlist ownership
    const playlist = await sql`
      SELECT id FROM playlists 
      WHERE id = ${playlistId} AND user_id = ${user.id}
    `

    if (playlist.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Verify media file exists and belongs to user
    const mediaFile = await sql`
      SELECT id FROM media_files 
      WHERE id = ${media_id} AND user_id = ${user.id}
    `

    if (mediaFile.length === 0) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 })
    }

    // Get the next position
    const positionResult = await sql`
      SELECT COALESCE(MAX(position), 0) + 1 as next_position
      FROM playlist_items 
      WHERE playlist_id = ${playlistId}
    `
    const nextPosition = positionResult[0].next_position

    // Add item to playlist
    const newItem = await sql`
      INSERT INTO playlist_items (
        playlist_id, 
        media_file_id, 
        position, 
        duration, 
        transition_type,
        created_at
      ) VALUES (
        ${playlistId}, 
        ${media_id}, 
        ${nextPosition}, 
        ${duration}, 
        ${transition_type},
        NOW()
      )
      RETURNING *
    `

    console.log("➕ [PLAYLIST ITEMS API] Added item:", newItem[0])

    return NextResponse.json({
      success: true,
      item: newItem[0],
      message: "Media added to playlist successfully",
    })
  } catch (error) {
    console.error("Error adding item to playlist:", error)
    return NextResponse.json({ error: "Failed to add item to playlist" }, { status: 500 })
  }
}
