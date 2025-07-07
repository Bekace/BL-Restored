"use client"

import { useState } from "react"
import { FileText, Video, Music, ImageIcon, Presentation, File, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaFile {
  id: number
  filename: string
  original_filename?: string
  original_name?: string
  file_type: string
  mime_type?: string
  url: string
  thumbnail_url?: string
}

interface MediaThumbnailProps {
  file: MediaFile
  size?: "sm" | "md" | "lg"
  className?: string
  showIcon?: boolean
  onClick?: () => void
}

export function MediaThumbnail({ file, size = "md", className, showIcon = true, onClick }: MediaThumbnailProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-full h-full",
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  const isImage = file.mime_type?.startsWith("image/") || file.file_type?.startsWith("image/")
  const isVideo = file.mime_type?.startsWith("video/") || file.file_type?.startsWith("video/")
  const isPDF = file.mime_type === "application/pdf" || file.file_type === "application/pdf"
  const isAudio = file.mime_type?.startsWith("audio/") || file.file_type?.startsWith("audio/")
  const isPresentation =
    file.file_type === "presentation" ||
    file.mime_type?.includes("presentation") ||
    file.mime_type?.includes("powerpoint")

  const getIcon = () => {
    if (isVideo) return <Video className={iconSizes[size]} />
    if (isPDF) return <FileText className={iconSizes[size]} />
    if (isAudio) return <Music className={iconSizes[size]} />
    if (isPresentation) return <Presentation className={iconSizes[size]} />
    if (isImage) return <ImageIcon className={iconSizes[size]} />
    return <File className={iconSizes[size]} />
  }

  const getBackgroundColor = () => {
    if (isVideo) return "bg-purple-100"
    if (isPDF) return "bg-red-100"
    if (isAudio) return "bg-green-100"
    if (isPresentation) return "bg-orange-100"
    if (isImage) return "bg-blue-100"
    return "bg-gray-100"
  }

  // If it's an image and has a thumbnail or direct URL, try to show it
  if (isImage && (file.thumbnail_url || file.url) && !imageError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          sizeClasses[size],
          className,
          onClick ? "cursor-pointer" : "",
        )}
        onClick={onClick}
      >
        {imageLoading && (
          <div className={cn("absolute inset-0 flex items-center justify-center", getBackgroundColor())}>
            <Loader2 className={cn("animate-spin text-gray-400", iconSizes[size])} />
          </div>
        )}
        <img
          src={file.thumbnail_url || file.url}
          alt={file.original_filename || file.original_name || file.filename || "Media file"}
          className={cn("w-full h-full object-cover transition-opacity", imageLoading ? "opacity-0" : "opacity-100")}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true)
            setImageLoading(false)
          }}
        />
      </div>
    )
  }

  // Fallback to icon-based thumbnail
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg",
        sizeClasses[size],
        getBackgroundColor(),
        className,
        onClick ? "cursor-pointer" : "",
      )}
      onClick={onClick}
    >
      {showIcon && <div className="text-gray-600">{getIcon()}</div>}
    </div>
  )
}
