"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Play, ImageIcon, Video, Music, FileText, ExternalLink, Clock, Plus, Check } from "lucide-react"

interface MediaFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  mime_type?: string
  dimensions?: string
  duration?: number
  media_source?: string
  created_at: string
}

interface CreatePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlaylistCreated?: () => void
}

export function CreatePlaylistDialog({ open, onOpenChange, onPlaylistCreated }: CreatePlaylistDialogProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"basic" | "media">("basic")
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const fetchMediaFiles = async () => {
    setMediaLoading(true)
    try {
      const response = await fetch("/api/media")
      const data = await response.json()
      if (response.ok) {
        setMediaFiles(data.files || [])
      } else {
        toast.error("Failed to load media files")
      }
    } catch (error) {
      toast.error("Failed to load media files")
    } finally {
      setMediaLoading(false)
    }
  }

  const handleNext = async () => {
    if (!formData.name.trim()) {
      toast.error("Playlist name is required")
      return
    }
    setStep("media")
    await fetchMediaFiles()
  }

  const handleBack = () => {
    setStep("basic")
  }

  const toggleMediaSelection = (media: MediaFile) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((m) => m.id === media.id)
      if (isSelected) {
        return prev.filter((m) => m.id !== media.id)
      } else {
        return [...prev, media]
      }
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Playlist name is required")
      return
    }

    setLoading(true)

    try {
      // Create playlist first
      const playlistResponse = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
        }),
      })

      const playlistData = await playlistResponse.json()

      if (!playlistResponse.ok) {
        throw new Error(playlistData.error || "Failed to create playlist")
      }

      const playlistId = playlistData.playlist.id

      // Add selected media to playlist
      if (selectedMedia.length > 0) {
        for (const media of selectedMedia) {
          const defaultDuration = getDefaultDuration(media)

          await fetch(`/api/playlists/${playlistId}/items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              media_id: media.id,
              duration: defaultDuration,
              transition_type: "fade",
            }),
          })
        }
      }

      toast.success(`Playlist "${formData.name}" created with ${selectedMedia.length} items!`)
      onOpenChange(false)
      resetForm()

      // Notify parent component to refresh
      if (onPlaylistCreated) {
        onPlaylistCreated()
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create playlist")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", description: "" })
    setSelectedMedia([])
    setStep("basic")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }
  }

  const getDefaultDuration = (media: MediaFile) => {
    if (media.mime_type?.startsWith("video/")) return 0 // Use natural duration
    if (media.mime_type?.startsWith("audio/")) return 0 // Use natural duration
    if (media.media_source === "google_slides") return 10 // 10 seconds per slide
    return 8 // Default for images and documents
  }

  const getMediaIcon = (media: MediaFile) => {
    if (media.mime_type?.startsWith("video/")) return <Video className="h-4 w-4" />
    if (media.mime_type?.startsWith("audio/")) return <Music className="h-4 w-4" />
    if (media.media_source === "google_slides") return <ExternalLink className="h-4 w-4" />
    if (media.mime_type?.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getMediaTypeLabel = (media: MediaFile) => {
    if (media.mime_type?.startsWith("video/")) return "Video"
    if (media.mime_type?.startsWith("audio/")) return "Audio"
    if (media.media_source === "google_slides") return "Slides"
    if (media.mime_type?.startsWith("image/")) return "Image"
    if (media.mime_type?.includes("pdf")) return "PDF"
    return "Document"
  }

  const getMediaTypeColor = (media: MediaFile) => {
    if (media.mime_type?.startsWith("video/")) return "bg-blue-100 text-blue-800"
    if (media.mime_type?.startsWith("audio/")) return "bg-purple-100 text-purple-800"
    if (media.media_source === "google_slides") return "bg-green-100 text-green-800"
    if (media.mime_type?.startsWith("image/")) return "bg-orange-100 text-orange-800"
    if (media.mime_type?.includes("pdf")) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const groupedMedia = mediaFiles.reduce(
    (groups, media) => {
      const type = getMediaTypeLabel(media)
      if (!groups[type]) groups[type] = []
      groups[type].push(media)
      return groups
    },
    {} as Record<string, MediaFile[]>,
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        {step === "basic" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Create New Playlist
              </DialogTitle>
              <DialogDescription>
                Create a new playlist to organize your media content. You can add media files in the next step.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Playlist Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter playlist name..."
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter playlist description (optional)..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleNext} disabled={loading}>
                Next: Add Media
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Media to "{formData.name}"
              </DialogTitle>
              <DialogDescription>
                Select media files to add to your playlist. You can skip this step and add media later.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between py-2">
              <div className="text-sm text-gray-600">{selectedMedia.length} items selected</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMedia([])}
                  disabled={selectedMedia.length === 0}
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMedia([...mediaFiles])}
                  disabled={selectedMedia.length === mediaFiles.length}
                >
                  Select All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-96 border rounded-lg p-4">
              {mediaLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading media files...</span>
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No media files</h3>
                  <p className="text-gray-500">Upload some media files first to add them to playlists.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedMedia).map(([type, files]) => (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900">{type}s</h3>
                        <Badge variant="secondary">{files.length}</Badge>
                      </div>
                      <div className="grid gap-2">
                        {files.map((media) => {
                          const isSelected = selectedMedia.some((m) => m.id === media.id)
                          return (
                            <Card
                              key={media.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
                              }`}
                              onClick={() => toggleMediaSelection(media)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0">
                                    {isSelected ? (
                                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Check className="h-3 w-3 text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm truncate">
                                        {media.original_name || media.filename}
                                      </h4>
                                      <Badge className={`text-xs ${getMediaTypeColor(media)}`}>
                                        {getMediaIcon(media)}
                                        <span className="ml-1">{getMediaTypeLabel(media)}</span>
                                      </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>{formatFileSize(media.file_size)}</span>
                                      {media.dimensions && <span>{media.dimensions}</span>}
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{getDefaultDuration(media)}s</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                      {type !== Object.keys(groupedMedia)[Object.keys(groupedMedia).length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading
                  ? "Creating..."
                  : `Create Playlist${selectedMedia.length > 0 ? ` (${selectedMedia.length} items)` : ""}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
