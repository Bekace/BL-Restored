import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("Creating test media samples...")

    // Sample media files for testing
    const testMediaFiles = [
      {
        filename: "sample-image-1.jpg",
        original_name: "Beautiful Landscape.jpg",
        file_type: "image",
        mime_type: "image/jpeg",
        url: "/placeholder.svg?height=1080&width=1920&text=Beautiful+Landscape",
        thumbnail_url: "/placeholder.svg?height=200&width=300&text=Landscape+Thumb",
        file_size: 2048000,
        dimensions: "1920x1080",
        duration: null,
        media_source: "upload",
      },
      {
        filename: "sample-video-1.mp4",
        original_name: "Product Demo Video.mp4",
        file_type: "video",
        mime_type: "video/mp4",
        url: "/placeholder.svg?height=720&width=1280&text=Video+Player",
        thumbnail_url: "/placeholder.svg?height=200&width=300&text=Video+Thumb",
        file_size: 15728640,
        dimensions: "1280x720",
        duration: 45,
        media_source: "upload",
      },
      {
        filename: "sample-audio-1.mp3",
        original_name: "Background Music.mp3",
        file_type: "audio",
        mime_type: "audio/mpeg",
        url: "/placeholder.svg?height=400&width=400&text=Audio+File",
        thumbnail_url: "/thumbnails/audio.png",
        file_size: 5242880,
        dimensions: null,
        duration: 180,
        media_source: "upload",
      },
      {
        filename: "sample-slides-1",
        original_name: "Company Presentation",
        file_type: "presentation",
        mime_type: "application/vnd.google-apps.presentation",
        url: "https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/embed",
        external_url:
          "https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/embed?start=false&loop=false&delayms=3000",
        thumbnail_url: "/thumbnails/slides.png",
        file_size: 0,
        dimensions: "1920x1080",
        duration: null,
        media_source: "google_slides",
      },
      {
        filename: "sample-image-2.png",
        original_name: "Company Logo.png",
        file_type: "image",
        mime_type: "image/png",
        url: "/placeholder.svg?height=600&width=800&text=Company+Logo",
        thumbnail_url: "/placeholder.svg?height=200&width=300&text=Logo+Thumb",
        file_size: 1024000,
        dimensions: "800x600",
        duration: null,
        media_source: "upload",
      },
    ]

    // Insert test media files
    const insertedMedia = []
    for (const media of testMediaFiles) {
      const [inserted] = await sql`
        INSERT INTO media_files (
          filename, original_name, file_type, mime_type, url, external_url,
          thumbnail_url, file_size, dimensions, duration, media_source,
          created_at, updated_at
        )
        VALUES (
          ${media.filename}, ${media.original_name}, ${media.file_type}, 
          ${media.mime_type}, ${media.url}, ${media.external_url || null},
          ${media.thumbnail_url}, ${media.file_size}, ${media.dimensions}, 
          ${media.duration}, ${media.media_source},
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (filename) DO UPDATE SET
          original_name = EXCLUDED.original_name,
          url = EXCLUDED.url,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `
      insertedMedia.push(inserted)
    }

    return NextResponse.json({
      success: true,
      message: `Created ${insertedMedia.length} test media files`,
      media: insertedMedia,
    })
  } catch (error) {
    console.error("Error creating test media samples:", error)
    return NextResponse.json({ success: false, message: "Failed to create test media samples" }, { status: 500 })
  }
}
