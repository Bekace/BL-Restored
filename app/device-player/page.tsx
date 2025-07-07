"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Monitor,
  WifiOff,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

interface DeviceInfo {
  name: string
  type: string
  platform: string
  userAgent: string
  screenResolution: string
  capabilities: string[]
}

interface PlaylistItem {
  id: string
  type: "image" | "video" | "web" | "slides"
  url: string
  duration: number
  name: string
}

interface Playlist {
  id: string
  name: string
  items: PlaylistItem[]
  settings: {
    loop: boolean
    shuffle: boolean
    transitionDuration: number
  }
}

export default function DevicePlayerPage() {
  const [pairingCode, setPairingCode] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "reconnecting"
  >("disconnected")

  // Playlist and playback state
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackStatus, setPlaybackStatus] = useState("idle")
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)

  // Reconnection state
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [maxReconnectAttempts] = useState(5)
  const [reconnectDelay, setReconnectDelay] = useState(5000) // Start with 5 seconds

  // Refs for intervals
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null)
  const playlistPollInterval = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const itemTimer = useRef<NodeJS.Timeout | null>(null)

  // Generate device info
  const generateDeviceInfo = useCallback((): DeviceInfo => {
    const deviceId = Math.random().toString(36).substring(2, 15)

    // Safe access to browser APIs
    const getScreenResolution = () => {
      if (typeof window !== "undefined" && window.screen) {
        return `${window.screen.width}x${window.screen.height}`
      }
      return "1920x1080"
    }

    const getPlatform = () => {
      if (typeof navigator !== "undefined" && navigator.platform) {
        return navigator.platform
      }
      return "Web"
    }

    const getUserAgent = () => {
      if (typeof navigator !== "undefined" && navigator.userAgent) {
        return navigator.userAgent
      }
      return "Unknown Browser"
    }

    return {
      name: `Device Player ${deviceId}`,
      type: "web_browser",
      platform: getPlatform(),
      userAgent: getUserAgent(),
      screenResolution: getScreenResolution(),
      capabilities: ["video", "image", "audio", "web", "slides", "pdf", "office", "text"],
    }
  }, [])

  // Initialize device info
  useEffect(() => {
    setDeviceInfo(generateDeviceInfo())

    // Check for saved connection
    const savedPairingCode = localStorage.getItem("devicePairingCode")
    const savedDeviceId = localStorage.getItem("deviceId")

    if (savedPairingCode && savedDeviceId) {
      setPairingCode(savedPairingCode)
      setDeviceId(savedDeviceId)
      setIsConnected(true)
      setConnectionStatus("connected")
      startHeartbeat()
      startPlaylistPolling()
    }
  }, [generateDeviceInfo])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)
      if (playlistPollInterval.current) clearInterval(playlistPollInterval.current)
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (itemTimer.current) clearTimeout(itemTimer.current)
    }
  }, [])

  // Connect to pairing code
  const connectDevice = async () => {
    if (!pairingCode.trim() || !deviceInfo) {
      setError("Please enter a pairing code")
      return
    }

    setIsConnecting(true)
    setConnectionStatus("connecting")
    setError("")

    try {
      console.log("[DEVICE PLAYER] Connecting with:", {
        deviceCode: pairingCode.toUpperCase(),
        ...deviceInfo,
      })

      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode: pairingCode.toUpperCase(),
          name: deviceInfo.name,
          deviceType: deviceInfo.type,
          platform: deviceInfo.platform,
          userAgent: deviceInfo.userAgent,
          screenResolution: deviceInfo.screenResolution,
          capabilities: deviceInfo.capabilities,
        }),
      })

      const result = await response.json()
      console.log("[DEVICE PLAYER] Registration response:", result)

      if (result.success) {
        setDeviceId(result.device.id)
        setIsConnected(true)
        setConnectionStatus("connected")
        setError("")
        setReconnectAttempts(0)
        setReconnectDelay(5000)

        // Save connection info
        localStorage.setItem("devicePairingCode", pairingCode.toUpperCase())
        localStorage.setItem("deviceId", result.device.id)

        // Start monitoring
        startHeartbeat()
        startPlaylistPolling()
      } else {
        setError(result.error || "Failed to connect device")
        setConnectionStatus("disconnected")
      }
    } catch (err) {
      console.error("Connection error:", err)
      setError("Failed to connect to server")
      setConnectionStatus("disconnected")
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect device
  const disconnectDevice = () => {
    // Clear intervals
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)
    if (playlistPollInterval.current) clearInterval(playlistPollInterval.current)
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
    if (itemTimer.current) clearTimeout(itemTimer.current)

    // Clear state
    setIsConnected(false)
    setConnectionStatus("disconnected")
    setDeviceId(null)
    setCurrentPlaylist(null)
    setIsPlaying(false)
    setReconnectAttempts(0)

    // Clear saved connection
    localStorage.removeItem("devicePairingCode")
    localStorage.removeItem("deviceId")
  }

  // Attempt to reconnect
  const attemptReconnect = useCallback(async () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setError("Maximum reconnection attempts reached. Please reconnect manually.")
      setConnectionStatus("disconnected")
      return
    }

    setConnectionStatus("reconnecting")
    setReconnectAttempts((prev) => prev + 1)

    try {
      // Try to re-register with the same pairing code
      await connectDevice()
    } catch (error) {
      console.error("Reconnection failed:", error)

      // Exponential backoff
      const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), 60000) // Max 1 minute
      setReconnectDelay(delay)

      reconnectTimeout.current = setTimeout(() => {
        attemptReconnect()
      }, delay)
    }
  }, [reconnectAttempts, maxReconnectAttempts, reconnectDelay])

  // Start heartbeat monitoring
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current)

    const sendHeartbeat = async () => {
      if (!deviceId) return

      try {
        const response = await fetch(`/api/devices/${deviceId}/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: isPlaying ? "playing" : "idle",
            currentItemId: currentPlaylist?.items[currentItemIndex]?.id || null,
            performanceMetrics: {
              timestamp: Date.now(),
              playbackStatus,
              reconnectAttempts,
            },
          }),
        })

        if (response.ok) {
          setLastHeartbeat(new Date())
          setConnectionStatus("connected")
        } else {
          throw new Error("Heartbeat failed")
        }
      } catch (error) {
        console.error("Heartbeat error:", error)
        if (isConnected) {
          attemptReconnect()
        }
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval (every 30 seconds)
    heartbeatInterval.current = setInterval(sendHeartbeat, 30000)
  }, [
    deviceId,
    isPlaying,
    currentPlaylist,
    currentItemIndex,
    playbackStatus,
    reconnectAttempts,
    isConnected,
    attemptReconnect,
  ])

  // Start playlist polling
  const startPlaylistPolling = useCallback(() => {
    if (playlistPollInterval.current) clearInterval(playlistPollInterval.current)

    const pollPlaylist = async () => {
      if (!deviceId) return

      try {
        const response = await fetch(`/api/devices/${deviceId}/playlist`)
        if (response.ok) {
          const data = await response.json()
          if (data.playlist) {
            setCurrentPlaylist(data.playlist)
            if (data.playlist.items.length > 0 && !isPlaying) {
              setIsPlaying(true)
              setPlaybackStatus("playing")
            }
          }
        }
      } catch (error) {
        console.error("Failed to check for playlist:", error)
      }
    }

    // Poll immediately
    pollPlaylist()

    // Set up interval (every 10 seconds)
    playlistPollInterval.current = setInterval(pollPlaylist, 10000)
  }, [deviceId, isPlaying])

  // Handle media playback
  const playCurrentItem = useCallback(() => {
    if (!currentPlaylist || currentPlaylist.items.length === 0) return

    const currentItem = currentPlaylist.items[currentItemIndex]
    setPlaybackStatus(`playing: ${currentItem.name}`)

    // Clear existing timer
    if (itemTimer.current) clearTimeout(itemTimer.current)

    // Auto-advance after duration
    itemTimer.current = setTimeout(() => {
      nextItem()
    }, currentItem.duration * 1000)
  }, [currentPlaylist, currentItemIndex])

  const nextItem = useCallback(() => {
    if (!currentPlaylist) return

    const nextIndex = (currentItemIndex + 1) % currentPlaylist.items.length
    setCurrentItemIndex(nextIndex)
  }, [currentPlaylist, currentItemIndex])

  const previousItem = useCallback(() => {
    if (!currentPlaylist) return

    const prevIndex = currentItemIndex === 0 ? currentPlaylist.items.length - 1 : currentItemIndex - 1
    setCurrentItemIndex(prevIndex)
  }, [currentPlaylist, currentItemIndex])

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    setPlaybackStatus(isPlaying ? "paused" : "playing")

    if (itemTimer.current) {
      clearTimeout(itemTimer.current)
    }
  }

  // Start playback when playlist changes
  useEffect(() => {
    if (currentPlaylist && isPlaying) {
      playCurrentItem()
    }
  }, [currentPlaylist, currentItemIndex, isPlaying, playCurrentItem])

  // Render current media
  const renderCurrentMedia = () => {
    if (!currentPlaylist || !isPlaying) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <Monitor className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Waiting for content...</p>
            {connectionStatus === "reconnecting" && (
              <p className="text-sm text-orange-600 mt-2">
                Reconnecting... (Attempt {reconnectAttempts}/{maxReconnectAttempts})
              </p>
            )}
          </div>
        </div>
      )
    }

    const currentItem = currentPlaylist.items[currentItemIndex]

    switch (currentItem.type) {
      case "image":
        return (
          <div className="relative h-64 bg-black rounded-lg overflow-hidden">
            <img
              src={currentItem.url || "/placeholder.svg"}
              alt={currentItem.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=300&width=400&text=Image+Error"
              }}
            />
          </div>
        )

      case "video":
        return (
          <div className="relative h-64 bg-black rounded-lg overflow-hidden">
            <video
              src={currentItem.url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              controls={false}
              onError={() => console.error("Video playback error")}
            />
          </div>
        )

      case "web":
        return (
          <div className="relative h-64 bg-white rounded-lg overflow-hidden border">
            <iframe
              src={currentItem.url}
              className="w-full h-full"
              title={currentItem.name}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )

      case "slides":
        return (
          <div className="relative h-64 bg-white rounded-lg overflow-hidden border">
            <iframe
              src={currentItem.url}
              className="w-full h-full"
              title={currentItem.name}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-600">Unsupported media type: {currentItem.type}</p>
          </div>
        )
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "connecting":
      case "reconnecting":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "disconnected":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected"
      case "connecting":
        return "Connecting..."
      case "reconnecting":
        return `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`
      case "disconnected":
        return "Disconnected"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-6 w-6" />
              Digital Signage Player
              <Badge
                variant={
                  connectionStatus === "connected"
                    ? "default"
                    : connectionStatus === "disconnected"
                      ? "destructive"
                      : "secondary"
                }
                className="ml-auto"
              >
                {getConnectionStatusIcon()}
                <span className="ml-1">{getConnectionStatusText()}</span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter pairing code (e.g., ABC123)"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    className="flex-1"
                    maxLength={6}
                  />
                  <Button onClick={connectDevice} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Device:</strong> {deviceInfo?.name}
                  </div>
                  <div>
                    <strong>Type:</strong> {deviceInfo?.type}
                  </div>
                  <div>
                    <strong>Platform:</strong> {deviceInfo?.platform}
                  </div>
                  <div>
                    <strong>Resolution:</strong> {deviceInfo?.screenResolution}
                  </div>
                  <div>
                    <strong>Last Heartbeat:</strong> {lastHeartbeat ? lastHeartbeat.toLocaleTimeString() : "Never"}
                  </div>
                  <div>
                    <strong>Pairing Code:</strong> {pairingCode}
                  </div>
                </div>

                {/* Connection Actions */}
                <div className="flex gap-2">
                  <Button onClick={togglePlayback} variant="outline" size="sm" disabled={!currentPlaylist}>
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button onClick={previousItem} variant="outline" size="sm" disabled={!currentPlaylist}>
                    <SkipBack className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button onClick={nextItem} variant="outline" size="sm" disabled={!currentPlaylist}>
                    <SkipForward className="h-4 w-4 mr-2" />
                    Next
                  </Button>
                  <Button
                    onClick={attemptReconnect}
                    variant="outline"
                    size="sm"
                    disabled={connectionStatus === "reconnecting"}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                  <Button onClick={disconnectDevice} variant="destructive" size="sm">
                    Disconnect
                  </Button>
                </div>

                {/* Reconnection Status */}
                {connectionStatus === "reconnecting" && (
                  <Alert>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Connection lost. Attempting to reconnect... (Attempt {reconnectAttempts}/{maxReconnectAttempts})
                      {reconnectAttempts < maxReconnectAttempts && (
                        <span className="block text-sm text-gray-600 mt-1">
                          Next attempt in {Math.ceil(reconnectDelay / 1000)} seconds
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Display */}
        <Card>
          <CardHeader>
            <CardTitle>
              Display
              {currentPlaylist && (
                <Badge variant="outline" className="ml-2">
                  {currentPlaylist.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderCurrentMedia()}</CardContent>
        </Card>

        {/* Playlist Info */}
        {currentPlaylist && (
          <Card>
            <CardHeader>
              <CardTitle>Current Playlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{currentPlaylist.name}</span>
                  <Badge>{currentPlaylist.items.length} items</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Status: {playbackStatus} | Item {currentItemIndex + 1} of {currentPlaylist.items.length}
                </div>
                {currentPlaylist.items.length > 0 && (
                  <div className="text-sm">
                    <strong>Current:</strong> {currentPlaylist.items[currentItemIndex]?.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Device Capabilities */}
        {deviceInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Device Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {deviceInfo.capabilities.map((capability) => (
                  <Badge key={capability} variant="secondary">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
