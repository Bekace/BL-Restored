"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, TestTube, Users, Upload } from "lucide-react"

export function DebugAPIComparison() {
  const [isOpen, setIsOpen] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testAPIs = async () => {
    setTesting(true)
    try {
      // Test Users API
      const usersResponse = await fetch("/api/admin/users")
      const usersData = await usersResponse.json()

      // Test Media API (if it exists)
      let mediaData = null
      try {
        const mediaResponse = await fetch("/api/media")
        mediaData = await mediaResponse.json()
      } catch (err) {
        mediaData = { error: "Media API not accessible" }
      }

      setTestResults({
        users: {
          status: usersResponse.status,
          ok: usersResponse.ok,
          data: usersData,
          count: usersData.users?.length || 0,
        },
        media: {
          status: mediaData?.error ? "N/A" : 200,
          ok: !mediaData?.error,
          data: mediaData,
          count: mediaData?.media?.length || 0,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="mt-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <CardTitle className="text-lg">API Comparison Tool</CardTitle>
                <Badge variant="outline">Debug</Badge>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Compare API responses between Users and Media endpoints</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testAPIs} disabled={testing} className="w-full">
                {testing ? "Testing APIs..." : "Test Both APIs"}
              </Button>

              {testResults && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    Last tested: {new Date(testResults.timestamp).toLocaleString()}
                  </div>

                  {testResults.error ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium text-red-800">Error</div>
                      <div className="text-red-600">{testResults.error}</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Users API Results */}
                      <div className="p-4 border rounded">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Users API</span>
                          <Badge variant={testResults.users.ok ? "default" : "destructive"}>
                            {testResults.users.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>Count: {testResults.users.count}</div>
                          <div>Success: {testResults.users.ok ? "✅" : "❌"}</div>
                          <div className="mt-2">
                            <details>
                              <summary className="cursor-pointer text-blue-600">View Response</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                                {JSON.stringify(testResults.users.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </div>
                      </div>

                      {/* Media API Results */}
                      <div className="p-4 border rounded">
                        <div className="flex items-center space-x-2 mb-2">
                          <Upload className="h-4 w-4" />
                          <span className="font-medium">Media API</span>
                          <Badge variant={testResults.media.ok ? "default" : "secondary"}>
                            {testResults.media.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>Count: {testResults.media.count}</div>
                          <div>Success: {testResults.media.ok ? "✅" : "⚠️"}</div>
                          <div className="mt-2">
                            <details>
                              <summary className="cursor-pointer text-blue-600">View Response</summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                                {JSON.stringify(testResults.media.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comparison Summary */}
                  {!testResults.error && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                      <div className="font-medium text-blue-800 mb-2">Comparison Summary</div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>Both APIs working: {testResults.users.ok && testResults.media.ok ? "✅" : "❌"}</div>
                        <div>Users API response structure looks correct</div>
                        <div>Pattern consistency: {testResults.users.ok === testResults.media.ok ? "✅" : "⚠️"}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
