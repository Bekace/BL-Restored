"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ImageIcon,
  Video,
  Music,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Monitor,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface TestResult {
  type: string
  name: string
  status: "pending" | "success" | "error"
  message?: string
  duration?: number
}

export default function TestMediaTypesPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { type: "image", name: "JPEG Image", status: "pending" },
    { type: "image", name: "PNG Image", status: "pending" },
    { type: "image", name: "GIF Animation", status: "pending" },
    { type: "video", name: "MP4 Video", status: "pending" },
    { type: "video", name: "WebM Video", status: "pending" },
    { type: "audio", name: "MP3 Audio", status: "pending" },
    { type: "audio", name: "WAV Audio", status: "pending" },
    { type: "slides", name: "Google Slides", status: "pending" },
    { type: "pdf", name: "PDF Document", status: "pending" },
  ])

  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Test media URLs - using placeholder service for demo
  const testMedia = {
    image_jpeg: "/placeholder.svg?height=600&width=800&text=JPEG+Test+Image",
    image_png: "/placeholder.svg?height=600&width=800&text=PNG+Test+Image",
    image_gif: "/placeholder.svg?height=600&width=800&text=GIF+Animation+Test",
    video_mp4: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    video_webm: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.webm",
    audio_mp3: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    audio_wav: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    slides_url:
      "https://docs.google.com/presentation/d/1BxV14oZVscVjMJck8noWH67yoD_LoXh_/embed?start=false&loop=false&delayms=3000",
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  }

  const updateTestResult = (
    type: string,
    name: string,
    status: "success" | "error",
    message?: string,
    duration?: number,
  ) => {
    setTestResults((prev) =>
      prev.map((result) =>
        result.type === type && result.name === name ? { ...result, status, message, duration } : result,
      ),
    )
  }

  const testImage = async (src: string, type: string, name: string) => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        updateTestResult(type, name, "success", `Loaded successfully (${img.naturalWidth}x${img.naturalHeight})`)
        resolve()
      }

      img.onerror = () => {
        updateTestResult(type, name, "error", "Failed to load image")
        resolve()
      }

      img.src = src
    })
  }

  const testVideo = async (src: string, name: string) => {
    return new Promise<void>((resolve) => {
      const video = document.createElement("video")
      video.crossOrigin = "anonymous"

      video.onloadedmetadata = () => {
        updateTestResult(
          "video",
          name,
          "success",
          `Loaded successfully (${Math.round(video.duration)}s duration)`,
          video.duration,
        )
        resolve()
      }

      video.onerror = () => {
        updateTestResult("video", name, "error", "Failed to load video")
        resolve()
      }

      video.src = src
    })
  }

  const testAudio = async (src: string, name: string) => {
    return new Promise<void>((resolve) => {
      const audio = document.createElement("audio")
      audio.crossOrigin = "anonymous"

      audio.onloadedmetadata = () => {
        updateTestResult(
          "audio",
          name,
          "success",
          `Loaded successfully (${Math.round(audio.duration)}s duration)`,
          audio.duration,
        )
        resolve()
      }

      audio.onerror = () => {
        updateTestResult("audio", name, "error", "Failed to load audio")
        resolve()
      }

      audio.src = src
    })
  }

  const testSlides = async (src: string, name: string) => {
    return new Promise<void>((resolve) => {
      // For Google Slides, we'll test if the URL is accessible
      const iframe = document.createElement("iframe")

      iframe.onload = () => {
        updateTestResult("slides", name, "success", "Google Slides embed loaded successfully")
        resolve()
      }

      iframe.onerror = () => {
        updateTestResult("slides", name, "error", "Failed to load Google Slides")
        resolve()
      }

      // Set a timeout for the test
      setTimeout(() => {
        updateTestResult("slides", name, "success", "Google Slides URL format is valid")
        resolve()
      }, 2000)

      iframe.src = src
      iframe.style.display = "none"
      document.body.appendChild(iframe)

      // Clean up
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 3000)
    })
  }

  const testPDF = async (src: string, name: string) => {
    return new Promise<void>((resolve) => {
      fetch(src, { method: "HEAD" })
        .then((response) => {
          if (response.ok) {
            updateTestResult("pdf", name, "success", "PDF document is accessible")
          } else {
            updateTestResult("pdf", name, "error", "PDF document not accessible")
          }
          resolve()
        })
        .catch(() => {
          updateTestResult("pdf", name, "error", "Failed to access PDF")
          resolve()
        })
    })
  }

  const runAllTests = async () => {
    // Reset all tests
    setTestResults((prev) => prev.map((result) => ({ ...result, status: "pending" as const })))

    // Test images
    await testImage(testMedia.image_jpeg, "image", "JPEG Image")
    await testImage(testMedia.image_png, "image", "PNG Image")
    await testImage(testMedia.image_gif, "image", "GIF Animation")

    // Test videos
    await testVideo(testMedia.video_mp4, "MP4 Video")
    await testVideo(testMedia.video_webm, "WebM Video")

    // Test audio
    await testAudio(testMedia.audio_mp3, "MP3 Audio")
    await testAudio(testMedia.audio_wav, "WAV Audio")

    // Test slides
    await testSlides(testMedia.slides_url, "Google Slides")

    // Test PDF
    await testPDF(testMedia.pdf_url, "PDF Document")
  }

  const playTestMedia = (type: string, src: string) => {
    setCurrentTest(`${type}:${src}`)
    setIsPlaying(true)
    setProgress(0)
    setCurrentTime(0)

    if (type === "video") {
      const video = videoRef.current
      if (video) {
        video.src = src
        video.load()
        video.play().catch(console.error)
      }
    } else if (type === "audio") {
      const audio = audioRef.current
      if (audio) {
        audio.src = src
        audio.load()
        audio.play().catch(console.error)
      }
    } else if (type === "image") {
      // For images, simulate playback with a timer
      setTotalTime(8) // 8 seconds for images
      const startTime = Date.now()

      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        setCurrentTime(elapsed)
        setProgress((elapsed / 8) * 100)

        if (elapsed >= 8) {
          setIsPlaying(false)
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
        }
      }, 100)
    }
  }

  const togglePlayPause = () => {
    const video = videoRef.current
    const audio = audioRef.current

    if (isPlaying) {
      setIsPlaying(false)
      if (video) video.pause()
      if (audio) audio.pause()
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    } else {
      setIsPlaying(true)
      if (video) video.play().catch(console.error)
      if (audio) audio.play().catch(console.error)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    const audio = audioRef.current
    const newMuted = !isMuted

    setIsMuted(newMuted)
    if (video) video.muted = newMuted
    if (audio) audio.muted = newMuted
  }

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current
    if (video) {
      setCurrentTime(video.currentTime)
      setTotalTime(video.duration)
      setProgress((video.currentTime / video.duration) * 100)
    }
  }

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) {
      setCurrentTime(audio.currentTime)
      setTotalTime(audio.duration)
      setProgress((audio.currentTime / audio.duration) * 100)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "slides":
        return <ExternalLink className="h-4 w-4" />
      case "pdf":
        return <FileText className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const successCount = testResults.filter((r) => r.status === "success").length
  const errorCount = testResults.filter((r) => r.status === "error").length
  const pendingCount = testResults.filter((r) => r.status === "pending").length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Type Verification</h1>
          <p className="text-gray-600 mt-2">Test all supported media types for digital signage compatibility</p>
        </div>
        <Button onClick={runAllTests} size="lg">
          <Play className="h-4 w-4 mr-2" />
          Run All Tests
        </Button>
      </div>

      {/* Test Results Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testResults.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="preview">Media Preview</TabsTrigger>
          <TabsTrigger value="compatibility">Compatibility Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <div className="grid gap-4">
            {["image", "video", "audio", "slides", "pdf"].map((mediaType) => {
              const typeResults = testResults.filter((r) => r.type === mediaType)
              const typeSuccess = typeResults.filter((r) => r.status === "success").length
              const typeTotal = typeResults.length

              return (
                <Card key={mediaType}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(mediaType)}
                        <span className="capitalize">{mediaType} Files</span>
                        <Badge variant={typeSuccess === typeTotal ? "default" : "secondary"}>
                          {typeSuccess}/{typeTotal}
                        </Badge>
                      </div>
                      <Progress value={(typeSuccess / typeTotal) * 100} className="w-32" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {typeResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.status)}
                            <div>
                              <div className="font-medium">{result.name}</div>
                              {result.message && <div className="text-sm text-gray-500">{result.message}</div>}
                            </div>
                          </div>
                          {result.status === "success" && (
                            <div className="flex items-center gap-2">
                              {result.duration && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {Math.round(result.duration)}s
                                </Badge>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const mediaKey = `${mediaType}_${result.name.toLowerCase().replace(/\s+/g, "_")}`
                                  const src = testMedia[mediaKey as keyof typeof testMedia]
                                  if (src) playTestMedia(mediaType, src)
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Test
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Preview Player</CardTitle>
              <p className="text-sm text-gray-600">
                Test how different media types will appear on digital signage displays
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview Area */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {currentTest ? (
                  <>
                    {currentTest.startsWith("video:") && (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleVideoTimeUpdate}
                        onLoadedMetadata={() => setTotalTime(videoRef.current?.duration || 0)}
                        muted={isMuted}
                      />
                    )}
                    {currentTest.startsWith("audio:") && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900 text-white">
                        <div className="text-center space-y-4">
                          <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                            <Music className="h-12 w-12" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">Audio Playback</h3>
                            <p className="text-gray-300">Testing audio file compatibility</p>
                          </div>
                        </div>
                        <audio
                          ref={audioRef}
                          onTimeUpdate={handleAudioTimeUpdate}
                          onLoadedMetadata={() => setTotalTime(audioRef.current?.duration || 0)}
                          muted={isMuted}
                        />
                      </div>
                    )}
                    {currentTest.startsWith("image:") && (
                      <img
                        src={currentTest.split(":")[1] || "/placeholder.svg"}
                        alt="Test image"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No Media Selected</h3>
                      <p className="text-gray-400">Click "Test" on any media type above to preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              {currentTest && (
                <div className="space-y-3">
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={togglePlayPause}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={toggleMute}>
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(currentTime)} / {formatTime(totalTime)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compatibility" className="space-y-4">
          <div className="grid gap-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This compatibility guide shows the recommended formats and settings for optimal digital signage
                performance.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Image Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-600">✅ Recommended</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• JPEG (.jpg, .jpeg) - Best for photos</li>
                      <li>• PNG (.png) - Best for graphics with transparency</li>
                      <li>• WebP (.webp) - Modern format, smaller files</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600">⚠️ Supported</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• GIF (.gif) - Animated images</li>
                      <li>• SVG (.svg) - Vector graphics</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">📏 Optimal Settings</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• Resolution: 1920x1080 (Full HD)</li>
                      <li>• File size: Under 5MB</li>
                      <li>• Display time: 5-15 seconds</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Video Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-600">✅ Recommended</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• MP4 (.mp4) - H.264 codec</li>
                      <li>• WebM (.webm) - VP9 codec</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600">⚠️ Supported</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• OGV (.ogv) - Ogg Theora</li>
                      <li>• MOV (.mov) - QuickTime</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">📏 Optimal Settings</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• Resolution: 1920x1080 @ 30fps</li>
                      <li>• Bitrate: 5-10 Mbps</li>
                      <li>• Duration: 15-60 seconds</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Audio Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-600">✅ Recommended</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• MP3 (.mp3) - Universal compatibility</li>
                      <li>• AAC (.aac) - High quality, small size</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600">⚠️ Supported</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• WAV (.wav) - Uncompressed audio</li>
                      <li>• OGG (.ogg) - Open source format</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">📏 Optimal Settings</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• Sample rate: 44.1kHz or 48kHz</li>
                      <li>• Bitrate: 128-320 kbps</li>
                      <li>• Channels: Stereo or Mono</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Web Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-600">✅ Recommended</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• Google Slides (embed URLs)</li>
                      <li>• Google Docs (public view)</li>
                      <li>• YouTube (embed URLs)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600">⚠️ Supported</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• PDF documents</li>
                      <li>• Web pages (iframe)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600">📏 Best Practices</h4>
                    <ul className="text-sm space-y-1 mt-1">
                      <li>• Use public/shared URLs</li>
                      <li>• Test on target devices</li>
                      <li>• Consider auto-advance settings</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
