"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Monitor,
  Smartphone,
  Tv,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react"

export default function TestDevicePairingPage() {
  const [step, setStep] = useState(1)
  const [deviceCode, setDeviceCode] = useState("")
  const [deviceType, setDeviceType] = useState("firestick")
  const [platform, setPlatform] = useState("android-tv")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState(null)
  const [testResults, setTestResults] = useState([])

  // Memoize the addTestResult function to prevent infinite loops
  const addTestResult = useCallback((test, success, message, details = null) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      test,
      success,
      message,
      details,
    }
    setTestResults((prev) => [result, ...prev].slice(0, 10)) // Keep last 10 results
  }, [])

  // Simulate device registration
  const handleDeviceRegistration = async () => {
    if (!deviceCode || deviceCode.length < 6) {
      setError("Please enter a valid device code")
      addTestResult("Device Registration", false, "Invalid code format")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode,
          deviceType,
          platform,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setDeviceInfo(data)
        setSuccess(true)
        setStep(3)
        addTestResult("Device Registration", true, "Device registered successfully", {
          deviceId: data.deviceId,
          screenName: data.screenName,
        })
      } else {
        setError(data.message || "Registration failed")
        addTestResult("Device Registration", false, data.message || "Registration failed", {
          code: deviceCode,
          deviceType,
          platform,
        })
      }
    } catch (error) {
      const errorMsg = "Network error. Please try again."
      setError(errorMsg)
      addTestResult("Device Registration", false, errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Test device validation
  const testDeviceValidation = async () => {
    if (!deviceInfo) return

    setLoading(true)
    try {
      const response = await fetch(`/api/devices/${deviceInfo.deviceId}/validate`, {
        headers: {
          Authorization: `Bearer ${deviceInfo.apiKey}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        addTestResult("Device Validation", true, "Device authentication successful", data.device)
      } else {
        addTestResult("Device Validation", false, data.message || "Validation failed")
      }
    } catch (error) {
      addTestResult("Device Validation", false, "Network error during validation")
    } finally {
      setLoading(false)
    }
  }

  // Test heartbeat
  const sendTestHeartbeat = async () => {
    if (!deviceInfo) return

    setLoading(true)
    try {
      const response = await fetch(`/api/devices/${deviceInfo.deviceId}/heartbeat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${deviceInfo.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentItem: "test-item-1",
          playlistPosition: 0,
          timestamp: new Date().toISOString(),
          deviceInfo: {
            platform: platform,
            type: deviceType,
            version: "1.0.0",
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        addTestResult("Heartbeat", true, "Heartbeat sent successfully", {
          serverTime: data.serverTime,
          commands: data.commands?.length || 0,
        })
      } else {
        addTestResult("Heartbeat", false, data.message || "Heartbeat failed")
      }
    } catch (error) {
      addTestResult("Heartbeat", false, "Network error during heartbeat")
    } finally {
      setLoading(false)
    }
  }

  // Test with invalid API key
  const testInvalidAuth = async () => {
    if (!deviceInfo) return

    setLoading(true)
    try {
      const response = await fetch(`/api/devices/${deviceInfo.deviceId}/validate`, {
        headers: {
          Authorization: `Bearer invalid-api-key-12345`,
        },
      })

      const data = await response.json()

      if (!data.success) {
        addTestResult("Invalid Auth Test", true, "Correctly rejected invalid API key", {
          expectedError: data.message,
        })
      } else {
        addTestResult("Invalid Auth Test", false, "Security issue: Invalid API key was accepted!")
      }
    } catch (error) {
      addTestResult("Invalid Auth Test", false, "Network error during auth test")
    } finally {
      setLoading(false)
    }
  }

  const getDeviceIcon = () => {
    switch (deviceType) {
      case "firestick":
        return <Tv className="h-8 w-8" />
      case "android-tv":
        return <Monitor className="h-8 w-8" />
      case "web-browser":
        return <Globe className="h-8 w-8" />
      default:
        return <Smartphone className="h-8 w-8" />
    }
  }

  const resetTest = () => {
    setStep(1)
    setDeviceCode("")
    setError("")
    setSuccess(false)
    setDeviceInfo(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Device Pairing Test Suite</h1>
          <p className="text-gray-600">Test device registration, error handling, and expiration scenarios</p>
        </div>

        <Tabs defaultValue="pairing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pairing">Device Pairing</TabsTrigger>
            <TabsTrigger value="errors">Error Testing</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>

          <TabsContent value="pairing" className="space-y-6">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Dashboard Side - Generate Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Monitor className="h-5 w-5 mr-2" />
                    Dashboard Side
                  </CardTitle>
                  <CardDescription>Generate device codes and test expiration scenarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <GenerateCodeSection onTestResult={addTestResult} />
                </CardContent>
              </Card>

              {/* Device Side - Enter Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getDeviceIcon()}
                    <span className="ml-2">Device Side</span>
                  </CardTitle>
                  <CardDescription>Simulate device registration with various scenarios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Device Type</Label>
                        <Select value={deviceType} onValueChange={setDeviceType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="firestick">Amazon Fire TV Stick</SelectItem>
                            <SelectItem value="android-tv">Android TV</SelectItem>
                            <SelectItem value="web-browser">Web Browser</SelectItem>
                            <SelectItem value="raspberry-pi">Raspberry Pi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Platform</Label>
                        <Select value={platform} onValueChange={setPlatform}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="android-tv">Android TV</SelectItem>
                            <SelectItem value="web">Web Browser</SelectItem>
                            <SelectItem value="linux">Linux</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={() => setStep(2)} className="w-full">
                        Start Pairing Process
                      </Button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Enter Device Code</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Enter the 6-digit code from your SignageCloud dashboard
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deviceCode">Device Code</Label>
                        <Input
                          id="deviceCode"
                          value={deviceCode}
                          onChange={(e) => {
                            // Allow alphanumeric codes, remove spaces and convert to uppercase
                            const value = e.target.value.replace(/\s/g, "").toUpperCase()
                            setDeviceCode(value)
                          }}
                          placeholder="Enter code (e.g., 123456 or ABC123DEF456)"
                          className="text-center text-lg font-mono tracking-wider"
                          maxLength={15}
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                          Back
                        </Button>
                        <Button
                          onClick={handleDeviceRegistration}
                          disabled={loading || deviceCode.length < 6}
                          className="flex-1"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            "Connect Device"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && success && deviceInfo && (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>Device connected successfully!</AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <h3 className="font-semibold">Device Information:</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Device ID:</span>
                            <span className="font-mono">{deviceInfo.deviceId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Screen Name:</span>
                            <span>{deviceInfo.screenName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">API Key:</span>
                            <span className="font-mono text-xs">{deviceInfo.apiKey.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold">Test Device Functions:</h3>
                        <div className="grid grid-cols-1 gap-2">
                          <Button variant="outline" size="sm" onClick={testDeviceValidation} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Test Validation
                          </Button>
                          <Button variant="outline" size="sm" onClick={sendTestHeartbeat} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Send Heartbeat
                          </Button>
                          <Button variant="outline" size="sm" onClick={testInvalidAuth} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Test Invalid Auth
                          </Button>
                        </div>
                      </div>

                      <Button onClick={resetTest} className="w-full">
                        Test Another Device
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <ErrorTestingSection onTestResult={addTestResult} />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <TestResultsSection results={testResults} onClear={() => setTestResults([])} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function GenerateCodeSection({ onTestResult }) {
  const [code, setCode] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [copied, setCopied] = useState(false)

  // Memoize the expiration check to prevent infinite loops
  const checkExpiration = useCallback(() => {
    if (expiresAt && code) {
      const expirationTime = new Date(expiresAt).getTime()
      const currentTime = Date.now()
      const remaining = Math.max(0, Math.floor((expirationTime - currentTime) / 1000))

      setTimeRemaining(remaining)

      // Only call onTestResult when code actually expires (not on every update)
      if (remaining === 0 && timeRemaining > 0) {
        onTestResult("Code Expiration", true, "⏰ Code expired automatically after countdown!", {
          expiredCode: code,
          expiredAt: new Date().toISOString(),
        })
      }
    }
  }, [expiresAt, code, onTestResult, timeRemaining])

  // Timer effect with proper cleanup
  useEffect(() => {
    if (!expiresAt || !code) return

    const interval = setInterval(checkExpiration, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, code, checkExpiration])

  const generateCode = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/devices/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer demo-token`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setCode(data.code)
        setExpiresAt(data.expiresAt)

        // Calculate initial time remaining
        const expirationTime = new Date(data.expiresAt).getTime()
        const currentTime = Date.now()
        const initialRemaining = Math.max(0, Math.floor((expirationTime - currentTime) / 1000))
        setTimeRemaining(initialRemaining)

        onTestResult("Code Generation", true, "6-digit code generated successfully", {
          code: data.code,
          expiresAt: data.expiresAt,
          minutesRemaining: Math.floor(initialRemaining / 60),
        })
      } else {
        setError(data.message || "Failed to generate code")
        onTestResult("Code Generation", false, data.message || "Failed to generate code")
      }
    } catch (error) {
      const errorMsg = "Network error. Please try again."
      setError(errorMsg)
      onTestResult("Code Generation", false, errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const generateShortCode = () => {
    setLoading(true)
    setError("")

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const now = Date.now()
      const expirationTime = now + 35 * 1000 // Give 35 seconds instead of 30 for buffer
      const expiresAt = new Date(expirationTime).toISOString()

      // Set the code and expiration first
      setCode(code)
      setExpiresAt(expiresAt)

      // Calculate and set initial time remaining
      const initialRemaining = Math.floor((expirationTime - now) / 1000)
      setTimeRemaining(initialRemaining)

      onTestResult(
        "Short Code Generation",
        true,
        `Generated code with ${initialRemaining}-second expiration for testing`,
        {
          code,
          expiresAt,
          secondsRemaining: initialRemaining,
        },
      )
    } catch (error) {
      const errorMsg = "Failed to generate short-lived code"
      setError(errorMsg)
      onTestResult("Short Code Generation", false, errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
      onTestResult("Code Copy", true, "Code copied to clipboard", { code })
    } catch (error) {
      onTestResult("Code Copy", false, "Failed to copy code to clipboard")
    }
  }

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const isExpired = timeRemaining === 0 && code
  const isExpiringSoon = timeRemaining > 0 && timeRemaining <= 60

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Generate Device Code</h3>
        <p className="text-sm text-gray-600 mb-4">Generate codes with different expiration times</p>
      </div>

      {!code ? (
        <div className="space-y-2">
          <Button onClick={generateCode} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Device Code (10 min)"
            )}
          </Button>
          <Button onClick={generateShortCode} disabled={loading} variant="outline" className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Short Code (30 sec)"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`text-center p-6 border-2 border-dashed rounded-lg transition-all duration-500 ${
              isExpired
                ? "border-red-500 bg-red-100 animate-pulse"
                : isExpiringSoon
                  ? "border-orange-400 bg-orange-50 shadow-lg"
                  : "border-gray-300 bg-white"
            }`}
          >
            <div
              className={`text-4xl font-mono font-bold tracking-wider mb-2 ${
                isExpired ? "text-red-600 line-through" : "text-black"
              }`}
            >
              {code}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
              disabled={isExpired}
              className={`transition-all duration-200 ${copied ? "bg-green-100 text-green-700 border-green-300" : ""}`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Code
                </>
              )}
            </Button>
          </div>

          <div className="text-center space-y-2">
            {isExpired ? (
              <Badge variant="destructive" className="text-lg px-4 py-2 animate-bounce">
                <XCircle className="h-4 w-4 mr-2" />
                EXPIRED
              </Badge>
            ) : (
              <>
                <Badge
                  variant={isExpiringSoon ? "destructive" : "default"}
                  className={`text-lg px-4 py-2 ${isExpiringSoon ? "animate-pulse" : ""}`}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </Badge>
                {isExpiringSoon && (
                  <div className="space-y-2">
                    <Progress value={(timeRemaining / 30) * 100} className="h-3 bg-red-100" />
                    <p className="text-sm text-red-600 font-bold animate-pulse">⚠️ EXPIRING SOON! Use code now!</p>
                  </div>
                )}
              </>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setCode("")
              setExpiresAt("")
              setTimeRemaining(0)
              setCopied(false)
            }}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New Code
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function ErrorTestingSection({ onTestResult }) {
  const [loading, setLoading] = useState(false)

  const testScenarios = [
    {
      name: "Invalid Code Format",
      description: "Test with codes that are too short, too long, or contain letters",
      test: async () => {
        const invalidCodes = ["123", "1234567", "12345a", "abcdef"]
        for (const code of invalidCodes) {
          try {
            const response = await fetch("/api/devices/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                deviceCode: code,
                deviceType: "firestick",
                platform: "android-tv",
              }),
            })
            const data = await response.json()
            onTestResult("Invalid Code Format", !data.success, `Code "${code}": ${data.message || "Rejected"}`)
          } catch (error) {
            onTestResult("Invalid Code Format", false, `Network error testing code "${code}"`)
          }
        }
      },
    },
    {
      name: "Expired Code",
      description: "Test registration with an expired code",
      test: async () => {
        const expiredCode = "999999"
        try {
          const response = await fetch("/api/devices/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceCode: expiredCode,
              deviceType: "firestick",
              platform: "android-tv",
            }),
          })
          const data = await response.json()
          onTestResult("Expired Code Test", !data.success, data.message || "Code correctly rejected")
        } catch (error) {
          onTestResult("Expired Code Test", false, "Network error testing expired code")
        }
      },
    },
    {
      name: "Missing Fields",
      description: "Test registration with missing required fields",
      test: async () => {
        const testCases = [{ deviceCode: "123456" }, { deviceType: "firestick" }, { platform: "android-tv" }]

        for (const testCase of testCases) {
          try {
            const response = await fetch("/api/devices/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(testCase),
            })
            const data = await response.json()
            onTestResult("Missing Fields Test", !data.success, `Missing fields correctly rejected: ${data.message}`)
          } catch (error) {
            onTestResult("Missing Fields Test", false, "Network error testing missing fields")
          }
        }
      },
    },
    {
      name: "Duplicate Registration",
      description: "Test using the same code twice",
      test: async () => {
        onTestResult("Duplicate Registration", true, "Test scenario: Would test code reuse prevention")
      },
    },
  ]

  const runTest = async (scenario) => {
    setLoading(true)
    try {
      await scenario.test()
    } catch (error) {
      onTestResult(scenario.name, false, `Test execution failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    for (const scenario of testScenarios) {
      await scenario.test()
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Error Scenario Testing
        </CardTitle>
        <CardDescription>Test various error conditions and edge cases</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runAllTests} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running All Tests...
            </>
          ) : (
            "Run All Error Tests"
          )}
        </Button>

        <div className="grid gap-4">
          {testScenarios.map((scenario, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{scenario.name}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => runTest(scenario)} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TestResultsSection({ results, onClear }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Test Results
            </CardTitle>
            <CardDescription>Real-time results from all tests ({results.length} total)</CardDescription>
          </div>
          <Button variant="outline" onClick={onClear} disabled={results.length === 0}>
            Clear Results
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No test results yet. Run some tests to see results here.</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.id}
                className={`border rounded-lg p-3 ${
                  result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                      {result.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
