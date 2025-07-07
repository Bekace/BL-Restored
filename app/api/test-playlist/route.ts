import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name = "Mixed Media Test Playlist",
      description = "Test playlist with all media types",
      scenarioType = "mixed",
    } = body

    console.log("Creating test playlist:", name)

    // First ensure we have test media
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/test-media-samples`, {
      method: "POST",
    })

    // Get available media files
    const mediaFiles = await sql`
      SELECT * FROM media_files 
      WHERE filename LIKE 'sample-%'
      ORDER BY created_at DESC
      LIMIT 10
    `

    if (mediaFiles.length === 0) {
      return NextResponse.json({ success: false, message: "No test media files available" }, { status: 400 })
    }

    // Create playlist
    const [playlist] = await sql`
      INSERT INTO playlists (
        name, description, status, loop_enabled, shuffle, auto_advance,
        background_color, text_overlay, scale_image, scale_video,
        default_item_duration, created_at, updated_at
      )
      VALUES (
        ${name}, ${description}, 'active', true, ${scenarioType === "shuffle"},
        true, '#000000', true, 'fit', 'fit', 15,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `

    // Add media items to playlist
    const playlistItems = []
    for (let i = 0; i < mediaFiles.length; i++) {
      const media = mediaFiles[i]
      let duration = 15 // default

      // Set appropriate durations based on media type
      if (media.file_type === "image") {
        duration = 8
      } else if (media.file_type === "video") {
        duration = media.duration || 30
      } else if (media.file_type === "audio") {
        duration = Math.min(media.duration || 60, 60) // Max 60 seconds for testing
      } else if (media.media_source === "google_slides") {
        duration = 45
      }

      const [item] = await sql`
        INSERT INTO playlist_items (
          playlist_id, media_id, position, duration, transition_type,
          created_at, updated_at
        )
        VALUES (
          ${playlist.id}, ${media.id}, ${i + 1}, ${duration}, 'fade',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *
      `
      playlistItems.push({
        ...item,
        media: media,
      })
    }

    return NextResponse.json({
      success: true,
      playlist: {
        ...playlist,
        items: playlistItems,
      },
      message: `Created test playlist with ${playlistItems.length} items`,
    })
  } catch (error) {
    console.error("Error creating test playlist:", error)
    return NextResponse.json({ success: false, message: "Failed to create test playlist" }, { status: 500 })
  }
}
