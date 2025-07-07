import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    console.log("🎵 [ASSIGN PLAYLIST] Starting playlist assignment...")

    const user = await getCurrentUser(request)
    if (!user) {
      console.log("🎵 [ASSIGN PLAYLIST] No user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { deviceId } = params
    const body = await request.json()
    const { playlistId } = body

    console.log("🎵 [ASSIGN PLAYLIST] Request:", { deviceId, playlistId, userId: user.id })

    // Verify device belongs to user
    const deviceCheck = await sql`
      SELECT id, name, user_id 
      FROM devices 
      WHERE id = ${Number.parseInt(deviceId)} AND user_id = ${user.id}
    `

    console.log("🎵 [ASSIGN PLAYLIST] Device check result:", deviceCheck)

    if (deviceCheck.length === 0) {
      console.log("🎵 [ASSIGN PLAYLIST] Device not found")
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 })
    }

    if (playlistId === null || playlistId === undefined) {
      // Remove playlist assignment
      console.log("🎵 [ASSIGN PLAYLIST] Removing playlist assignment")

      await sql`
        UPDATE devices 
        SET 
          assigned_playlist_id = NULL,
          playlist_status = 'none',
          updated_at = NOW()
        WHERE id = ${Number.parseInt(deviceId)} AND user_id = ${user.id}
      `

      console.log("🎵 [ASSIGN PLAYLIST] Playlist removed successfully")

      return NextResponse.json({
        success: true,
        message: "Playlist removed from device",
      })
    } else {
      // Verify playlist belongs to user
      const playlistCheck = await sql`
        SELECT id, name 
        FROM playlists 
        WHERE id = ${Number.parseInt(playlistId)} AND user_id = ${user.id}
      `

      console.log("🎵 [ASSIGN PLAYLIST] Playlist check result:", playlistCheck)

      if (playlistCheck.length === 0) {
        console.log("🎵 [ASSIGN PLAYLIST] Playlist not found")
        return NextResponse.json({ success: false, error: "Playlist not found" }, { status: 404 })
      }

      // Assign playlist to device
      console.log("🎵 [ASSIGN PLAYLIST] Assigning playlist to device")

      await sql`
        UPDATE devices 
        SET 
          assigned_playlist_id = ${Number.parseInt(playlistId)},
          playlist_status = 'assigned',
          updated_at = NOW()
        WHERE id = ${Number.parseInt(deviceId)} AND user_id = ${user.id}
      `

      console.log("🎵 [ASSIGN PLAYLIST] Playlist assigned successfully")

      return NextResponse.json({
        success: true,
        message: `Playlist "${playlistCheck[0].name}" assigned to device`,
        playlist: {
          id: playlistCheck[0].id,
          name: playlistCheck[0].name,
        },
      })
    }
  } catch (error) {
    console.error("🎵 [ASSIGN PLAYLIST] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to assign playlist",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
