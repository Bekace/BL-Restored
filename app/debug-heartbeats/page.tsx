"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RefreshCw, Activity, Monitor, AlertTriangle } from "lucide-react"

interface HeartbeatData {
  statistics: {
    total_heartbeats: number
    unique_devices: number
    online_devices: number
    offline_devices: number
    last_heartbeat: string | null
  }
  recentActivity: Array<{
    device_id: number
    device_name: string
    device_type: string
    status: string
    performance_metrics: string
    updated_at: string
  }>
  devicesWithoutHeartbeats: Array<{
    id: number
    name: string
    device_type: string
    status: string
    created_at: string
  }>
  activityTimeline: Array<{
    hour: string
    heartbeat_count: number
    unique_devices: number
  }>
}

export default function DebugHeartbeatsPage() {
  const [data, setData] = useState<HeartbeatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug-heartbeats")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.message || "Failed to fetch data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const variant = status === "online" ? "default" : "secondary"
    return <Badge variant={variant}>{status}</Badge>
  }

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading heartbeat data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Heartbeat Monitor</h1>
          <p className="text-muted-foreground">Monitor device connectivity and heartbeat activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto-refresh">Auto-refresh</Label>
          </div>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Heartbeats</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.statistics.total_heartbeats}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Devices</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.statistics.unique_devices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.statistics.online_devices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
                <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{data.statistics.offline_devices}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Heartbeat Activity</CardTitle>
              <CardDescription>Latest 20 heartbeat records</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <p className="text-muted-foreground">No heartbeat activity recorded</p>
              ) : (
                <div className="space-y-4">
                  {data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{activity.device_name || `Device ${activity.device_id}`}</p>
                          <p className="text-sm text-muted-foreground">{activity.device_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(activity.status)}
                        <span className="text-sm text-muted-foreground">{formatDate(activity.updated_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Devices Without Heartbeats */}
          {data.devicesWithoutHeartbeats.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Devices Without Heartbeats</span>
                </CardTitle>
                <CardDescription>These devices have never sent a heartbeat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.devicesWithoutHeartbeats.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">{device.device_type}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(device.status)}
                        <span className="text-sm text-muted-foreground">Created: {formatDate(device.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Activity Timeline</CardTitle>
              <CardDescription>Heartbeat activity grouped by hour</CardDescription>
            </CardHeader>
            <CardContent>
              {data.activityTimeline.length === 0 ? (
                <p className="text-muted-foreground">No activity in the last 24 hours</p>
              ) : (
                <div className="space-y-2">
                  {data.activityTimeline.map((timeline, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{formatDate(timeline.hour)}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">
                          {timeline.heartbeat_count} heartbeats from {timeline.unique_devices} devices
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
