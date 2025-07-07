"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, ExternalLink, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GoogleSlidesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSlidesAdded: () => void
}

export function GoogleSlidesDialog({ open, onOpenChange, onSlidesAdded }: GoogleSlidesDialogProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError("Please enter a Google Slides URL")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/media/google-slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim() || "Google Slides Presentation",
          duration: duration,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onSlidesAdded()
        onOpenChange(false)
        resetForm()
      } else {
        setError(data.error || "Failed to add Google Slides presentation")
      }
    } catch (err) {
      setError("Failed to add Google Slides presentation")
      console.error("Error adding Google Slides:", err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setUrl("")
    setTitle("")
    setDuration(30)
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Add Google Slides Presentation
          </DialogTitle>
          <DialogDescription>
            Add a Google Slides presentation to your media library for display on screens.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slides-url">Google Slides URL *</Label>
            <Input
              id="slides-url"
              type="url"
              placeholder="https://docs.google.com/presentation/d/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slides-title">Presentation Title</Label>
            <Input
              id="slides-title"
              type="text"
              placeholder="My Presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slides-duration">Display Duration (seconds)</Label>
            <Input
              id="slides-duration"
              type="number"
              min="10"
              max="3600"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">How long each slide should be displayed (10-3600 seconds)</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>How to get your Google Slides URL:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Open your Google Slides presentation</li>
                <li>Click "Share" → "Get link" → "Anyone with the link can view"</li>
                <li>Copy the link and paste it above</li>
                <li>Make sure the presentation is publicly viewable</li>
              </ol>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Presentation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
