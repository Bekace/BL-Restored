import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    console.log("Edit user API: Starting request for user", params.userId)

    const currentUser = await getCurrentUser()
    console.log("Edit user API: Current user:", currentUser?.id, currentUser?.email)

    if (!currentUser) {
      console.log("Edit user API: No user authenticated")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if current user is admin
    let adminCheck
    try {
      adminCheck = await sql`
        SELECT is_admin FROM users WHERE id = ${currentUser.id}
      `
      console.log("Edit user API: Admin check result:", adminCheck)
    } catch (err) {
      console.log("Edit user API: Error checking admin status:", err.message)
      return NextResponse.json(
        {
          success: false,
          message: "Database error - unable to verify admin status",
        },
        { status: 500 },
      )
    }

    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      console.log("Edit user API: Access denied - not admin")
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const userId = Number.parseInt(params.userId)
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("Edit user API: Received data:", body)
    const { firstName, lastName, email, company, plan, password, isAdmin } = body

    // Validation - EXACT same as create user
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !plan) {
      return NextResponse.json({ success: false, message: "All required fields must be filled" }, { status: 400 })
    }

    // Enhanced email validation
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id, email FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      console.log("Edit user API: User not found")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user - enhanced check
    const emailCheck = await sql`
      SELECT id, email FROM users WHERE LOWER(email) = ${trimmedEmail} AND id != ${userId}
    `

    if (emailCheck.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Email "${trimmedEmail}" is already in use by another user. Please choose a different email address.`,
        },
        { status: 400 },
      )
    }

    // Build update query - EXACT same pattern as create
    let updateQuery
    let updatedUser

    if (password && password.trim()) {
      // Update with password
      const hashedPassword = await bcrypt.hash(password, 10)
      updatedUser = await sql`
        UPDATE users 
        SET 
          first_name = ${firstName.trim()},
          last_name = ${lastName.trim()},
          email = ${trimmedEmail},
          company = ${company?.trim() || null},
          plan = ${plan},
          is_admin = ${isAdmin || false},
          password_hash = ${hashedPassword}
        WHERE id = ${userId}
        RETURNING id, first_name, last_name, email, company, plan, is_admin, created_at
      `
    } else {
      // Update without password
      updatedUser = await sql`
        UPDATE users 
        SET 
          first_name = ${firstName.trim()},
          last_name = ${lastName.trim()},
          email = ${trimmedEmail},
          company = ${company?.trim() || null},
          plan = ${plan},
          is_admin = ${isAdmin || false}
        WHERE id = ${userId}
        RETURNING id, first_name, last_name, email, company, plan, is_admin, created_at
      `
    }

    if (updatedUser.length === 0) {
      return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 })
    }

    console.log("Edit user API: Successfully updated user", updatedUser[0].email)

    // Return EXACT same format as create user API
    return NextResponse.json({
      success: true,
      message: `User ${updatedUser[0].first_name} ${updatedUser[0].last_name} updated successfully`,
      user: {
        id: updatedUser[0].id,
        firstName: updatedUser[0].first_name,
        lastName: updatedUser[0].last_name,
        email: updatedUser[0].email,
        company: updatedUser[0].company,
        plan: updatedUser[0].plan,
        isAdmin: updatedUser[0].is_admin,
        createdAt: updatedUser[0].created_at,
      },
    })
  } catch (error) {
    console.error("Edit user API: General error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}
