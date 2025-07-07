"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestDebugPage() {
  const [dbResult, setDbResult] = useState<any>(null)
  const [resetResult, setResetResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("testpassword123")

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()
      setDbResult(data)
    } catch (error) {
      setDbResult({ error: error.message })
    }
    setLoading(false)
  }

  const testReset = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json()
      setResetResult(data)
    } catch (error) {
      setResetResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug Tools</h1>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDatabase} disabled={loading}>
            Test Database Connection
          </Button>
          {dbResult && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(dbResult, null, 2)}</pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Reset Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">Reset Token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter reset token"
            />
          </div>
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <Button onClick={testReset} disabled={loading}>
            Test Password Reset
          </Button>
          {resetResult && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(resetResult, null, 2)}</pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct API Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>You can also test the APIs directly:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Database Test:</strong>
              <code className="bg-gray-100 px-2 py-1 rounded ml-2">GET https://britelitedigital.com/api/test-db</code>
            </li>
            <li>
              <strong>Reset Password:</strong>
              <code className="bg-gray-100 px-2 py-1 rounded ml-2">
                POST https://britelitedigital.com/api/auth/reset-password
              </code>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
