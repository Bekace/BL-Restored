import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG AUTH TOKEN] Starting token debug...")

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({
        success: false,
        error: "JWT_SECRET not configured",
      })
    }

    // Try to get token from Authorization header first
    let token = request.headers.get("authorization")?.replace("Bearer ", "")
    let tokenSource = "Authorization header"

    // If no Authorization header, try cookies
    if (!token) {
      const cookies = request.headers.get("cookie")
      if (cookies) {
        const authTokenMatch = cookies.match(/auth-token=([^;]+)/)
        if (authTokenMatch) {
          token = authTokenMatch[1]
          tokenSource = "Cookie"
        }
      }
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "No token found",
        debug: {
          authHeader: request.headers.get("authorization"),
          cookies: request.headers.get("cookie"),
        },
      })
    }

    console.log("🔍 [DEBUG AUTH TOKEN] Token found in:", tokenSource)

    try {
      const decoded = jwt.verify(token, jwtSecret) as any
      console.log("🔍 [DEBUG AUTH TOKEN] Token verified successfully")

      return NextResponse.json({
        success: true,
        tokenSource,
        decoded: {
          userId: decoded.userId,
          email: decoded.email,
          iat: decoded.iat,
          exp: decoded.exp,
          isExpired: Date.now() / 1000 > decoded.exp,
        },
      })
    } catch (jwtError) {
      console.error("🔍 [DEBUG AUTH TOKEN] JWT verification failed:", jwtError)
      return NextResponse.json({
        success: false,
        error: "Token verification failed",
        details: jwtError instanceof Error ? jwtError.message : "Unknown JWT error",
        tokenSource,
      })
    }
  } catch (error) {
    console.error("🔍 [DEBUG AUTH TOKEN] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
