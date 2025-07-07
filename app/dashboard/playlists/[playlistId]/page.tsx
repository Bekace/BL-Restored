"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Play,
  SkipForward,
  SkipBack,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  RefreshCw,
  Clock,
  Search,
  FileText,
  Loader2,
  HardDrive,
  Hash,
  Eye,
  Timer,
} from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PlaylistOptionsDialog } from "@/components/playlist-options-dialog"
import { PlaylistPreviewModal } from "@/components/playlist-preview-modal"
import { PlaylistItemDurationDialog } from "@/components/playlist-item-duration-dialog"
import { MediaThumbnail } from "@/components/media-thumbnail"
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

interface MediaFile {
  id: number
  filename: string
  original_filename?: string
  original_name?: string
  file_type: string
  file_size: number
  url: string
  thumbnail_url?: string
  mime_type?: string
  dimensions?: string
  duration?: number
  media_source?: string
  external_url?: string
  embed_settings?: string
  created_at: string
}

interface PlaylistItem {
  id: number
  playlist_id: number
  media_id: number
  position: number
  duration?: number
  transition_type: string
  created_at: string
  media?: MediaFile
  media_file?: MediaFile
}

interface Playlist {
  id: number
  name: string
  description?: string
  status: string
  loop_enabled: boolean
  schedule_enabled: boolean
  start_time?: string
  end_time?: string
  selected_days: string[]
  scale_image: string
  scale_video: string
  scale_document: string
  shuffle: boolean
  default_transition: string
  transition_speed: string
  auto_advance: boolean
  background_color: string
  text_overlay: boolean
  created_at: string
  updated_at: string
}

