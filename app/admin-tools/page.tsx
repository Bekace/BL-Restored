"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AdminToolsPage() {
  const [userEmail, setUserEmail] = useState("bekace.multimedia@gmail.com")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")

  const updateUserPlan = async () => {
    if (!userEmail || !selectedPlan) {
      setResult("Please enter email and select a plan")
      return
    }

    setLoading(true)
    setResult("")

    try {
      const response = await fetch("/api/admin/users/update-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail,
          newPlan: selectedPlan,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`✅ Success: ${data.message}`)
        // Trigger a page refresh to update the usage dashboard
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Quick Plan Update Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <Label htmlFor="plan">New Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Plan</SelectItem>
                <SelectItem value="pro">Pro Plan</SelectItem>
                <SelectItem value="enterprise">Enterprise Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={updateUserPlan} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Plan
          </Button>

          {result && (
            <div
              className={`p-3 rounded text-sm ${result.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              {result}
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>
              <strong>Current User:</strong> bekace.multimedia@gmail.com
            </p>
            <p>
              <strong>Current Plan:</strong> Free (5 files, 100MB)
            </p>
            <p>
              <strong>Current Usage:</strong> 6 files, 2.9MB
            </p>
            <p>
              <strong>Status:</strong> Over file limit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
