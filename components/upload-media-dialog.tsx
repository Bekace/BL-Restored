"use client"

import type React from "react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, CheckCircle, XCircle } from "lucide-react"

interface UploadMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

export function UploadMediaDialog({ open, onOpenChange, onUploadComplete }: UploadMediaDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log("File selected:", file ? file.name : "No file")

    if (!file) return

    // Reset states
    setError(null)
    setUploadComplete(false)
    setUploadProgress(0)

    // Set file size limits based on Vercel's 4.5MB body limit
    // Account for FormData overhead by setting file limits slightly lower
    let maxSize: number
    let maxSizeMB: string

    if (file.type.startsWith("video/")) {
      maxSize = 4 * 1024 * 1024 // 4MB for videos
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
      setError(
        `File size must be less than ${maxSizeMB}. Your file is ${fileSizeMB}MB. This limit is due to Vercel's serverless function constraints.`,
      )
      return
    }

    setSelectedFile(file)
    console.log("File validated and set:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file")
      return
    }

    console.log("Starting upload process...")

    try {
      setUploading(true)
      setUploadProgress(10)
      setError(null)
      setUploadComplete(false)

      console.log("Creating FormData...")
      const formData = new FormData()
      formData.append("file", selectedFile)

      console.log("FormData created, making API call...")
      setUploadProgress(20)

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      console.log("API response received:", response.status, response.statusText)
      setUploadProgress(80)

      // Handle different response types
      let data
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
        console.log("Response data (JSON):", data)
      } else {
        // Handle non-JSON responses (like 413 errors)
        const text = await response.text()
        console.log("Response data (Text):", text)
        data = { error: text || `Server error (${response.status})` }
      }

      if (response.ok && data.success) {
        console.log("Upload successful!")
        setUploadProgress(100)
        setUploadComplete(true)

        // Wait a moment to show success, then close and refresh
        setTimeout(() => {
          onUploadComplete()
          handleClose()
        }, 1500)
      } else {
        console.error("Upload failed:", data.error)

        // Provide specific error messages based on status code
        let errorMessage = data.error || "Upload failed"

        if (response.status === 413) {
          errorMessage = "File is too large for Vercel's serverless functions (4.5MB limit). Try a smaller file."
        } else if (response.status === 401) {
          errorMessage = "You are not authorized to upload files. Please log in again."
        } else if (response.status === 400) {
          errorMessage = data.error || "Invalid file or request."
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later."
        }

        setError(errorMessage)
        setUploadProgress(0)
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Network error during upload")
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploading) {
      console.log("Cannot close dialog during upload")
      return false
    }

    console.log("Closing dialog and resetting state")
    onOpenChange(false)
    setSelectedFile(null)
    setError(null)
    setUploadProgress(0)
    setUploadComplete(false)
    return true
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && uploading) {
          // Prevent closing during upload
          console.log("Prevented dialog close during upload")
          return
        }
        if (!newOpen) {
          handleClose()
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Media
          </AlertDialogTitle>
          <AlertDialogDescription>
            Select a file to upload to your media library.
            <br />
            <strong>Limits:</strong> Videos/Audio (4MB), Images/PDFs/Documents (3MB)
            <br />
            <small className="text-gray-500">Limited by Vercel's serverless function constraints</small>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4 py-4">
          <Input
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
            disabled={uploading}
            className="cursor-pointer"
          />

          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">{selectedFile.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-3">
              <Progress value={uploadProgress} className="w-full" />
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading... {uploadProgress}%
              </div>
              <div className="text-xs text-center text-gray-500">Please wait, do not close this window</div>
            </div>
          )}

          {uploadComplete && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Upload completed successfully!
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <div className="font-medium">Upload Failed</div>
                <div className="mt-1">{error}</div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={uploading}
            onClick={(e) => {
              if (uploading) {
                e.preventDefault()
                console.log("Cancel button disabled during upload")
                return
              }
              handleClose()
            }}
            className={uploading ? "opacity-50 cursor-not-allowed" : ""}
          >
            {uploading ? "Uploading..." : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              if (!uploading && !uploadComplete) {
                handleUpload()
              }
            }}
            disabled={!selectedFile || uploading || uploadComplete}
            className={!selectedFile || uploading || uploadComplete ? "opacity-50 cursor-not-allowed" : ""}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : uploadComplete ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default UploadMediaDialog
