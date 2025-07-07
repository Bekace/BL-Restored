import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = params.deviceId

    console.log("Fetching playlist for device:", deviceId)

    // Get device and its assigned playlist
    const deviceResult = await sql`
      SELECT d.*, d.assigned_playlist_id
      FROM devices d
      WHERE d.id = ${deviceId}
    `

    if (deviceResult.length === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const device = deviceResult[0]

    if (!device.assigned_playlist_id) {
      return NextResponse.json({
        playlist: null,
        message: "No playlist assigned to this device",
      })
    }

    // Get playlist with items and media
    const playlistResult = await sql`
      SELECT 
        p.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', pi.id,
              'media_id', pi.media_id,
              'position', pi.position,
              'duration', pi.duration,
              'transition_type', pi.transition_type,
              'media', JSON_BUILD_OBJECT(
                'id', m.id,
                'filename', m.filename,
                'original_name', m.original_name,
                'file_type', m.file_type,
                'mime_type', m.mime_type,
                'url', m.url,
                'thumbnail_url', m.thumbnail_url,
                'dimensions', m.dimensions,
                'duration', m.duration,
                'media_source', m.media_source,
                'external_url', m.external_url
              )
            ) ORDER BY pi.position
          ) FILTER (WHERE pi.id IS NOT NULL), 
          '[]'
        ) as items
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      LEFT JOIN media_files m ON pi.media_id = m.id
      WHERE p.id = ${device.assigned_playlist_id}
      GROUP BY p.id
    `

    if (playlistResult.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const playlist = playlistResult[0]

    // Parse items if they're a string
    if (typeof playlist.items === "string") {
      playlist.items = JSON.parse(playlist.items)
    }

    console.log("Playlist found:", playlist.name, "with", playlist.items?.length || 0, "items")

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        status: playlist.status,
        loop_enabled: playlist.loop_enabled,
        shuffle: playlist.shuffle,
        background_color: playlist.background_color,
        text_overlay: playlist.text_overlay,
        scale_image: playlist.scale_image,
        scale_video: playlist.scale_video,
        items: playlist.items || [],
      },
    })
  } catch (error) {
    console.error("Playlist fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
