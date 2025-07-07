"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugMediaPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [planInfo, setPlanInfo] = useState<any>(null)
  const [uploadTest, setUploadTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-upload")
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      setDebugInfo({ error: error.message })
    }
    setLoading(false)
  }

  const checkPlanInfo = async () => {
    try {
      const response = await fetch("/api/user/plan")
      const data = await response.json()
      setPlanInfo(data)
    } catch (error) {
      setPlanInfo({ error: error.message })
    }
  }

  const testUpload = async () => {
    try {
      // Create a tiny test file
      const testFile = new File(["test content"], "test.txt", { type: "text/plain" })
      const formData = new FormData()
      formData.append("file", testFile)

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      setUploadTest({ response: data, status: response.status })
    } catch (error) {
      setUploadTest({ error: error.message })
    }
  }

  useEffect(() => {
    checkDebugInfo()
    checkPlanInfo()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Media Debug Page</h1>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Debug Info</CardTitle>
          <Button onClick={checkDebugInfo} disabled={loading}>
            {loading ? "Loading..." : "Refresh Debug Info"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </CardContent>
      </Card>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Information</CardTitle>
          <Button onClick={checkPlanInfo}>Refresh Plan Info</Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(planInfo, null, 2)}</pre>
        </CardContent>
      </Card>

      {/* Upload Test */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Test</CardTitle>
          <Button onClick={testUpload}>Test Upload</Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(uploadTest, null, 2)}</pre>
        </CardContent>
      </Card>

      {/* Manual Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Manual API Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Test URLs:</strong>
          </div>
          <div>
            <a
              href="/api/debug-upload"
              target="_blank"
              className="text-blue-600 hover:underline block"
              rel="noreferrer"
            >
              /api/debug-upload
            </a>
          </div>
          <div>
            <a href="/api/user/plan" target="_blank" className="text-blue-600 hover:underline block" rel="noreferrer">
              /api/user/plan
            </a>
          </div>
          <div>
            <a href="/api/debug-plan" target="_blank" className="text-blue-600 hover:underline block" rel="noreferrer">
              /api/debug-plan
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
