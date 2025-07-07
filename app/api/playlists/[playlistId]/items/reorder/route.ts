import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { playlistId: string } }) {
  try {
    console.log(`🎯 [REORDER API] Starting reorder for playlist: ${params.playlistId}`)

    // Get user from token
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("🎯 [REORDER API] No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    console.log(`🎯 [REORDER API] User ID: ${userId}`)

    // Verify playlist ownership
    const playlistCheck = await sql`
      SELECT id, user_id FROM playlists 
      WHERE id = ${params.playlistId} AND user_id = ${userId}
    `

    if (playlistCheck.length === 0) {
      console.log(`🎯 [REORDER API] Playlist not found or not owned by user`)
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const { items } = await request.json()
    console.log(`🎯 [REORDER API] Received ${items.length} items to reorder`)

    // Update each item's position
    const updatePromises = items.map(async (item: any, index: number) => {
      const newPosition = index + 1
      console.log(`🎯 [REORDER API] Updating item ${item.id} to position ${newPosition}`)

      try {
        const result = await sql`
          UPDATE playlist_items 
          SET position = ${newPosition}
          WHERE id = ${item.id} AND playlist_id = ${params.playlistId}
        `
        console.log(`🎯 [REORDER API] Updated item ${item.id} successfully`)
        return { success: true, itemId: item.id, newPosition }
      } catch (error) {
        console.error(`🎯 [REORDER API] Failed to update item ${item.id}:`, error)
        return { success: false, itemId: item.id, error: error.message }
      }
    })

    const results = await Promise.all(updatePromises)
    const failures = results.filter((r) => !r.success)

    if (failures.length > 0) {
      console.error(`🎯 [REORDER API] ${failures.length} items failed to update:`, failures)
      return NextResponse.json(
        {
          error: "Some items failed to reorder",
          failures,
          success: false,
        },
        { status: 500 },
      )
    }

    console.log(`🎯 [REORDER API] All ${items.length} items reordered successfully`)
    return NextResponse.json({ success: true, message: "Items reordered successfully" })
  } catch (error) {
    console.error("🎯 [REORDER API] Reorder failed:", error)
    return NextResponse.json(
      {
        error: "Failed to reorder items",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
