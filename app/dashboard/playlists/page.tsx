"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Play,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Clock,
  Monitor,
  AlertCircle,
  RefreshCw,
  Database,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { Skeleton } from "@/components/ui/skeleton"
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

interface Playlist {
  id: number
  name: string
  description: string
  status: "draft" | "active" | "scheduled" | "paused"
  loop_enabled: boolean
  schedule_enabled: boolean
  start_time: string | null
  end_time: string | null
  selected_days: string[]
  item_count: number
  device_count: number
  total_duration: number
  assigned_devices: string[]
  created_at: string
  updated_at: string
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deletePlaylist, setDeletePlaylist] = useState<Playlist | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    console.log("🎵 [PLAYLISTS PAGE] Fetching playlists...")
    try {
      setLoading(true)
      setError(null)
      setNeedsSetup(false)

      const response = await fetch("/api/playlists")
      console.log("🎵 [PLAYLISTS PAGE] Response status:", response.status)

      const data = await response.json()
      console.log("🎵 [PLAYLISTS PAGE] Response data:", data)

      if (response.ok) {
        if (data.needsSetup) {
          setNeedsSetup(true)
          setPlaylists([])
        } else if (data.success) {
          // Ensure playlists is always an array
          setPlaylists(Array.isArray(data.playlists) ? data.playlists : [])
        } else {
          throw new Error(data.error || "Failed to fetch playlists")
        }
      } else {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("🎵 [PLAYLISTS PAGE] Error fetching playlists:", error)
      setError(error instanceof Error ? error.message : "Failed to load playlists")
      setPlaylists([]) // Ensure playlists is always an array
      toast.error("Failed to load playlists")
    } finally {
      setLoading(false)
    }
  }

  const handlePlaylistCreated = () => {
    console.log("🎵 [PLAYLISTS PAGE] Playlist created, refreshing list...")
    fetchPlaylists()
  }

  const handleDeletePlaylist = async (playlist: Playlist) => {
    console.log("🎵 [PLAYLISTS PAGE] Deleting playlist:", playlist.id)
    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete playlist")
      }

      const data = await response.json()
      console.log("🎵 [PLAYLISTS PAGE] Delete response:", data)

      setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id))
      toast.success("Playlist deleted successfully")
      setDeletePlaylist(null)
    } catch (error) {
      console.error("🎵 [PLAYLISTS PAGE] Error deleting playlist:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete playlist")
    }
  }

  const handleDuplicatePlaylist = async (playlist: Playlist) => {
    console.log("🎵 [PLAYLISTS PAGE] Duplicating playlist:", playlist.id)
    try {
      const duplicateData = {
        name: `${playlist.name} (Copy)`,
        description: playlist.description,
        loop_enabled: playlist.loop_enabled,
        schedule_enabled: false, // Reset scheduling for duplicates
        start_time: null,
        end_time: null,
        selected_days: [],
      }

      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to duplicate playlist")
      }

      const data = await response.json()
      console.log("🎵 [PLAYLISTS PAGE] Duplicate response:", data)

      if (data.success) {
        setPlaylists((prev) => [data.playlist, ...prev])
        toast.success("Playlist duplicated successfully")
      }
    } catch (error) {
      console.error("🎵 [PLAYLISTS PAGE] Error duplicating playlist:", error)
      toast.error(error instanceof Error ? error.message : "Failed to duplicate playlist")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Ensure playlists is always an array
  const safePlaylistsArray = Array.isArray(playlists) ? playlists : []

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Playlists</h1>
              <p className="text-gray-600">Create and manage content playlists for your screens</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (needsSetup) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Playlists</h1>
              <p className="text-gray-600">Create and manage content playlists for your screens</p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Setup Required</h3>
              <p className="text-gray-600 text-center mb-4">
                The playlist tables haven't been created yet. Please run the database setup script.
              </p>
              <div className="flex space-x-2">
                <Button onClick={fetchPlaylists}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Again
                </Button>
                <Button variant="outline" onClick={() => window.open("/api/debug-playlists", "_blank")}>
                  Debug Info
                </Button>
                <Button variant="outline" onClick={() => window.open("/dashboard/debug", "_blank")}>
                  Debug Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Playlists</h1>
              <p className="text-gray-600">Create and manage content playlists for your screens</p>
            </div>
            <Button onClick={fetchPlaylists}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Playlists</h3>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <div className="flex space-x-2">
                <Button onClick={fetchPlaylists}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => window.open("/api/debug-playlists", "_blank")}>
                  Debug Info
                </Button>
                <Button variant="outline" onClick={() => window.open("/dashboard/debug", "_blank")}>
                  Debug Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="text-gray-600">Create and manage content playlists for your screens</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchPlaylists}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safePlaylistsArray.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {safePlaylistsArray.filter((p) => p.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {safePlaylistsArray.filter((p) => p.status === "scheduled").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <Edit className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {safePlaylistsArray.filter((p) => p.status === "draft").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playlists Grid */}
        {safePlaylistsArray.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No playlists yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first playlist to start organizing your content for display
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {safePlaylistsArray.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    <Play className="h-5 w-5" />
                    <CardTitle className="text-lg">{playlist.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/playlists/${playlist.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicatePlaylist(playlist)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeletePlaylist(playlist)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription>{playlist.description || "No description"}</CardDescription>

                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(playlist.status)}>
                      {playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{playlist.item_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>{formatDuration(playlist.total_duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Screens:</span>
                      <span>{playlist.device_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Modified:</span>
                      <span>{formatDate(playlist.updated_at)}</span>
                    </div>
                  </div>

                  {Array.isArray(playlist.assigned_devices) && playlist.assigned_devices.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Active on:</div>
                      <div className="flex flex-wrap gap-1">
                        {playlist.assigned_devices.map((device, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Monitor className="h-3 w-3 mr-1" />
                            {device}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => router.push(`/dashboard/playlists/${playlist.id}`)}
                    >
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      {playlist.status === "draft" ? "Publish" : "Preview"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreatePlaylistDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onPlaylistCreated={handlePlaylistCreated}
        />

        <AlertDialog open={!!deletePlaylist} onOpenChange={() => setDeletePlaylist(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletePlaylist?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePlaylist && handleDeletePlaylist(deletePlaylist)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
