import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG SCREENS] Starting debug flow...")

    // Environment check
    const environment = {
      jwtSecretExists: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      databaseUrlExists: !!process.env.DATABASE_URL,
    }

    // Request analysis
    const headers = Object.fromEntries(request.headers.entries())
    const authHeader = request.headers.get("authorization")
    const requestInfo = {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 30)}...` : null,
      allHeaders: headers,
    }

    // Authentication test
    let authResult = "Failed"
    let user = null
    try {
      user = await getCurrentUser(request)
      if (user) {
        authResult = `Success: ${user.email}`
      } else {
        authResult = "Failed: No user returned"
      }
    } catch (error) {
      authResult = `Error: ${error instanceof Error ? error.message : "Unknown"}`
    }

    // Database test
    let dbResult = "Failed"
    let userCount = "Unknown"
    try {
      const result = await sql`SELECT COUNT(*) as count FROM users`
      userCount = `${result[0].count} users in database`
      dbResult = "Success"
    } catch (error) {
      dbResult = `Error: ${error instanceof Error ? error.message : "Unknown"}`
    }

    return NextResponse.json({
      success: true,
      debug: {
        environment,
        request: requestInfo,
        authentication: {
          result: authResult,
          user: user
            ? {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
              }
            : null,
        },
        database: {
          connectionTest: dbResult,
          userCount,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("🔍 [DEBUG SCREENS] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
