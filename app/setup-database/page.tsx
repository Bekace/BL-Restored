"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react"

export default function SetupDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; error?: string } | null>(null)

  const setupDatabase = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Network error occurred",
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Database Setup</h1>
          <p className="text-gray-600">Initialize your SignageCloud database with demo data</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Initialization
            </CardTitle>
            <CardDescription>
              This will create the necessary tables and insert demo data for testing the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">What this will create:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Users table with demo account</li>
                    <li>• Device codes table for pairing</li>
                    <li>• Devices table with sample screens</li>
                    <li>• Demo user: demo@signagecloud.com / password123</li>
                  </ul>
                </div>

                <Button onClick={setupDatabase} disabled={loading} className="w-full" size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up database...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Initialize Database
                    </>
                  )}
                </Button>
              </div>
            )}

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{result.message}</p>
                    {result.error && (
                      <details className="text-xs">
                        <summary className="cursor-pointer">Error details</summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">{result.error}</pre>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result?.success && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Database setup complete!</h3>
                  <p className="text-sm text-green-800 mb-3">You can now test the platform:</p>
                  <div className="space-y-2">
                    <Button asChild variant="outline" className="w-full">
                      <a href="/login">Login to Dashboard</a>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/test-device-pairing">Test Device Pairing</a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {result && !result.success && (
              <Button onClick={setupDatabase} disabled={loading} variant="outline" className="w-full">
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
