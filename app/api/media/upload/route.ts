import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

// Increase the maximum duration for this API route
export const maxDuration = 60 // 60 seconds for large file uploads

export async function POST(request: NextRequest) {
  console.log("=== UPLOAD API CALLED ===")
  console.log("Request headers:", {
    contentLength: request.headers.get("content-length"),
    contentType: request.headers.get("content-type"),
  })

  try {
    const user = await getCurrentUser()
    console.log("User authenticated:", user ? user.id : "No user")

    if (!user) {
      console.log("ERROR: Unauthorized - no user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    console.log("FormData received, file:", file ? file.name : "No file")

    if (!file) {
      console.log("ERROR: No file provided in form data")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    })

    // Set realistic file size limits based on Vercel's 4.5MB body limit
    // We need to account for FormData overhead, so actual file should be smaller
    let maxSize: number
    let maxSizeMB: string

    if (file.type.startsWith("video/")) {
      maxSize = 4 * 1024 * 1024 // 4MB for videos (safe for Vercel)
      maxSizeMB = "4MB"
    } else if (file.type.startsWith("image/")) {
      maxSize = 3 * 1024 * 1024 // 3MB for images
      maxSizeMB = "3MB"
    } else if (file.type.startsWith("audio/")) {
      maxSize = 4 * 1024 * 1024 // 4MB for audio
      maxSizeMB = "4MB"
    } else if (file.type === "application/pdf") {
      maxSize = 3 * 1024 * 1024 // 3MB for PDFs
      maxSizeMB = "3MB"
    } else if (file.type.includes("presentation") || file.type.includes("powerpoint")) {
      maxSize = 3 * 1024 * 1024 // 3MB for presentations
      maxSizeMB = "3MB"
    } else {
      maxSize = 3 * 1024 * 1024 // 3MB for other documents
      maxSizeMB = "3MB"
    }

    console.log(`File type: ${file.type}, Max size: ${maxSizeMB} (${maxSize} bytes), File size: ${file.size} bytes`)

    if (file.size > maxSize) {
      const fileSizeMB = Math.round((file.size / 1024 / 1024) * 100) / 100
      console.log("ERROR: File too large")
      return NextResponse.json(
        {
          success: false,
          error: `File size must be less than ${maxSizeMB}. Your file is ${fileSizeMB}MB. This limit is due to Vercel's serverless function constraints.`,
        },
        { status: 400 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "bin"
    const filename = `${timestamp}-${randomString}.${fileExtension}`
    console.log("Generated filename:", filename)

    // Convert file to buffer
    console.log("Converting file to buffer...")
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    console.log("Buffer created, size:", fileBuffer.length)

    // Upload to Vercel Blob
    console.log("Uploading to Vercel Blob...")
    const blob = await put(filename, fileBuffer, {
      access: "public",
      contentType: file.type,
    })
    console.log("Blob upload successful:", blob.url)

    // Generate thumbnail
    let thumbnailUrl = null
    let dimensions = null

    if (file.type.startsWith("image/")) {
      try {
        console.log("Generating image thumbnail...")
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize(300, 200, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer()

        const thumbnailFilename = `thumb-${filename.replace(/\.[^/.]+$/, ".jpg")}`
        const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
          access: "public",
        })
        thumbnailUrl = thumbnailBlob.url

        const metadata = await sharp(fileBuffer).metadata()
        dimensions = `${metadata.width}x${metadata.height}`
        console.log("Image thumbnail generated:", thumbnailUrl)
      } catch (error) {
        console.error("Error generating image thumbnail:", error)
      }
    } else if (file.type.startsWith("video/")) {
      console.log("Video file detected, using generic thumbnail")
      thumbnailUrl = "/thumbnails/video.png"
    } else if (file.type.startsWith("audio/")) {
      thumbnailUrl = "/thumbnails/audio.png"
    } else if (file.type === "application/pdf") {
      thumbnailUrl = "/thumbnails/pdf.png"
    } else if (file.type.includes("presentation") || file.type.includes("powerpoint")) {
      thumbnailUrl = "/thumbnails/slides.png"
    } else if (file.type.includes("office") || file.type.includes("document")) {
      thumbnailUrl = "/thumbnails/office.png"
    } else {
      thumbnailUrl = "/thumbnails/generic.png"
    }

    // Determine file type category
    let fileType = "document"
    if (file.type.startsWith("image/")) fileType = "image"
    else if (file.type.startsWith("video/")) fileType = "video"
    else if (file.type.startsWith("audio/")) fileType = "audio"
    else if (file.type === "application/pdf") fileType = "pdf"
    else if (file.type.includes("presentation") || file.type.includes("powerpoint")) fileType = "presentation"
    else if (file.type.includes("office") || file.type.includes("document")) fileType = "office"

    console.log("File type determined:", fileType)

    // Save to database
    console.log("Saving to database...")
    const sql = getDb()

    const result = await sql`
      INSERT INTO media_files (
        user_id, filename, original_name, file_type, file_size, 
        mime_type, url, storage_url, thumbnail_url, dimensions, duration
      ) VALUES (
        ${user.id}, ${filename}, ${file.name}, ${fileType}, ${file.size},
        ${file.type}, ${blob.url}, ${blob.url}, ${thumbnailUrl}, ${dimensions}, ${null}
      )
      RETURNING *
    `

    const mediaFile = result[0]
    console.log("Database save successful:", mediaFile.id)

    const response = {
      success: true,
      message: "File uploaded successfully",
      file: {
        id: mediaFile.id,
        filename: mediaFile.filename,
        original_name: mediaFile.original_name,
        file_type: mediaFile.file_type,
        file_size: mediaFile.file_size,
        mime_type: mediaFile.mime_type,
        url: mediaFile.url,
        storage_url: mediaFile.storage_url,
        thumbnail_url: mediaFile.thumbnail_url,
        dimensions: mediaFile.dimensions,
        duration: mediaFile.duration,
        created_at: mediaFile.created_at,
      },
    }

    console.log("=== UPLOAD SUCCESS ===")
    return NextResponse.json(response)
  } catch (error) {
    console.error("=== UPLOAD ERROR ===")
    console.error("Error details:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")

    let errorMessage = "Failed to upload file"
    let statusCode = 500

    if (error instanceof Error) {
      console.error("Error message:", error.message)

      if (error.message.includes("size") || error.message.includes("large")) {
        errorMessage = "File is too large for Vercel's serverless function limits"
        statusCode = 413
      } else if (error.message.includes("type") || error.message.includes("format")) {
        errorMessage = "File type not supported"
        statusCode = 400
      } else if (error.message.includes("network") || error.message.includes("timeout")) {
        errorMessage = "Network error during upload"
        statusCode = 408
      } else if (error.message.includes("database") || error.message.includes("sql")) {
        errorMessage = "Database error"
        statusCode = 500
      } else if (error.message.includes("blob") || error.message.includes("storage")) {
        errorMessage = "Storage error"
        statusCode = 500
      } else {
        errorMessage = `Upload failed: ${error.message}`
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: statusCode },
    )
  }
}
