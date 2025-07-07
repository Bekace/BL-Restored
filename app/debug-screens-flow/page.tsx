"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface DebugData {
  currentUser: any
  allDevices: any[]
  userDevices: any[]
  pairingCodes: any[]
  users: any[]
  dashboardQuery: any[]
  summary: {
    totalDevices: number
    devicesWithUsers: number
    userDeviceCount: number
    completedPairings: number
  }
}

export default function DebugScreensFlow() {
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/debug-screens-flow", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setDebugData(data.debug)
      } else {
        setError(data.error || "Failed to fetch debug data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testDevicesAPI = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/devices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      console.log("🧪 [TEST] Devices API response:", data)

      if (data.success) {
        alert(`Devices API Success: Found ${data.devices.length} devices`)
      } else {
        alert(`Devices API Error: ${data.error}`)
      }
    } catch (err) {
      console.error("🧪 [TEST] Devices API error:", err)
      alert(`Devices API Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading debug data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Screens Flow Debug</h1>
          <p className="text-muted-foreground">Comprehensive debugging for the screens dashboard issue</p>
        </div>
        <div className="space-x-2">
          <Button onClick={fetchDebugData} variant="outline">
            Refresh Debug Data
          </Button>
          <Button onClick={testDevicesAPI}>Test Devices API</Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {debugData && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{debugData.summary.totalDevices}</div>
                  <div className="text-sm text-muted-foreground">Total Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{debugData.summary.devicesWithUsers}</div>
                  <div className="text-sm text-muted-foreground">Devices with Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{debugData.summary.userDeviceCount}</div>
                  <div className="text-sm text-muted-foreground">Your Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{debugData.summary.completedPairings}</div>
                  <div className="text-sm text-muted-foreground">Completed Pairings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current User */}
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.currentUser ? (
                <div className="space-y-2">
                  <p>
                    <strong>ID:</strong> {debugData.currentUser.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {debugData.currentUser.email}
                  </p>
                  <p>
                    <strong>Name:</strong> {debugData.currentUser.first_name} {debugData.currentUser.last_name}
                  </p>
                  <Badge variant="outline">Authenticated</Badge>
                </div>
              ) : (
                <div>
                  <Badge variant="destructive">Not Authenticated</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">This is likely the main issue!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Devices */}
          <Card>
            <CardHeader>
              <CardTitle>All Devices in Database</CardTitle>
              <CardDescription>Shows all devices regardless of user</CardDescription>
            </CardHeader>
            <CardContent>
              {debugData.allDevices.length === 0 ? (
                <p>No devices found in database</p>
              ) : (
                <div className="space-y-2">
                  {debugData.allDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <strong>ID {device.id}:</strong> {device.name} ({device.device_type})
                      </div>
                      <div className="space-x-2">
                        <Badge variant={device.user_id ? "default" : "destructive"}>
                          {device.user_id ? `User ${device.user_id}` : "No User"}
                        </Badge>
                        <Badge variant="outline">{device.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Devices */}
          <Card>
            <CardHeader>
              <CardTitle>Your Devices</CardTitle>
              <CardDescription>Devices that should appear in the screens dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              {debugData.userDevices.length === 0 ? (
                <div>
                  <Badge variant="destructive">No devices found for your user</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This explains why the screens dashboard is empty!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {debugData.userDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <strong>ID {device.id}:</strong> {device.name} ({device.device_type})
                      </div>
                      <Badge variant="default">{device.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dashboard Query Result */}
          {debugData.dashboardQuery && (
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Query Result</CardTitle>
                <CardDescription>Exact same query used by the screens dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                {debugData.dashboardQuery.length === 0 ? (
                  <Badge variant="destructive">Query returned no results</Badge>
                ) : (
                  <div className="space-y-2">
                    {debugData.dashboardQuery.map((device) => (
                      <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <strong>ID {device.id}:</strong> {device.name} ({device.device_type})
                        </div>
                        <Badge variant="default">{device.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pairing Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Pairing Codes</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.pairingCodes.length === 0 ? (
                <p>No pairing codes found</p>
              ) : (
                <div className="space-y-2">
                  {debugData.pairingCodes.map((code) => (
                    <div key={code.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <strong>{code.code}</strong> - {code.screen_name} (Device {code.device_id})
                      </div>
                      <div className="space-x-2">
                        <Badge variant={code.completed_at ? "default" : "outline"}>
                          {code.completed_at ? "Completed" : "Pending"}
                        </Badge>
                        <Badge variant="secondary">User {code.user_id}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
