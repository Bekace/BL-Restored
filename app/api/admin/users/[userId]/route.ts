import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  try {
    console.log("Delete user API: Starting request for user", params.userId)

    const currentUser = await getCurrentUser()
    console.log("Delete user API: Current user:", currentUser?.id, currentUser?.email)

    if (!currentUser) {
      console.log("Delete user API: No user authenticated")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if current user is admin
    let adminCheck
    try {
      adminCheck = await sql`
        SELECT is_admin FROM users WHERE id = ${currentUser.id}
      `
      console.log("Delete user API: Admin check result:", adminCheck)
    } catch (err) {
      console.log("Delete user API: Error checking admin status:", err.message)
      return NextResponse.json(
        {
          success: false,
          message: "Database error - unable to verify admin status",
        },
        { status: 500 },
      )
    }

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      console.log("Delete user API: Access denied - not admin")
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const userId = params.userId

    // Prevent self-deletion
    if (currentUser.id.toString() === userId) {
      console.log("Delete user API: Attempted self-deletion")
      return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user exists
    const userToDelete = await sql`
      SELECT id, email, first_name, last_name FROM users WHERE id = ${userId}
    `

    if (userToDelete.length === 0) {
      console.log("Delete user API: User not found")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Delete user's media files first (cascade delete)
    await sql`
      DELETE FROM media_files WHERE user_id = ${userId}
    `

    // Delete user's devices
    await sql`
      DELETE FROM devices WHERE user_id = ${userId}
    `

    // Delete user's playlists
    await sql`
      DELETE FROM playlists WHERE user_id = ${userId}
    `

    // Delete the user
    await sql`
      DELETE FROM users WHERE id = ${userId}
    `

    console.log("Delete user API: Successfully deleted user", userToDelete[0].email)

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete[0].first_name} ${userToDelete[0].last_name} deleted successfully`,
      deletedUser: {
        id: userToDelete[0].id,
        email: userToDelete[0].email,
        firstName: userToDelete[0].first_name,
        lastName: userToDelete[0].last_name,
      },
    })
  } catch (error) {
    console.error("Delete user API: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + error.message,
      },
      { status: 500 },
    )
  }
}
