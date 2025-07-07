"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Monitor, Clock, Palette, Zap, Calendar } from "lucide-react"

interface PlaylistOptions {
  scale_image: string
  scale_video: string
  scale_document: string
  shuffle: boolean
  default_transition: string
  transition_speed: string
  auto_advance: boolean
  loop_playlist: boolean
  background_color: string
  text_overlay: boolean
}

interface PlaylistOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: PlaylistOptions
  onSave: (options: PlaylistOptions) => void
}

export function PlaylistOptionsDialog({ open, onOpenChange, options, onSave }: PlaylistOptionsDialogProps) {
  const [localOptions, setLocalOptions] = useState<PlaylistOptions>(options)

  const handleSave = () => {
    onSave(localOptions)
  }

  const updateOption = (key: keyof PlaylistOptions, value: any) => {
    setLocalOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>Playlist Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="display" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>Display</span>
            </TabsTrigger>
            <TabsTrigger value="playback" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Playback</span>
            </TabsTrigger>
            <TabsTrigger value="transitions" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Transitions</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
          </TabsList>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4" />
                  <span>Media Scaling</span>
                </CardTitle>
                <CardDescription>Configure how different media types are displayed on screen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scale-image">Image Scaling</Label>
                    <Select
                      value={localOptions.scale_image}
                      onValueChange={(value) => updateOption("scale_image", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit (maintain aspect ratio)</SelectItem>
                        <SelectItem value="fill">Fill (crop to fit screen)</SelectItem>
                        <SelectItem value="stretch">Stretch (distort to fit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scale-video">Video Scaling</Label>
                    <Select
                      value={localOptions.scale_video}
                      onValueChange={(value) => updateOption("scale_video", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit (maintain aspect ratio)</SelectItem>
                        <SelectItem value="fill">Fill (crop to fit screen)</SelectItem>
                        <SelectItem value="stretch">Stretch (distort to fit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scale-document">Document Scaling</Label>
                    <Select
                      value={localOptions.scale_document}
                      onValueChange={(value) => updateOption("scale_document", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit (maintain aspect ratio)</SelectItem>
                        <SelectItem value="fill">Fill (crop to fit screen)</SelectItem>
                        <SelectItem value="stretch">Stretch (distort to fit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Appearance</span>
                </CardTitle>
                <CardDescription>Customize the visual appearance of your playlist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="background-color">Background Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="background-color"
                        type="color"
                        value={localOptions.background_color}
                        onChange={(e) => updateOption("background_color", e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        type="text"
                        value={localOptions.background_color}
                        onChange={(e) => updateOption("background_color", e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-overlay">Text Overlay</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="text-overlay"
                        checked={localOptions.text_overlay}
                        onCheckedChange={(checked) => updateOption("text_overlay", checked)}
                      />
                      <span className="text-sm text-gray-600">Show file names on screen</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playback Settings */}
          <TabsContent value="playback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Playback Control</span>
                </CardTitle>
                <CardDescription>Configure how your playlist plays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Auto Advance</Label>
                        <p className="text-sm text-gray-600">Automatically move to next item</p>
                      </div>
                      <Switch
                        checked={localOptions.auto_advance}
                        onCheckedChange={(checked) => updateOption("auto_advance", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Loop Playlist</Label>
                        <p className="text-sm text-gray-600">Restart from beginning when finished</p>
                      </div>
                      <Switch
                        checked={localOptions.loop_playlist}
                        onCheckedChange={(checked) => updateOption("loop_playlist", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Shuffle</Label>
                        <p className="text-sm text-gray-600">Play items in random order</p>
                      </div>
                      <Switch
                        checked={localOptions.shuffle}
                        onCheckedChange={(checked) => updateOption("shuffle", checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Playback Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Auto Advance:</span>
                          <Badge variant={localOptions.auto_advance ? "default" : "secondary"}>
                            {localOptions.auto_advance ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Loop:</span>
                          <Badge variant={localOptions.loop_playlist ? "default" : "secondary"}>
                            {localOptions.loop_playlist ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Shuffle:</span>
                          <Badge variant={localOptions.shuffle ? "default" : "secondary"}>
                            {localOptions.shuffle ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transition Settings */}
          <TabsContent value="transitions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Transition Effects</span>
                </CardTitle>
                <CardDescription>Configure how items transition between each other</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-transition">Default Transition</Label>
                    <Select
                      value={localOptions.default_transition}
                      onValueChange={(value) => updateOption("default_transition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="flip">Flip</SelectItem>
                        <SelectItem value="none">None (instant)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transition-speed">Transition Speed</Label>
                    <Select
                      value={localOptions.transition_speed}
                      onValueChange={(value) => updateOption("transition_speed", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow (2 seconds)</SelectItem>
                        <SelectItem value="normal">Normal (1 second)</SelectItem>
                        <SelectItem value="fast">Fast (0.5 seconds)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-900">Transition Preview</h4>
                  <p className="text-sm text-blue-700">
                    Items will transition using <strong>{localOptions.default_transition}</strong> effect at{" "}
                    <strong>{localOptions.transition_speed}</strong> speed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Settings */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Settings</span>
                </CardTitle>
                <CardDescription>Configure when this playlist should play (coming soon)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduling Coming Soon</h3>
                  <p className="text-gray-500">
                    Advanced scheduling features will be available in a future update. For now, playlists play
                    continuously when activated.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
