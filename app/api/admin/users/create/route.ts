import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const sql = getDb()

    // Check if user is admin
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${user.id}`
    if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Received user data:", body) // Debug log
    const { firstName, lastName, email, company, plan, password, isAdmin } = body

    // Validation with detailed messages
    if (!firstName?.trim()) {
      return NextResponse.json({ success: false, message: "First name is required" }, { status: 400 })
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ success: false, message: "Last name is required" }, { status: 400 })
    }
    if (!email?.trim()) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }
    if (!password?.trim()) {
      return NextResponse.json({ success: false, message: "Password is required" }, { status: 400 })
    }
    if (!plan) {
      return NextResponse.json({ success: false, message: "Plan is required" }, { status: 400 })
    }

    // Email format validation with more detailed error
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmedEmail = email.trim().toLowerCase()
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid email format: "${trimmedEmail}". Please enter a valid email like user@example.com`,
        },
        { status: 400 },
      )
    }

    // Check if user already exists - enhanced check
    const existingUser = await sql`SELECT id, email FROM users WHERE LOWER(email) = ${trimmedEmail}`
    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `A user with email "${trimmedEmail}" already exists. Please use a different email address.`,
        },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    // Verify plan exists - check both plan_templates and fallback to hardcoded plans
    let planExists = false
    try {
      const planCheck = await sql`SELECT id FROM plan_templates WHERE plan_type = ${plan} AND is_active = true`
      planExists = planCheck.length > 0
    } catch (err) {
      // Fallback to hardcoded plan validation if table doesn't exist
      const validPlans = ["free", "pro", "enterprise"]
      planExists = validPlans.includes(plan)
    }

    if (!planExists) {
      return NextResponse.json({ success: false, message: `Invalid plan selected: "${plan}"` }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user - using trimmed lowercase email
    const newUser = await sql`
      INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        company, 
        password_hash, 
        plan, 
        is_admin,
        created_at
      ) VALUES (
        ${firstName.trim()}, 
        ${lastName.trim()}, 
        ${trimmedEmail}, 
        ${company?.trim() || null}, 
        ${hashedPassword}, 
        ${plan},
        ${isAdmin || false},
        NOW()
      ) RETURNING id, first_name, last_name, email, company, plan, is_admin, created_at
    `

    console.log("User created successfully:", newUser[0]) // Debug log

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser[0].id,
        firstName: newUser[0].first_name,
        lastName: newUser[0].last_name,
        email: newUser[0].email,
        company: newUser[0].company,
        plan: newUser[0].plan,
        isAdmin: newUser[0].is_admin,
        createdAt: newUser[0].created_at,
        mediaCount: 0,
        storageUsed: 0,
      },
    })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}
