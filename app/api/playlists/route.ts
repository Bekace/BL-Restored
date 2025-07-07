import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

// GET all playlists for the current user
export async function GET(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS] Fetching playlists...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [PLAYLISTS] No user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("🎵 [PLAYLISTS] User ID:", user.id)

    // Fetch playlists with item counts
    const playlists = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.loop_playlist,
        p.shuffle_items,
        p.created_at,
        p.updated_at,
        COUNT(pi.id) as item_count,
        COALESCE(SUM(pi.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, p.name, p.description, p.status, p.loop_playlist, p.shuffle_items, p.created_at, p.updated_at
      ORDER BY p.created_at DESC
    `

    console.log("🎵 [PLAYLISTS] Found playlists:", playlists.length)

    return NextResponse.json({
      success: true,
      playlists: playlists,
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch playlists",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST create new playlist
export async function POST(request: NextRequest) {
  try {
    console.log("🎵 [PLAYLISTS] Creating new playlist...")

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, loop_playlist = true, shuffle_items = false } = body

    console.log("🎵 [PLAYLISTS] Create request:", { name, description, userId: user.id })

    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 })
    }

    // Create playlist
    const result = await sql`
      INSERT INTO playlists (
        user_id, 
        name, 
        description, 
        status, 
        loop_playlist, 
        shuffle_items, 
        created_at, 
        updated_at
      )
      VALUES (
        ${user.id}, 
        ${name.trim()}, 
        ${description?.trim() || null}, 
        'draft', 
        ${loop_playlist}, 
        ${shuffle_items}, 
        NOW(), 
        NOW()
      )
      RETURNING id, name, description, status
    `

    console.log("🎵 [PLAYLISTS] Playlist created:", result[0])

    return NextResponse.json({
      success: true,
      message: "Playlist created successfully",
      playlist: result[0],
    })
  } catch (error) {
    console.error("🎵 [PLAYLISTS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
