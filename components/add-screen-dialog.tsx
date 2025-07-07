"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Copy, Check, Monitor, Smartphone, Tv, Globe, Plus, Wifi, WifiOff, Loader2 } from "lucide-react"

interface AddScreenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceAdded: () => void
}

export function AddScreenDialog({ open, onOpenChange, onDeviceAdded }: AddScreenDialogProps) {
  const [step, setStep] = useState<"form" | "pairing">("form")
  const [screenName, setScreenName] = useState("")
  const [deviceType, setDeviceType] = useState("")
  const [pairingCode, setPairingCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    device?: any
    checking: boolean
  }>({
    connected: false,
    checking: false,
  })

  const deviceTypes = [
    { value: "fire_tv", label: "Fire TV Stick", icon: Tv },
    { value: "android_tv", label: "Android TV", icon: Tv },
    { value: "android", label: "Android Device", icon: Smartphone },
    { value: "ios", label: "iOS Device", icon: Smartphone },
    { value: "web_browser", label: "Web Browser", icon: Globe },
    { value: "other", label: "Other Device", icon: Monitor },
  ]

  // Check connection status periodically
  useEffect(() => {
    if (step === "pairing" && pairingCode && !connectionStatus.connected) {
      const checkConnection = async () => {
        try {
          setConnectionStatus((prev) => ({ ...prev, checking: true }))

          const response = await fetch("/api/devices/check-connection", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ pairingCode }),
          })

          const data = await response.json()
          console.log("🔍 [ADD SCREEN] Connection check:", data)

          if (data.success) {
            setConnectionStatus({
              connected: data.connected,
              device: data.device,
              checking: false,
            })

            if (data.connected && !connectionStatus.connected) {
              toast.success("Device connected successfully!")
            }
          }
        } catch (error) {
          console.error("❌ [ADD SCREEN] Connection check error:", error)
          setConnectionStatus((prev) => ({ ...prev, checking: false }))
        }
      }

      // Check immediately
      checkConnection()

      // Then check every 3 seconds
      const interval = setInterval(checkConnection, 3000)
      return () => clearInterval(interval)
    }
  }, [step, pairingCode, connectionStatus.connected])

  const generatePairingCode = async () => {
    try {
      setLoading(true)
      console.log("🔗 [ADD SCREEN] Generating pairing code for:", { screenName, deviceType })

      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          screenName,
          deviceType,
        }),
      })

      const data = await response.json()
      console.log("🔗 [ADD SCREEN] Generate code response:", data)

      if (data.success) {
        setPairingCode(data.pairingCode || data.code)
        setStep("pairing")
        setConnectionStatus({ connected: false, checking: false })
        toast.success("Pairing code generated successfully")
      } else {
        toast.error(data.error || "Failed to generate pairing code")
      }
    } catch (error) {
      console.error("❌ [ADD SCREEN] Error generating code:", error)
      toast.error("Failed to generate pairing code")
    } finally {
      setLoading(false)
    }
  }

  const createScreen = async () => {
    try {
      setLoading(true)
      console.log("📺 [ADD SCREEN] Creating screen with code:", pairingCode)

      const response = await fetch("/api/devices/create-screen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pairingCode }),
      })

      const data = await response.json()
      console.log("📺 [ADD SCREEN] Create screen response:", data)

      if (data.success) {
        toast.success("Screen created successfully!")
        handleClose()
        onDeviceAdded()
      } else {
        toast.error(data.error || "Failed to create screen")
      }
    } catch (error) {
      console.error("❌ [ADD SCREEN] Error creating screen:", error)
      toast.error("Failed to create screen")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pairingCode)
      setCopied(true)
      toast.success("Pairing code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy pairing code")
    }
  }

  const handleClose = () => {
    setStep("form")
    setScreenName("")
    setDeviceType("")
    setPairingCode("")
    setCopied(false)
    setConnectionStatus({ connected: false, checking: false })
    onOpenChange(false)
  }

  const getDeviceInstructions = (type: string) => {
    switch (type) {
      case "fire_tv":
        return [
          "Install the SignageCloud app from the Amazon Appstore",
          "Open the app on your Fire TV",
          "Select 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "android_tv":
        return [
          "Install the SignageCloud app from Google Play Store",
          "Open the app on your Android TV",
          "Select 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "android":
        return [
          "Install the SignageCloud app from Google Play Store",
          "Open the app on your Android device",
          "Tap 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "ios":
        return [
          "Install the SignageCloud app from the App Store",
          "Open the app on your iOS device",
          "Tap 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      case "web_browser":
        return [
          "Open a web browser on your device",
          "Navigate to /device-player on this website",
          "Click 'Connect to Dashboard'",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
      default:
        return [
          "Install or open your SignageCloud compatible app",
          "Look for 'Connect to Dashboard' or 'Pair Device' option",
          "Enter the pairing code when prompted",
          "Wait for connection confirmation",
        ]
    }
  }

  const selectedDeviceType = deviceTypes.find((dt) => dt.value === deviceType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Screen
              </DialogTitle>
              <DialogDescription>
                Add a new digital signage display to your account. You'll get a pairing code to connect your device.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenName">Screen Name</Label>
                <Input
                  id="screenName"
                  placeholder="e.g., Lobby Display, Conference Room TV"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type</Label>
                <Select value={deviceType} onValueChange={setDeviceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={generatePairingCode} disabled={!screenName || !deviceType || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Pairing Code"
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedDeviceType && <selectedDeviceType.icon className="h-5 w-5" />}
                Connect Your {selectedDeviceType?.label}
              </DialogTitle>
              <DialogDescription>Use this pairing code to connect "{screenName}" to your dashboard</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {connectionStatus.connected ? (
                      <>
                        <Wifi className="h-5 w-5 text-green-500" />
                        Device Connected
                      </>
                    ) : connectionStatus.checking ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Checking Connection...
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-5 w-5 text-orange-500" />
                        Waiting for Connection
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {connectionStatus.connected
                      ? "Your device is connected and ready to be added"
                      : "Enter the pairing code in your device to connect"}
                  </CardDescription>
                </CardHeader>
                {connectionStatus.device && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>Device:</strong> {connectionStatus.device.name}
                      </p>
                      <p>
                        <strong>Status:</strong> {connectionStatus.device.status}
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Pairing Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pairing Code</CardTitle>
                  <CardDescription>Enter this code in your SignageCloud app or device player</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-mono font-bold tracking-wider">{pairingCode}</div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Setup Instructions</CardTitle>
                  <CardDescription>Follow these steps to connect your device</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {getDeviceInstructions(deviceType).map((instruction, index) => (
                      <li key={index} className="flex gap-3">
                        <Badge
                          variant="outline"
                          className="min-w-[24px] h-6 rounded-full p-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Separator />

              <div className="text-center text-sm text-muted-foreground">
                <p>The pairing code will expire in 10 minutes.</p>
                <p>The "Done" button will be enabled once your device connects.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={createScreen}
                disabled={!connectionStatus.connected || loading}
                className={connectionStatus.connected ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Screen...
                  </>
                ) : connectionStatus.connected ? (
                  "Done - Create Screen"
                ) : (
                  "Waiting for Connection..."
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
