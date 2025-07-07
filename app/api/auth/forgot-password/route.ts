import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { Resend } from "resend"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("Forgot password request received")

    const { email } = await request.json()
    console.log("Email received:", email ? "Yes" : "No")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user exists
    console.log("Looking for user with email...")
    const users = await sql`SELECT id, first_name, email FROM users WHERE email = ${email}`
    console.log("Users found:", users.length)

    if (users.length === 0) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({ message: "If an account with that email exists, we've sent a password reset link." })
    }

    const user = users[0]
    console.log("User found:", user.id)

    // Generate reset token and store it in the user record temporarily
    const resetToken = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    console.log("Generated reset token, updating user record...")

    // Store reset token and expiry in user table temporarily
    await sql`
    UPDATE users 
    SET reset_token = ${resetToken}, 
        reset_token_expires = ${expiresAt.toISOString()}
    WHERE id = ${user.id}
  `

    console.log("Reset token stored in user record")

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    console.log("Reset URL created:", resetUrl)

    // Send email
    if (process.env.RESEND_API_KEY) {
      console.log("Sending email via Resend...")
      try {
        const emailResult = await resend.emails.send({
          from: "Digital Signage <onboarding@resend.dev>",
          to: [email],
          subject: "Reset Your Password",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hi ${user.first_name},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `,
        })
        console.log("Email sent successfully:", emailResult.id)
      } catch (emailError) {
        console.error("Email sending failed:", emailError)
        // Continue anyway - don't fail the request
      }
    } else {
      console.log("No Resend API key, would send email to:", email)
      console.log("Reset URL:", resetUrl)
    }

    return NextResponse.json({ message: "If an account with that email exists, we've sent a password reset link." })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
