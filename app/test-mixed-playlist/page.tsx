"use client"

import { useState } from "react"
import {
  Play,
  Upload,
  Plus,
  ImageIcon,
  Video,
  Music,
  ExternalLink,
  CheckCircle,
  ArrowRight,
  Monitor,
  Smartphone,
  Tv,
  Clock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestMixedPlaylistPage() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step])
    }
  }

  const mediaTypes = [
    {
      type: "Images",
      icon: <ImageIcon className="h-5 w-5" />,
      formats: ["JPG", "JPEG", "PNG", "GIF", "WebP", "SVG"],
      color: "bg-orange-100 text-orange-800",
      examples: ["Company logo", "Product photos", "Infographics", "Slides"],
      duration: "5-15 seconds",
      tips: "Use high-resolution images (1920x1080 recommended)",
    },
    {
      type: "Videos",
      icon: <Video className="h-5 w-5" />,
      formats: ["MP4", "WebM", "OGG", "AVI", "MOV"],
      color: "bg-blue-100 text-blue-800",
      examples: ["Product demos", "Testimonials", "Commercials", "Training videos"],
      duration: "Natural duration",
      tips: "Keep file size under 4MB for best performance",
    },
    {
      type: "Audio",
      icon: <Music className="h-5 w-5" />,
      formats: ["MP3", "WAV", "OGG", "M4A"],
      color: "bg-purple-100 text-purple-800",
      examples: ["Background music", "Announcements", "Podcasts", "Sound effects"],
      duration: "Natural duration",
      tips: "Audio plays with visual progress indicator",
    },
    {
      type: "Google Slides",
      icon: <ExternalLink className="h-5 w-5" />,
      formats: ["Presentation URL"],
      color: "bg-green-100 text-green-800",
      examples: ["Sales presentations", "Company updates", "Training materials"],
      duration: "10 seconds per slide",
      tips: "Auto-advances through slides automatically",
    },
  ]

  const testingSteps = [
    {
      id: 1,
      title: "Upload Mixed Media",
      description: "Upload different types of media files to test with",
      action: "Go to Media Library",
      link: "/dashboard/media",
      details: [
        "Upload at least one image (JPG/PNG)",
        "Upload at least one video (MP4)",
        "Optionally add audio files (MP3)",
        "Try adding Google Slides presentation",
      ],
    },
    {
      id: 2,
      title: "Create Mixed Playlist",
      description: "Build a playlist with different media types",
      action: "Create Playlist",
      link: "/dashboard/playlists",
      details: [
        "Use the enhanced playlist creator",
        "Select media from different categories",
        "Mix images, videos, and audio",
        "Set appropriate durations for each item",
      ],
    },
    {
      id: 3,
      title: "Test on Device Player",
      description: "View your mixed playlist on a real device",
      action: "Open Device Player",
      link: "/device-player",
      details: [
        "Open on tablet, TV browser, or phone",
        "Connect using pairing code",
        "Assign your mixed playlist",
        "Watch seamless transitions between media types",
      ],
    },
    {
      id: 4,
      title: "Test Playback Controls",
      description: "Verify all controls work with different media",
      action: "Control from Dashboard",
      link: "/dashboard/screens",
      details: [
        "Test play/pause with videos",
        "Test mute with audio content",
        "Try skip forward/backward",
        "Test restart playlist functionality",
      ],
    },
  ]

  const samplePlaylistIdeas = [
    {
      name: "Corporate Welcome Display",
      items: [
        { type: "Image", content: "Company logo", duration: "5s" },
        { type: "Video", content: "Welcome message", duration: "30s" },
        { type: "Image", content: "Office photos", duration: "8s" },
        { type: "Slides", content: "Company values", duration: "40s" },
        { type: "Audio", content: "Background music", duration: "60s" },
      ],
    },
    {
      name: "Product Showcase",
      items: [
        { type: "Image", content: "Product hero shot", duration: "6s" },
        { type: "Video", content: "Product demo", duration: "45s" },
        { type: "Image", content: "Feature highlights", duration: "10s" },
        { type: "Image", content: "Customer testimonial", duration: "8s" },
        { type: "Video", content: "Call to action", duration: "15s" },
      ],
    },
    {
      name: "Restaurant Menu Board",
      items: [
        { type: "Image", content: "Daily specials", duration: "12s" },
        { type: "Video", content: "Chef's recommendation", duration: "20s" },
        { type: "Image", content: "Menu categories", duration: "15s" },
        { type: "Audio", content: "Ambient music", duration: "120s" },
        { type: "Image", content: "Promotions", duration: "10s" },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Mixed Media Playlist Testing</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Test your digital signage platform with different media types. Create playlists that combine images, videos,
            audio, and presentations for engaging displays.
          </p>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Testing Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {testingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      completedSteps.includes(step.id) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {completedSteps.includes(step.id) ? <CheckCircle className="h-4 w-4" /> : step.id}
                  </div>
                  {index < testingSteps.length - 1 && <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {completedSteps.length} of {testingSteps.length} steps completed
            </div>
          </CardContent>
        </Card>

        {/* Media Types Reference */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Supported Media Types</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediaTypes.map((media) => (
              <Card key={media.type}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {media.icon}
                    {media.type}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Badge className={`${media.color} mb-2`}>{media.duration}</Badge>
                    <div className="text-sm text-gray-600">
                      <strong>Formats:</strong> {media.formats.join(", ")}
                    </div>
                  </div>

                  <div className="text-sm">
                    <strong>Examples:</strong>
                    <ul className="list-disc list-inside text-gray-600 mt-1">
                      {media.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>

                  <Alert>
                    <AlertDescription className="text-xs">💡 {media.tips}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testing Steps */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Testing Steps</h2>
          <div className="grid gap-4">
            {testingSteps.map((step) => (
              <Card
                key={step.id}
                className={`${completedSteps.includes(step.id) ? "border-green-200 bg-green-50" : ""}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          completedSteps.includes(step.id) ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                        }`}
                      >
                        {completedSteps.includes(step.id) ? <CheckCircle className="h-4 w-4" /> : step.id}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(step.link, "_blank")}>
                        {step.action}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markStepComplete(step.id)}
                        disabled={completedSteps.includes(step.id)}
                      >
                        {completedSteps.includes(step.id) ? "Completed" : "Mark Done"}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {step.details.map((detail, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sample Playlist Ideas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Sample Mixed Playlist Ideas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {samplePlaylistIdeas.map((playlist, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {playlist.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {playlist.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <span className="text-sm">{item.content}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {item.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Device Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Testing Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <Tv className="h-8 w-8 mx-auto text-blue-500" />
                <h3 className="font-semibold">Smart TV / Large Display</h3>
                <p className="text-sm text-gray-600">Best for testing fullscreen experience and video quality</p>
              </div>
              <div className="text-center space-y-2">
                <Monitor className="h-8 w-8 mx-auto text-green-500" />
                <h3 className="font-semibold">Tablet / iPad</h3>
                <p className="text-sm text-gray-600">Perfect for kiosk-style displays and touch interaction testing</p>
              </div>
              <div className="text-center space-y-2">
                <Smartphone className="h-8 w-8 mx-auto text-purple-500" />
                <h3 className="font-semibold">Mobile Phone</h3>
                <p className="text-sm text-gray-600">Quick testing and development preview</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => window.open("/dashboard/media", "_blank")}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
              <Button onClick={() => window.open("/dashboard/playlists", "_blank")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Playlist
              </Button>
              <Button onClick={() => window.open("/device-player", "_blank")}>
                <Play className="h-4 w-4 mr-2" />
                Open Device Player
              </Button>
              <Button onClick={() => window.open("/dashboard/screens", "_blank")}>
                <Monitor className="h-4 w-4 mr-2" />
                Manage Screens
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
