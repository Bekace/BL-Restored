"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Monitor,
  Smartphone,
  Tv,
  Globe,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Square,
  RotateCcw,
  Power,
  Plus,
} from "lucide-react"

interface SimulatedDevice {
  id: string
  name: string
  type: string
  status: "online" | "offline"
  connected: boolean
  currentPlaylist?: {
    id: number
    name: string
    items: any[]
  }
  playbackStatus: "playing" | "paused" | "stopped" | "idle"
  currentItem?: any
  lastHeartbeat: Date
}

export default function DeviceSimulator() {
  const [devices, setDevices] = useState<SimulatedDevice[]>([])
  const [newDeviceName, setNewDeviceName] = useState("")
  const [newDeviceType, setNewDeviceType] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [connectingDevice, setConnectingDevice] = useState<string | null>(null)

  const deviceTypes = [
    { value: "fire_tv", label: "Fire TV Stick", icon: Tv },
    { value: "android_tv", label: "Android TV", icon: Tv },
    { value: "android", label: "Android Device", icon: Smartphone },
    { value: "web", label: "Web Browser", icon: Globe },
  ]

  // Simulate device heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((device) => ({
          ...device,
          lastHeartbeat: new Date(),
        })),
      )
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const createSimulatedDevice = () => {
    if (!newDeviceName || !newDeviceType) {
      toast.error("Please enter device name and select type")
      return
    }

    const newDevice: SimulatedDevice = {
      id: `sim_${Date.now()}`,
      name: newDeviceName,
      type: newDeviceType,
      status: "offline",
      connected: false,
      playbackStatus: "idle",
      lastHeartbeat: new Date(),
    }

    setDevices((prev) => [...prev, newDevice])
    setNewDeviceName("")
    setNewDeviceType("")
    toast.success(`Simulated ${newDeviceName} created`)
  }

  const connectDevice = async (deviceId: string) => {
    if (!pairingCode) {
      toast.error("Please enter a pairing code")
      return
    }

    setConnectingDevice(deviceId)

    try {
      // Simulate API call to register device
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode: pairingCode, // Changed from pairingCode to deviceCode
          deviceType: devices.find((d) => d.id === deviceId)?.type,
          platform: "simulator",
          deviceInfo: {
            name: devices.find((d) => d.id === deviceId)?.name,
            simulator: true,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setDevices((prev) =>
          prev.map((device) =>
            device.id === deviceId
              ? {
                  ...device,
                  status: "online",
                  connected: true,
                }
              : device,
          ),
        )
        setPairingCode("")
        toast.success("Device connected successfully!")
      } else {
        toast.error(data.message || "Failed to connect device") // Changed from data.error to data.message
      }
    } catch (error) {
      console.error("Connection error:", error)
      toast.error("Failed to connect device")
    } finally {
      setConnectingDevice(null)
    }
  }

  const toggleDeviceStatus = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              status: device.status === "online" ? "offline" : "online",
            }
          : device,
      ),
    )
  }

  const simulatePlaybackControl = (deviceId: string, action: string) => {
    const statusMap: Record<string, "playing" | "paused" | "stopped" | "idle"> = {
      play: "playing",
      pause: "paused",
      stop: "stopped",
      restart: "playing",
    }

    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              playbackStatus: statusMap[action] || "idle",
            }
          : device,
      ),
    )

    toast.success(`Simulated ${action} on ${devices.find((d) => d.id === deviceId)?.name}`)
  }

  const removeDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((device) => device.id !== deviceId))
    toast.success("Simulated device removed")
  }

  const getDeviceIcon = (type: string) => {
    const deviceType = deviceTypes.find((dt) => dt.value === type)
    return deviceType ? deviceType.icon : Monitor
  }

  const getStatusBadge = (status: string) => {
    return status === "online" ? (
      <Badge className="bg-green-500">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    ) : (
      <Badge variant="secondary">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    )
  }

  const getPlaybackBadge = (status: string) => {
    const badges = {
      playing: (
        <Badge className="bg-blue-500">
          <Play className="h-3 w-3 mr-1" />
          Playing
        </Badge>
      ),
      paused: (
        <Badge variant="secondary">
          <Pause className="h-3 w-3 mr-1" />
          Paused
        </Badge>
      ),
      stopped: (
        <Badge variant="outline">
          <Square className="h-3 w-3 mr-1" />
          Stopped
        </Badge>
      ),
      idle: <Badge variant="outline">Idle</Badge>,
    }
    return badges[status as keyof typeof badges] || badges.idle
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Simulator</h1>
          <p className="text-muted-foreground">Test your screen management system with simulated devices</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Testing Environment
        </Badge>
      </div>

      {/* Create New Simulated Device */}
      <Card>
        <CardHeader>
          <CardTitle>Create Simulated Device</CardTitle>
          <CardDescription>Add a new simulated device for testing screen management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                placeholder="e.g., Test TV, Lobby Display"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceType">Device Type</Label>
              <Select value={newDeviceType} onValueChange={setNewDeviceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={createSimulatedDevice} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Device
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pairing Section */}
      {devices.some((d) => !d.connected) && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Devices</CardTitle>
            <CardDescription>Enter a pairing code from your dashboard to connect simulated devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="pairingCode">Pairing Code</Label>
                <Input
                  id="pairingCode"
                  placeholder="Enter 6-digit pairing code"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulated Devices */}
      <div className="grid gap-4">
        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No simulated devices</h3>
              <p className="text-muted-foreground text-center">
                Create simulated devices to test your screen management system
              </p>
            </CardContent>
          </Card>
        ) : (
          devices.map((device) => {
            const Icon = getDeviceIcon(device.type)
            return (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <CardDescription>
                          {deviceTypes.find((dt) => dt.value === device.type)?.label} • Simulated Device
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(device.status)}
                      {getPlaybackBadge(device.playbackStatus)}
                      {!device.connected && <Badge variant="destructive">Not Connected</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!device.connected ? (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => connectDevice(device.id)}
                          disabled={!pairingCode || connectingDevice === device.id}
                        >
                          {connectingDevice === device.id ? "Connecting..." : "Connect Device"}
                        </Button>
                        <span className="text-sm text-muted-foreground">Enter pairing code above to connect</span>
                      </div>
                    ) : (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h4 className="font-medium">Device Controls</h4>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => toggleDeviceStatus(device.id)}>
                                <Power className="h-4 w-4 mr-1" />
                                {device.status === "online" ? "Go Offline" : "Go Online"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => removeDevice(device.id)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                          {device.status === "online" && (
                            <div className="space-y-2">
                              <h4 className="font-medium">Playback Simulation</h4>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => simulatePlaybackControl(device.id, "play")}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => simulatePlaybackControl(device.id, "pause")}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => simulatePlaybackControl(device.id, "stop")}
                                >
                                  <Square className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => simulatePlaybackControl(device.id, "restart")}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li>1. Create simulated devices using the form above</li>
            <li>2. Go to your Screens dashboard and click "Add Screen"</li>
            <li>3. Generate a pairing code in the dashboard</li>
            <li>4. Copy the pairing code and paste it here</li>
            <li>5. Click "Connect Device" on any simulated device</li>
            <li>6. The device will appear in your Screens dashboard</li>
            <li>7. Test playlist assignment and playback controls</li>
            <li>8. Use device controls here to simulate online/offline status</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
