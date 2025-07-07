import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { url, title, duration = 30 } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Google Slides URL is required" }, { status: 400 })
    }

    console.log("📊 [GOOGLE SLIDES API] Processing URL:", url)

    // Validate and convert Google Slides URL
    const isValidGoogleSlidesUrl = (url: string) => {
      const patterns = [
        /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9-_]+/,
        /^https:\/\/docs\.google\.com\/presentation\/d\/e\/[a-zA-Z0-9-_]+\/pub/,
        /^https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+/,
      ]
      return patterns.some((pattern) => pattern.test(url))
    }

    if (!isValidGoogleSlidesUrl(url)) {
      return NextResponse.json(
        {
          error: "Invalid Google Slides URL. Please use a valid Google Slides presentation link.",
        },
        { status: 400 },
      )
    }

    // Convert to proper embed URL
    const getEmbedUrl = (url: string) => {
      console.log("🔗 [GOOGLE SLIDES API] Converting URL:", url)

      // Handle published presentation URLs (e/2PACX format)
      const publishedMatch = url.match(/\/presentation\/d\/e\/([a-zA-Z0-9-_]+)\/pub/)
      if (publishedMatch) {
        const presentationId = publishedMatch[1]
        // Extract parameters from the original URL
        const urlObj = new URL(url)
        const start = urlObj.searchParams.get("start") || "false"
        const loop = urlObj.searchParams.get("loop") || "false"
        const delayms = urlObj.searchParams.get("delayms") || (duration * 1000).toString()

        const embedUrl = `https://docs.google.com/presentation/d/e/${presentationId}/embed?start=${start}&loop=${loop}&delayms=${delayms}`
        console.log("📊 [GOOGLE SLIDES API] Created embed URL:", embedUrl)
        return embedUrl
      }

      // Handle regular presentation URLs
      const docsMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)
      if (docsMatch) {
        const presentationId = docsMatch[1]
        const embedUrl = `https://docs.google.com/presentation/d/${presentationId}/embed?start=true&loop=true&delayms=${duration * 1000}`
        console.log("📊 [GOOGLE SLIDES API] Created embed URL:", embedUrl)
        return embedUrl
      }

      // Handle drive URLs
      const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
      if (driveMatch) {
        const presentationId = driveMatch[1]
        const embedUrl = `https://docs.google.com/presentation/d/${presentationId}/embed?start=true&loop=true&delayms=${duration * 1000}`
        console.log("📊 [GOOGLE SLIDES API] Created embed URL:", embedUrl)
        return embedUrl
      }

      // If we can't parse it, return the original URL
      console.log("⚠️ [GOOGLE SLIDES API] Could not parse URL, using original")
      return url
    }

    const embedUrl = getEmbedUrl(url)
    const sql = getDb()

    // Create unique filename for tracking
    const timestamp = Date.now()
    const sanitizedTitle = (title || "Google Slides Presentation").replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${user.id}/slides/${timestamp}-${sanitizedTitle}`

    console.log("💾 [GOOGLE SLIDES API] Saving to database:", {
      filename: uniqueFilename,
      embedUrl,
      originalUrl: url,
    })

    // Insert into media_files table
    const mediaResult = await sql`
      INSERT INTO media_files (
        user_id, 
        filename, 
        original_name,
        file_type,
        file_size, 
        url,
        external_url,
        media_source,
        mime_type,
        embed_settings,
        thumbnail_url,
        created_at
      ) VALUES (
        ${user.id}, 
        ${uniqueFilename}, 
        ${title || "Google Slides Presentation"},
        'presentation',
        0,
        ${embedUrl},
        ${url},
        'google_slides',
        'text/html',
        ${JSON.stringify({
          duration: duration,
          autoplay: true,
          loop: true,
          original_url: url,
          embed_url: embedUrl,
          auto_advance: true,
        })},
        '/thumbnails/slides.png',
        NOW()
      )
      RETURNING *
    `

    // Update user's usage counters (count as 1 file, no storage used)
    await sql`
      UPDATE users 
      SET media_files_count = COALESCE(media_files_count, 0) + 1
      WHERE id = ${user.id}
    `

    console.log("✅ [GOOGLE SLIDES API] Successfully added presentation:", mediaResult[0].id)

    return NextResponse.json({
      success: true,
      file: mediaResult[0],
      message: "Google Slides presentation added successfully",
    })
  } catch (error) {
    console.error("Google Slides add error:", error)
    return NextResponse.json(
      {
        error: "Failed to add Google Slides presentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
