"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Play, Pause, Volume2, VolumeX, AlertCircle, ExternalLink } from "lucide-react"

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  created_at: string
  mime_type?: string
  dimensions?: string
  duration?: number
  media_source?: string
  external_url?: string
  embed_settings?: string
}

interface MediaPreviewModalProps {
  file: MediaFile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MediaPreviewModal({ file, open, onOpenChange }: MediaPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // Reset errors when file changes
  useEffect(() => {
    setImageError(false)
    setVideoError(false)
    setIsPlaying(false)
  }, [file])

  if (!file) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isImage = file.mime_type?.startsWith("image/") || file.file_type === "image"
  const isVideo = file.mime_type?.startsWith("video/") || file.file_type === "video"
  const isPDF = file.mime_type === "application/pdf" || file.file_type === "document"
  const isGoogleSlides = file.file_type === "presentation" && file.media_source === "google_slides"

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.original_name
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImageError = () => {
    console.error("Image failed to load:", file.url)
    setImageError(true)
  }

  const handleVideoError = (e: any) => {
    console.error("Video failed to load:", file.url, e)
    setVideoError(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{file.original_name}</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {file.mime_type || file.file_type}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Debug Info */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <strong>Debug:</strong> Type: {file.file_type}, MIME: {file.mime_type}, URL: {file.url?.substring(0, 50)}...
          </div>

          {/* Media Preview */}
          <div className="flex justify-center bg-gray-50 rounded-lg p-4 min-h-[300px]">
            {isImage && !imageError && (
              <div className="relative max-w-full max-h-[60vh]">
                <img
                  src={file.url || "/placeholder.svg"}
                  alt={file.original_name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={handleImageError}
                  onLoad={() => console.log("Image loaded successfully:", file.url)}
                />
              </div>
            )}

            {isImage && imageError && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 p-8 rounded-lg inline-block">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-900 mb-2">Image Preview Error</h3>
                  <p className="text-red-700 mb-4">Unable to load image preview</p>
                  <div className="space-y-2">
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Image
                    </Button>
                    <Button onClick={() => window.open(file.url, "_blank")} variant="outline">
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isVideo && !videoError && (
              <div className="relative max-w-full max-h-[60vh]">
                <video
                  src={file.url}
                  className="max-w-full max-h-full rounded-lg shadow-lg"
                  controls
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={handleVideoError}
                  onLoadedData={() => console.log("Video loaded successfully:", file.url)}
                  preload="metadata"
                >
                  Your browser does not support video playback.
                </video>

                {/* Video Controls Overlay */}
                <div className="absolute bottom-4 left-4 flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const video = document.querySelector("video")
                      if (video) {
                        if (isPlaying) {
                          video.pause()
                        } else {
                          video.play()
                        }
                      }
                    }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const video = document.querySelector("video")
                      if (video) {
                        video.muted = !isMuted
                        setIsMuted(!isMuted)
                      }
                    }}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {isVideo && videoError && (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 p-8 rounded-lg inline-block">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-900 mb-2">Video Preview Error</h3>
                  <p className="text-red-700 mb-4">Unable to load video preview</p>
                  <div className="space-y-2">
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Video
                    </Button>
                    <Button onClick={() => window.open(file.url, "_blank")} variant="outline">
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isGoogleSlides && (
              <div className="relative max-w-full max-h-[60vh]">
                <iframe
                  src={file.url}
                  className="w-full h-[60vh] rounded-lg shadow-lg border"
                  frameBorder="0"
                  allowFullScreen
                  title={file.original_name}
                />
                <div className="absolute bottom-4 right-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(file.external_url || file.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Slides
                  </Button>
                </div>
              </div>
            )}

            {isPDF && (
              <div className="text-center py-12">
                <div className="bg-blue-50 border border-blue-200 p-8 rounded-lg inline-block">
                  <svg className="h-16 w-16 text-blue-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h3>
                  <p className="text-gray-600 mb-4">Click to download or view this PDF file</p>
                  <div className="space-y-2">
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button onClick={() => window.open(file.url, "_blank")} variant="outline">
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!isImage && !isVideo && !isPDF && !isGoogleSlides && (
              <div className="text-center py-12">
                <div className="bg-gray-100 p-8 rounded-lg inline-block">
                  <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">File Preview</h3>
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <div className="space-y-2">
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                    <Button onClick={() => window.open(file.url, "_blank")} variant="outline">
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">File Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">File name:</span>
                  <span className="font-medium">{file.original_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File size:</span>
                  <span className="font-medium">{formatFileSize(file.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File type:</span>
                  <Badge variant="secondary" className="text-xs">
                    {file.mime_type || file.file_type}
                  </Badge>
                </div>
                {file.media_source === "google_slides" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <Badge variant="secondary" className="text-xs">
                      Google Slides
                    </Badge>
                  </div>
                )}
                {file.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">{file.dimensions}</span>
                  </div>
                )}
                {file.embed_settings && JSON.parse(file.embed_settings).duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{JSON.parse(file.embed_settings).duration}s per slide</span>
                  </div>
                )}
                {file.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Upload Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Uploaded:</span>
                  <span className="font-medium">{formatDate(file.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File ID:</span>
                  <span className="font-medium font-mono text-xs">#{file.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span className="font-medium text-green-600">Vercel Blob</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">URL:</span>
                  <span className="font-mono text-xs truncate max-w-32" title={file.url}>
                    {file.url?.substring(0, 30)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
