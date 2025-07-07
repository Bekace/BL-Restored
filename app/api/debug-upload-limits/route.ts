import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== DEBUG UPLOAD LIMITS ===")

  try {
    // Check various server limits and configurations
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,

      // Check if we're on Vercel
      isVercel: !!process.env.VERCEL,
      vercelRegion: process.env.VERCEL_REGION,

      // Memory and runtime limits
      memoryUsage: process.memoryUsage(),

      // Request size limits (these are the actual server limits)
      serverLimits: {
        // Vercel has a 4.5MB body size limit for serverless functions
        vercelBodyLimit: "4.5MB (Vercel default)",
        // Next.js API routes have their own limits
        nextjsBodyLimit: "1MB (Next.js default)",
        // Our current configuration
        currentConfig: "No explicit limits set in next.config.mjs",
      },

      // Headers that might indicate limits
      requestHeaders: {
        contentLength: request.headers.get("content-length"),
        contentType: request.headers.get("content-type"),
        userAgent: request.headers.get("user-agent"),
      },
    }

    console.log("Debug info:", debugInfo)

    return NextResponse.json({
      success: true,
      debugInfo,
      recommendations: {
        currentIssue: "Vercel serverless functions have a 4.5MB request body limit",
        solution: "Files larger than ~4MB will fail with 413 errors",
        suggestedLimits: {
          videos: "4MB (safe for Vercel)",
          images: "3MB (safe for Vercel)",
          documents: "3MB (safe for Vercel)",
          audio: "4MB (safe for Vercel)",
        },
        note: "These are the actual working limits based on Vercel's infrastructure",
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      note: "This error itself might indicate server limits",
    })
  }
}
