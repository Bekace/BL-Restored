import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    console.log(`🗑️ [DELETE API] Starting delete for item: ${params.itemId} in playlist: ${params.playlistId}`)

    // Get user from token
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      console.log("🗑️ [DELETE API] No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    console.log(`🗑️ [DELETE API] User ID: ${userId}`)

    // Verify playlist ownership
    const playlistCheck = await sql`
      SELECT id, user_id FROM playlists 
      WHERE id = ${params.playlistId} AND user_id = ${userId}
    `

    if (playlistCheck.length === 0) {
      console.log(`🗑️ [DELETE API] Playlist not found or not owned by user`)
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Get the item to delete and its position
    console.log(`🗑️ [DELETE API] Getting item details for: ${params.itemId}`)
    const itemToDelete = await sql`
      SELECT id, position FROM playlist_items 
      WHERE id = ${params.itemId} AND playlist_id = ${params.playlistId}
    `

    if (itemToDelete.length === 0) {
      console.log(`🗑️ [DELETE API] Item not found: ${params.itemId}`)
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const deletedPosition = itemToDelete[0].position
    console.log(`🗑️ [DELETE API] Item ${params.itemId} is at position: ${deletedPosition}`)

    // Delete the item
    console.log(`🗑️ [DELETE API] Deleting item: ${params.itemId}`)
    const deleteResult = await sql`
      DELETE FROM playlist_items 
      WHERE id = ${params.itemId} AND playlist_id = ${params.playlistId}
    `

    if (deleteResult.count === 0) {
      console.log(`🗑️ [DELETE API] No rows deleted for item: ${params.itemId}`)
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
    }

    console.log(`🗑️ [DELETE API] Item ${params.itemId} deleted successfully`)

    // Reorder remaining items (move items after deleted position up by 1)
    console.log(`🗑️ [DELETE API] Reordering items after position: ${deletedPosition}`)
    try {
      const reorderResult = await sql`
        UPDATE playlist_items 
        SET position = position - 1 
        WHERE playlist_id = ${params.playlistId} AND position > ${deletedPosition}
      `
      console.log(`🗑️ [DELETE API] Reordered ${reorderResult.count} items`)
    } catch (reorderError) {
      console.error(`🗑️ [DELETE API] Reorder failed (but delete succeeded):`, reorderError)
      // Don't fail the whole operation if reorder fails
    }

    console.log(`🗑️ [DELETE API] Delete operation completed successfully`)
    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
      deletedItemId: params.itemId,
    })
  } catch (error) {
    console.error("🗑️ [DELETE API] Delete failed:", error)
    return NextResponse.json(
      {
        error: "Failed to delete item",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { playlistId: string; itemId: string } }) {
  try {
    console.log(`📝 [UPDATE API] Starting update for item: ${params.itemId}`)

    // Get user from token
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Verify playlist ownership
    const playlistCheck = await sql`
      SELECT id, user_id FROM playlists 
      WHERE id = ${params.playlistId} AND user_id = ${userId}
    `

    if (playlistCheck.length === 0) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    const { duration, transition_type } = await request.json()
    console.log(
      `📝 [UPDATE API] Updating item ${params.itemId} - duration: ${duration}, transition: ${transition_type}`,
    )

    const result = await sql`
      UPDATE playlist_items 
      SET 
        duration = ${duration},
        transition_type = ${transition_type}
      WHERE id = ${params.itemId} AND playlist_id = ${params.playlistId}
    `

    if (result.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log(`📝 [UPDATE API] Item ${params.itemId} updated successfully`)
    return NextResponse.json({ success: true, message: "Item updated successfully" })
  } catch (error) {
    console.error("📝 [UPDATE API] Update failed:", error)
    return NextResponse.json(
      {
        error: "Failed to update item",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
