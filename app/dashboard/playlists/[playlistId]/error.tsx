"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function PlaylistEditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("🚨 [PLAYLIST EDITOR ERROR]", error)
  }, [error])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Playlist Editor Error</h1>
            <p className="text-gray-600">Something went wrong loading the playlist editor</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Error</h3>
            <p className="text-gray-600 text-center mb-4">
              A client-side exception has occurred. Please check the browser console for more details.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-2xl">
              <p className="text-sm text-red-800 font-mono">{error.message}</p>
              {error.digest && <p className="text-xs text-red-600 mt-2">Error ID: {error.digest}</p>}
            </div>
            <div className="flex space-x-2">
              <Button onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/dashboard/playlists")}>
                Back to Playlists
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
