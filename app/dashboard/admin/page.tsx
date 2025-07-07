"use client"

import { useState, useEffect } from "react"
import { Shield, Users, Loader2, AlertCircle, Bug, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  company: string
  plan: string
  createdAt: string
  isAdmin: boolean
  mediaCount: number
  storageUsed: number
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState<number | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const runDebugCheck = async () => {
    try {
      const response = await fetch("/api/admin/debug")
      const data = await response.json()
      setDebugInfo(data)
      console.log("Debug info:", data)
    } catch (err) {
      console.error("Debug check failed:", err)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading users...")
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      console.log("Users API response:", data)

      if (response.ok) {
        setUsers(data.users || [])
      } else {
        setError(data.message || `Failed to load users (${response.status})`)
      }
    } catch (err) {
      console.error("Error loading users:", err)
      setError("Network error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDebugCheck()
    loadUsers()
  }, [])

  const updateUserPlan = async (userId: number, newPlan: string) => {
    try {
      setUpdatingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: newPlan }),
      })

      const data = await response.json()

      if (response.ok) {
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, plan: newPlan } : user)))
      } else {
        setError(data.message || "Failed to update user plan")
      }
    } catch (err) {
      setError("Failed to update user plan: " + err.message)
      console.error("Error updating user plan:", err)
    } finally {
      setUpdatingUser(null)
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "enterprise":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case "free":
        return { files: 5, storage: 100 * 1024 * 1024 } // 100MB
      case "pro":
        return { files: 100, storage: 10 * 1024 * 1024 * 1024 } // 10GB
      case "enterprise":
        return { files: 1000, storage: 100 * 1024 * 1024 * 1024 } // 100GB
      default:
        return { files: 5, storage: 100 * 1024 * 1024 }
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading admin dashboard...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Debug Info */}
        {debugInfo && !debugInfo.success && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Required:</strong> {debugInfo.message}
              <br />
              <small>Step: {debugInfo.step}</small>
              {debugInfo.step === "admin_check" && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      // Try to make current user admin
                      fetch("/api/admin/debug", { method: "POST" }).then(() => window.location.reload())
                    }}
                  >
                    Make Me Admin
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={loadUsers}>
                  Try Again
                </Button>
                <Button size="sm" variant="outline" onClick={runDebugCheck} className="ml-2">
                  Run Debug
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.plan === "pro").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enterprise Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.filter((u) => u.plan === "enterprise").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Dashboard Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5" />
              <span>Debug Dashboard</span>
            </CardTitle>
            <CardDescription>Access all debugging tools and diagnostic utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.open("/dashboard/debug", "_blank")} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Debug Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Users Table */}
        {users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const limits = getPlanLimits(user.plan)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.company || "N/A"}</TableCell>
                        <TableCell>
                          <Badge className={getPlanBadgeColor(user.plan)}>{user.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              Files: {user.mediaCount}/{limits.files}
                            </div>
                            <div>
                              Storage: {formatFileSize(user.storageUsed)}/{formatFileSize(limits.storage)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.isAdmin && <Badge variant="secondary">Admin</Badge>}</TableCell>
                        <TableCell>
                          <Select
                            value={user.plan}
                            onValueChange={(newPlan) => updateUserPlan(user.id, newPlan)}
                            disabled={updatingUser === user.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