function SortablePlaylistItem({
  item,
  onRemove,
  onEditDuration,
}: {
  item: PlaylistItem
  onRemove: (id: number) => void
  onEditDuration: (item: PlaylistItem) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeLabel = (fileType: string, mediaSource?: string) => {
    if (mediaSource === "google_slides") return "Google Slides"
    if (fileType.startsWith("image/")) return "Image"
    if (fileType.startsWith("video/")) return "Video"
    if (fileType.includes("pdf")) return "PDF"
    if (fileType.startsWith("audio/")) return "Audio"
    if (fileType.includes("presentation")) return "Slides"
    return "File"
  }

  // Use media or media_file, whichever is available
  const mediaFile = item.media || item.media_file

  if (!mediaFile) {
    return (
      <div ref={setNodeRef} style={style} className="mb-2">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-red-700">Media file not found</h4>
                <p className="text-sm text-red-600">Media ID: {item.media_id}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("🗑️ [PLAYLIST ITEM] Delete button clicked for item:", item.id)
                  onRemove(item.id)
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              onMouseDown={(e) => {
                console.log("🎯 [PLAYLIST ITEM] Drag handle clicked for item:", item.id)
              }}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>

            <div className="w-12 h-12 flex-shrink-0">
              <MediaThumbnail
                file={{
                  ...mediaFile,
                  original_filename: mediaFile.original_name || mediaFile.original_filename || mediaFile.filename,
                }}
                size="sm"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {mediaFile.original_name || mediaFile.original_filename || mediaFile.filename || "Untitled"}
              </h4>
              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {getFileTypeLabel(mediaFile.file_type, mediaFile.media_source)}
                </Badge>
                <span>{formatFileSize(mediaFile.file_size)}</span>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{item.duration || 30}s</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.transition_type}
                </Badge>
                {mediaFile.media_source === "google_slides" && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Auto-advance
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("⏱️ [PLAYLIST ITEM] Duration edit button clicked for item:", item.id)
                  onEditDuration(item)
                }}
                className="text-blue-500 hover:text-blue-700"
              >
                <Timer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("🗑️ [PLAYLIST ITEM] Delete button clicked for item:", item.id)
                  onRemove(item.id)
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PlaylistEditorPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.playlistId as string

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [mediaLoading, setMediaLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [removeItem, setRemoveItem] = useState<PlaylistItem | null>(null)
  const [editDurationItem, setEditDurationItem] = useState<PlaylistItem | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist()
      fetchPlaylistItems()
      fetchMediaFiles()
    }
  }, [playlistId])

  const fetchPlaylist = async () => {
    try {
      console.log("🎵 [PLAYLIST EDITOR] Fetching playlist:", playlistId)
      const response = await fetch(`/api/playlists/${playlistId}`)
      const data = await response.json()

      console.log("🎵 [PLAYLIST EDITOR] Playlist response:", data)

      if (response.ok) {
        setPlaylist(data.playlist)
      } else {
        setError(data.error || "Failed to load playlist")
      }
    } catch (err) {
      setError("Failed to load playlist")
      console.error("Error fetching playlist:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylistItems = async () => {
    try {
      console.log("📋 [PLAYLIST EDITOR] Fetching playlist items for:", playlistId)
      const response = await fetch(`/api/playlists/${playlistId}/items`)
      const data = await response.json()

      console.log("📋 [PLAYLIST EDITOR] Playlist items response:", data)

      if (response.ok) {
        setPlaylistItems(data.items || [])
      } else {
        console.error("Failed to load playlist items:", data.error)
        setPlaylistItems([])
      }
    } catch (err) {
      console.error("Error fetching playlist items:", err)
      setPlaylistItems([])
    }
  }

  const fetchMediaFiles = async () => {
    try {
      setMediaLoading(true)
      setMediaError(null)
      console.log("📁 [PLAYLIST EDITOR] Fetching media files...")

      const response = await fetch("/api/media")
      const data = await response.json()

      console.log("📁 [PLAYLIST EDITOR] Media response:", data)

      if (response.ok) {
        // Use 'media' property for playlist editor compatibility
        const files = data.media || data.files || []
        console.log("📁 [PLAYLIST EDITOR] Setting media files:", files)
        setMediaFiles(files)
      } else {
        const errorMsg = data.error || "Failed to load media files"
        setMediaError(errorMsg)
        console.error("Media API error:", errorMsg)
      }
    } catch (err) {
      const errorMsg = "Failed to load media files"
      setMediaError(errorMsg)
      console.error("Error fetching media files:", err)
    } finally {
      setMediaLoading(false)
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    console.log("🎯 [PLAYLIST EDITOR] Drag end event:", { active: active?.id, over: over?.id })

    if (!over || active.id === over.id) {
      console.log("🎯 [PLAYLIST EDITOR] No drag change needed")
      return
    }

    const oldIndex = playlistItems.findIndex((item) => item.id.toString() === active.id)
    const newIndex = playlistItems.findIndex((item) => item.id.toString() === over.id)

    console.log("🎯 [PLAYLIST EDITOR] Drag indices:", { oldIndex, newIndex })

    if (oldIndex === -1 || newIndex === -1) {
      console.log("🎯 [PLAYLIST EDITOR] Invalid drag indices")
      return
    }

    const newItems = arrayMove(playlistItems, oldIndex, newIndex)

    // Update local state immediately for better UX
    setPlaylistItems(newItems)

    console.log("🎯 [PLAYLIST EDITOR] Items reordered locally, updating server...")

    // Update positions on server
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: newItems.map((item, index) => ({
            id: item.id,
            position: index + 1,
          })),
        }),
      })

      const data = await response.json()
      console.log("🎯 [PLAYLIST EDITOR] Server reorder response:", data)

      if (!response.ok) {
        console.error("🎯 [PLAYLIST EDITOR] Server reorder failed, reverting...")
        // Revert on error
        setPlaylistItems(playlistItems) // Revert to original order
        toast.error(data.error || "Failed to reorder items")
      } else {
        console.log("🎯 [PLAYLIST EDITOR] Server reorder successful")
        // Update with server response to ensure consistency
        if (data.items) {
          setPlaylistItems(data.items)
        }
        toast.success("Playlist order updated")
      }
    } catch (error) {
      console.error("🎯 [PLAYLIST EDITOR] Reorder error:", error)
      // Revert on error
      setPlaylistItems(playlistItems) // Revert to original order
      toast.error("Failed to reorder items")
    }
  }

  const addMediaToPlaylist = async (mediaFile: MediaFile) => {
    try {
      console.log("➕ [PLAYLIST EDITOR] Adding media to playlist:", mediaFile)

      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_id: mediaFile.id,
          duration: 30, // Default duration
        }),
      })

      const data = await response.json()
      console.log("➕ [PLAYLIST EDITOR] Add media response:", data)

      if (response.ok) {
        await fetchPlaylistItems() // Refresh the items to get complete data
        toast.success(`Added "${mediaFile.original_name || mediaFile.filename}" to playlist`)
      } else {
        toast.error(data.error || "Failed to add media to playlist")
      }
    } catch (error) {
      console.error("Error adding media to playlist:", error)
      toast.error("Failed to add media to playlist")
    }
  }

  const removeFromPlaylist = async (itemId: number) => {
    try {
      console.log("🗑️ [PLAYLIST EDITOR] Removing item from playlist:", itemId)

      const response = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, {
        method: "DELETE",
      })

      console.log("🗑️ [PLAYLIST EDITOR] Delete response status:", response.status)

      if (response.ok) {
        console.log("🗑️ [PLAYLIST EDITOR] Item deleted successfully, updating local state")
        setPlaylistItems((prev) => prev.filter((item) => item.id !== itemId))
        toast.success("Item removed from playlist")
        setRemoveItem(null)
      } else {
        const errorData = await response.json()
        console.error("🗑️ [PLAYLIST EDITOR] Delete failed:", errorData)
        toast.error(errorData.error || "Failed to remove item")
      }
    } catch (error) {
      console.error("🗑️ [PLAYLIST EDITOR] Error removing item:", error)
      toast.error("Failed to remove item")
    }
  }

  const updateItemDuration = async (itemId: number, duration: number, transition: string) => {
    try {
      console.log("⏱️ [PLAYLIST EDITOR] Updating item duration:", { itemId, duration, transition })

      const response = await fetch(`/api/playlists/${playlistId}/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration,
          transition_type: transition,
        }),
      })

      if (response.ok) {
        console.log("⏱️ [PLAYLIST EDITOR] Duration updated successfully")
        // Update local state
        setPlaylistItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, duration, transition_type: transition } : item)),
        )
        toast.success("Playback settings updated")
      } else {
        const errorData = await response.json()
        console.error("⏱️ [PLAYLIST EDITOR] Duration update failed:", errorData)
        toast.error(errorData.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("⏱️ [PLAYLIST EDITOR] Error updating item duration:", error)
      toast.error("Failed to update settings")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTotalSize = () => {
    return playlistItems.reduce((total, item) => {
      const mediaFile = item.media || item.media_file
      return total + (mediaFile?.file_size || 0)
    }, 0)
  }

  const getTotalDuration = () => {
    return playlistItems.reduce((total, item) => total + (item.duration || 30), 0)
  }

  const getFileTypeLabel = (fileType: string, mediaSource?: string) => {
    if (mediaSource === "google_slides") return "Google Slides"
    if (fileType.startsWith("image/")) return "Image"
    if (fileType.startsWith("video/")) return "Video"
    if (fileType.includes("pdf")) return "PDF"
    if (fileType.startsWith("audio/")) return "Audio"
    if (fileType.includes("presentation")) return "Slides"
    return "File"
  }

  const filteredMediaFiles = mediaFiles.filter((file) => {
    const fileName = file.original_name || file.original_filename || file.filename || ""
    return fileName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading playlist...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !playlist) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || "Playlist not found"}</p>
          <Button onClick={() => router.push("/dashboard/playlists")} variant="outline">
            Back to Playlists
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/playlists")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{playlist.name}</h1>
              <p className="text-gray-600">{playlist.description || "No description"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={playlist.status === "active" ? "default" : "secondary"}>{playlist.status}</Badge>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="default" onClick={() => setShowPreview(true)} disabled={playlistItems.length === 0}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(getTotalSize())}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalDuration()} sec</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium"># of items</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playlistItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{playlist.status}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playlist Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Playlist Items ({playlistItems.length})</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={fetchPlaylistItems}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                      disabled={currentItemIndex === 0}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentItemIndex(Math.min(playlistItems.length - 1, currentItemIndex + 1))}
                      disabled={currentItemIndex >= playlistItems.length - 1}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playlistItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Plus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items in playlist</h3>
                    <p className="text-gray-500">Add some media files from the library to get started.</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    onDragStart={(event) => {
                      console.log("🎯 [PLAYLIST EDITOR] Drag started:", event.active.id)
                    }}
                  >
                    <SortableContext
                      items={playlistItems.map((item) => item.id.toString())}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {playlistItems.map((item) => (
                          <SortablePlaylistItem
                            key={item.id}
                            item={item}
                            onRemove={(id) => {
                              console.log("🗑️ [PLAYLIST EDITOR] Remove requested for item:", id)
                              const itemToRemove = playlistItems.find((i) => i.id === id)
                              if (itemToRemove) {
                                console.log("🗑️ [PLAYLIST EDITOR] Setting remove item:", itemToRemove)
                                setRemoveItem(itemToRemove)
                              }
                            }}
                            onEditDuration={(item) => {
                              console.log("⏱️ [PLAYLIST EDITOR] Duration edit requested for item:", item)
                              setEditDurationItem(item)
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Library */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Media Library</span>
                  <Button variant="ghost" size="sm" onClick={fetchMediaFiles}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Separator />
                <ScrollArea className="h-96">
                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading media...</span>
                    </div>
                  ) : mediaError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 mb-2">{mediaError}</p>
                      <Button variant="outline" size="sm" onClick={fetchMediaFiles}>
                        Try Again
                      </Button>
                    </div>
                  ) : filteredMediaFiles.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">
                        {searchQuery ? "No media files match your search." : "No media files available."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMediaFiles.map((file) => (
                        <Card
                          key={file.id}
                          className="cursor-pointer hover:shadow-md transition-shadow group"
                          onClick={() => addMediaToPlaylist(file)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3">
                              <MediaThumbnail
                                file={{
                                  ...file,
                                  original_filename: file.original_name || file.original_filename || file.filename,
                                }}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {file.original_name || file.original_filename || file.filename || "Untitled"}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {getFileTypeLabel(file.file_type, file.media_source)}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{formatFileSize(file.file_size)}</span>
                                  {file.media_source === "google_slides" && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      Auto-advance
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Playlist Settings Dialog */}
        {showSettings && playlist && (
          <PlaylistOptionsDialog
            open={showSettings}
            onOpenChange={setShowSettings}
            options={{
              scale_image: playlist.scale_image,
              scale_video: playlist.scale_video,
              scale_document: playlist.scale_document,
              shuffle: playlist.shuffle,
              default_transition: playlist.default_transition,
              transition_speed: playlist.transition_speed,
              auto_advance: playlist.auto_advance,
              loop_playlist: playlist.loop_enabled,
              background_color: playlist.background_color,
              text_overlay: playlist.text_overlay,
            }}
            onSave={async (options) => {
              try {
                const response = await fetch(`/api/playlists/${playlistId}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(options),
                })

                if (response.ok) {
                  const data = await response.json()
                  setPlaylist(data.playlist)
                  setShowSettings(false)
                  toast.success("Playlist settings updated")
                } else {
                  toast.error("Failed to update settings")
                }
              } catch (error) {
                toast.error("Failed to update settings")
              }
            }}
          />
        )}

        {/* Preview Modal */}
        {showPreview && playlist && (
          <PlaylistPreviewModal
            open={showPreview}
            onOpenChange={setShowPreview}
            playlist={playlist}
            items={playlistItems}
          />
        )}

        {/* Duration Edit Dialog */}
        {editDurationItem && (
          <PlaylistItemDurationDialog
            open={!!editDurationItem}
            onOpenChange={(open) => !open && setEditDurationItem(null)}
            currentDuration={editDurationItem.duration || 30}
            currentTransition={editDurationItem.transition_type || "fade"}
            mediaName={
              (editDurationItem.media || editDurationItem.media_file)?.original_name ||
              (editDurationItem.media || editDurationItem.media_file)?.original_filename ||
              (editDurationItem.media || editDurationItem.media_file)?.filename ||
              "Unknown Media"
            }
            onSave={(duration, transition) => {
              updateItemDuration(editDurationItem.id, duration, transition)
              setEditDurationItem(null)
            }}
          />
        )}

        {/* Remove Item Dialog */}
        <AlertDialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "
                {(removeItem?.media || removeItem?.media_file)?.original_name ||
                  (removeItem?.media || removeItem?.media_file)?.original_filename ||
                  (removeItem?.media || removeItem?.media_file)?.filename ||
                  "this item"}
                " from this playlist?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (removeItem) {
                    console.log("🗑️ [PLAYLIST EDITOR] Confirming removal of item:", removeItem.id)
                    removeFromPlaylist(removeItem.id)
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
