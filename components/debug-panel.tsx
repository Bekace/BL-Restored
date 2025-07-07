"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Bug, Trash2, Download } from "lucide-react"
import { debugLogger } from "@/lib/debug"

export function DebugPanel() {
  const [logs, setLogs] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLogs(debugLogger.getLogs())
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isOpen])

  const clearLogs = () => {
    debugLogger.clearLogs()
    setLogs([])
  }

  const exportLogs = () => {
    const logData = logs
      .map((log) => `${log.timestamp} [${log.type}] ${log.message} ${log.data ? JSON.stringify(log.data) : ""}`)
      .join("\n")

    const blob = new Blob([logData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "USER_ACTION":
        return "bg-blue-100 text-blue-800"
      case "API_CALL":
        return "bg-green-100 text-green-800"
      case "API_RESPONSE":
        return "bg-purple-100 text-purple-800"
      case "STATE_CHANGE":
        return "bg-orange-100 text-orange-800"
      case "REFRESH":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 bg-red-500 text-white hover:bg-red-600"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({logs.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Debug Panel
            <div className="flex space-x-2">
              <Button onClick={exportLogs} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={clearLogs} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No debug logs yet</p>
            ) : (
              logs
                .slice()
                .reverse()
                .map((log, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getTypeColor(log.type)}>{log.type}</Badge>
                          <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.data && (
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
