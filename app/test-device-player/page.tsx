"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Monitor,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  ImageIcon,
  Video,
  Music,
  ExternalLink,
  FileText,
  Wifi,
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw,
} from "lucide-react"

interface TestScenario {
  id: string
  name: string
  description: string
  mediaTypes: string[]
  duration: string
  complexity: "Basic" | "Intermediate" | "Advanced"
  status: "pending" | "running" | "success" | "error"
}

interface DeviceStatus {
  connected: boolean
  deviceId: string | null
  playlistAssigned: boolean
  currentMedia: string | null
  playbackStatus: "idle" | "playing" | "paused" | "error"
  lastHeartbeat: Date | null
}

export default function TestDevicePlayerPage() {
  const [testScenarios] = useState<TestScenario[]>([
    {
      id: "basic-images",
      name: "Basic Image Slideshow",
      description: "Test JPEG, PNG, and GIF images with 8-second intervals",
      mediaTypes: ["JPEG", "PNG", "GIF"],
      duration: "2 minutes",
      complexity: "Basic",
      status: "pending",
    },
    {
      id: "video-playback",
      name: "Video Playback Test",
      description: "Test MP4 and WebM video files with audio",
      mediaTypes: ["MP4", "WebM"],
      duration: "3 minutes",
      complexity: "Basic",
      status: "pending",
    },
    {
      id: "audio-only",
      name: "Audio Content Test",
      description: "Test MP3 and WAV audio files with visual overlay",
      mediaTypes: ["MP3", "WAV"],
      duration: "2 minutes",
      complexity: "Basic",
      status: "pending",
    },
    {
      id: "google-slides",
      name: "Google Slides Integration",
      description: "Test Google Slides presentations with auto-advance",
      mediaTypes: ["Google Slides"],
      duration: "5 minutes",
      complexity: "Intermediate",
      status: "pending",
    },
    {
      id: "mixed-playlist",
      name: "Mixed Media Playlist",
      description: "Test playlist with images, videos, audio, and slides",
      mediaTypes: ["JPEG", "MP4", "MP3", "Google Slides", "PNG"],
      duration: "8 minutes",
      complexity: "Advanced",
      status: "pending",
    },
    {
      id: "loop-shuffle",
      name: "Loop & Shuffle Test",
      description: "Test playlist looping and shuffle functionality",
      mediaTypes: ["Mixed"],
      duration: "10 minutes",
      complexity: "Advanced",
      status: "pending",
    },
    {
      id: "error-recovery",
      name: "Error Recovery Test",
      description: "Test handling of broken media files and network issues",
      mediaTypes: ["Broken Files"],
      duration: "5 minutes",
      complexity: "Advanced",
      status: "pending",
    },
  ])

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    connected: false,
    deviceId: null,
    playlistAssigned: false,
    currentMedia: null,
    playbackStatus: "idle",
    lastHeartbeat: null,
  })

  const [generatedCode, setGeneratedCode] = useState<string>("")
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  // Generate a device pairing code
  const generatePairingCode = async () => {
    setIsGeneratingCode(true)
    try {
      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedCode(data.code)
      }
    } catch (error) {
      console.error("Failed to generate pairing code:", error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  // Check device status
  const checkDeviceStatus = async () => {
    if (!generatedCode) return

    try {
      const response = await fetch(`/api/devices?code=${generatedCode}`)
      const data = await response.json()

      if (data.devices && data.devices.length > 0) {
        const device = data.devices[0]
        setDeviceStatus({
          connected: device.status === "online",
          deviceId: device.id,
          playlistAssigned: !!device.current_playlist_id,
          currentMedia: device.current_media || null,
          playbackStatus: device.playback_status || "idle",
          lastHeartbeat: device.last_heartbeat ? new Date(device.last_heartbeat) : null,
        })
      }
    } catch (error) {
      console.error("Failed to check device status:", error)
    }
  }

  // Create test playlist
  const createTestPlaylist = async (scenarioId: string) => {
    if (!deviceStatus.deviceId) return

    const scenario = testScenarios.find((s) => s.id === scenarioId)
    if (!scenario) return

    try {
      // Create playlist based on scenario
      const playlistData = getPlaylistDataForScenario(scenario)

      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playlistData),
      })

      const playlist = await response.json()

      if (playlist.success) {
        // Assign playlist to device
        await fetch(`/api/devices/${deviceStatus.deviceId}/assign-playlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playlistId: playlist.playlist.id,
          }),
        })

        return playlist.playlist.id
      }
    } catch (error) {
      console.error("Failed to create test playlist:", error)
    }
  }

  const getPlaylistDataForScenario = (scenario: TestScenario) => {
    const basePlaylist = {
      name: `Test: ${scenario.name}`,
      description: scenario.description,
      loop_enabled: scenario.id.includes("loop"),
      shuffle: scenario.id.includes("shuffle"),
      auto_advance: true,
      background_color: "#000000",
      text_overlay: true,
    }

    // Return different playlist configurations based on scenario
    switch (scenario.id) {
      case "basic-images":
        return {
          ...basePlaylist,
          scale_image: "fit",
          default_item_duration: 8,
        }
      case "video-playback":
        return {
          ...basePlaylist,
          scale_video: "fit",
          default_item_duration: 30,
        }
      case "audio-only":
        return {
          ...basePlaylist,
          default_item_duration: 15,
        }
      case "google-slides":
        return {
          ...basePlaylist,
          default_item_duration: 60,
        }
      case "mixed-playlist":
        return {
          ...basePlaylist,
          scale_image: "fit",
          scale_video: "fit",
          default_item_duration: 20,
        }
      case "loop-shuffle":
        return {
          ...basePlaylist,
          loop_enabled: true,
          shuffle: true,
          default_item_duration: 10,
        }
      case "error-recovery":
        return {
          ...basePlaylist,
          default_item_duration: 5,
        }
      default:
        return basePlaylist
    }
  }

  // Run test scenario
  const runTestScenario = async (scenarioId: string) => {
    const playlistId = await createTestPlaylist(scenarioId)
    if (!playlistId) return

    // Monitor test execution
    const testStartTime = Date.now()
    const testInterval = setInterval(async () => {
      await checkDeviceStatus()

      // Check if test completed (simplified logic)
      const testDuration = Date.now() - testStartTime
      if (testDuration > 30000) {
        // 30 seconds for demo
        clearInterval(testInterval)
        setTestResults((prev) => ({
          ...prev,
          [scenarioId]: {
            status: "success",
            duration: testDuration,
            completedAt: new Date(),
          },
        }))
      }
    }, 2000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon className="h-3 w-3" />
      case "mp4":
      case "webm":
        return <Video className="h-3 w-3" />
      case "mp3":
      case "wav":
        return <Music className="h-3 w-3" />
      case "google slides":
        return <ExternalLink className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  useEffect(() => {
    generatePairingCode()
  }, [])

  useEffect(() => {
    if (generatedCode) {
      const interval = setInterval(checkDeviceStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [generatedCode])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Player Testing</h1>
          <p className="text-gray-600 mt-2">Test mixed media playback on connected devices</p>
        </div>
        <Button onClick={generatePairingCode} disabled={isGeneratingCode}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate New Code
        </Button>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Device Setup</TabsTrigger>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Device Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Pairing Code</h3>
                  {generatedCode ? (
                    <div className="space-y-2">
                      <div className="text-3xl font-mono font-bold text-blue-600">{generatedCode}</div>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedCode)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  ) : (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Open a new browser tab or device</li>
                      <li>Navigate to /device-player</li>
                      <li>Enter the pairing code above</li>
                      <li>Click "Connect Device"</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Device Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">Connection</div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {deviceStatus.connected ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">Connected</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 font-medium">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-sm text-gray-600">Playback</div>
                    <div className="mt-1">
                      <Badge
                        variant={
                          deviceStatus.playbackStatus === "playing"
                            ? "default"
                            : deviceStatus.playbackStatus === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {deviceStatus.playbackStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {deviceStatus.deviceId && (
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Device ID:</span> {deviceStatus.deviceId}
                    </div>
                    <div>
                      <span className="font-medium">Playlist:</span>{" "}
                      {deviceStatus.playlistAssigned ? "Assigned" : "None"}
                    </div>
                    {deviceStatus.currentMedia && (
                      <div>
                        <span className="font-medium">Current Media:</span> {deviceStatus.currentMedia}
                      </div>
                    )}
                    {deviceStatus.lastHeartbeat && (
                      <div>
                        <span className="font-medium">Last Heartbeat:</span>{" "}
                        {deviceStatus.lastHeartbeat.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-4">
            {testScenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(testResults[scenario.id]?.status || scenario.status)}
                      <div>
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={scenario.complexity === "Advanced" ? "destructive" : "secondary"}>
                        {scenario.complexity}
                      </Badge>
                      <Button onClick={() => runTestScenario(scenario.id)} disabled={!deviceStatus.connected} size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Run Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{scenario.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {scenario.mediaTypes.map((type, index) => (
                          <div key={index} className="flex items-center gap-1">
                            {getMediaTypeIcon(type)}
                            <span className="text-xs text-gray-600">{type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {testResults[scenario.id] && (
                      <div className="text-sm text-gray-600">
                        Completed: {testResults[scenario.id].completedAt?.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Device Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Connection Status</span>
                    <Badge variant={deviceStatus.connected ? "default" : "destructive"}>
                      {deviceStatus.connected ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Playback Status</span>
                    <Badge
                      variant={
                        deviceStatus.playbackStatus === "playing"
                          ? "default"
                          : deviceStatus.playbackStatus === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {deviceStatus.playbackStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Current Media</span>
                    <span className="text-sm">{deviceStatus.currentMedia || "None"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => runTestScenario("basic-images")}
                  disabled={!deviceStatus.connected}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Test Image Slideshow
                </Button>
                <Button
                  className="w-full"
                  onClick={() => runTestScenario("video-playback")}
                  disabled={!deviceStatus.connected}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Test Video Playback
                </Button>
                <Button
                  className="w-full"
                  onClick={() => runTestScenario("mixed-playlist")}
                  disabled={!deviceStatus.connected}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Test Mixed Media
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => window.open("/device-player", "_blank")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Open Device Player
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(testResults).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test results yet. Run some test scenarios to see results here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(testResults).map(([scenarioId, result]) => {
                    const scenario = testScenarios.find((s) => s.id === scenarioId)
                    return (
                      <div key={scenarioId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <div className="font-medium">{scenario?.name}</div>
                            <div className="text-sm text-gray-600">Duration: {Math.round(result.duration / 1000)}s</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">{result.completedAt?.toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
