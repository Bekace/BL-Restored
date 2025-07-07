"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function RunDeviceMigrationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/run-device-migration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || "Migration failed")
      }
    } catch (err) {
      setError("Failed to run migration: " + err.message)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Run Device Migration</CardTitle>
          <CardDescription>
            This will add the missing columns to the devices table to fix the screens dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runMigration} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              "Run Device Migration"
            )}
          </Button>

          {result && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-600">Migration completed successfully!</p>
                  <p>
                    You can now go to the{" "}
                    <a href="/dashboard/screens" className="text-blue-600 underline">
                      screens dashboard
                    </a>
                    .
                  </p>
                  {result.columns && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-medium">View table structure</summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.columns, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Migration failed:</p>
                  <p>{error}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
