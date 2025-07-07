"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Save, X } from "lucide-react"

interface PlaylistItemDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDuration: number
  currentTransition: string
  mediaName: string
  onSave: (duration: number, transition: string) => void
}

export function PlaylistItemDurationDialog({
  open,
  onOpenChange,
  currentDuration,
  currentTransition,
  mediaName,
  onSave,
}: PlaylistItemDurationDialogProps) {
  const [duration, setDuration] = useState(currentDuration)
  const [transition, setTransition] = useState(currentTransition)

  const handleSave = () => {
    onSave(duration, transition)
    onOpenChange(false)
  }

  const transitionOptions = [
    { value: "fade", label: "Fade" },
    { value: "slide", label: "Slide" },
    { value: "zoom", label: "Zoom" },
    { value: "none", label: "None" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Playback Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium text-gray-700">Media File</Label>
            <p className="text-sm text-gray-600 truncate">{mediaName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="300"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="30"
            />
            <p className="text-xs text-gray-500">How long this item should be displayed (1-300 seconds)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transition">Transition Effect</Label>
            <Select value={transition} onValueChange={setTransition}>
              <SelectTrigger>
                <SelectValue placeholder="Select transition" />
              </SelectTrigger>
              <SelectContent>
                {transitionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Transition effect when moving to the next item</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
