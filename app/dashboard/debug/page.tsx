"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Bug,
  Database,
  Users,
  Upload,
  Settings,
  Monitor,
  TestTube,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react"

interface DebugTool {
  name: string
  description: string
  url: string
  type: "api" | "page" | "tool"
  category: string
  icon: React.ReactNode
  method?: "GET" | "POST"
}

const debugTools: DebugTool[] = [
  // API Debug Endpoints
  {
    name: "Plan Detailed Debug",
    description: "Comprehensive plan system diagnostics and user plan information",
    url: "/api/debug-plan-detailed",
    type: "api",
    category: "Plan System",
    icon: <Settings className="h-4 w-4" />,
    method: "GET",
  },
  {
    name: "Plan Update Debug",
    description: "Debug plan update functionality and admin privileges",
    url: "/api/debug-plan-update",
    type: "api",
    category: "Plan System",
    icon: <Settings className="h-4 w-4" />,
    method: "GET",
  },
  {
    name: "Test Plan Update",
    description: "Manual plan update testing endpoint",
    url: "/api/test-plan-update",
    type: "api",
    category: "Plan System",
    icon: <TestTube className="h-4 w-4" />,
    method: "POST",
  },
  {
    name: "User Plan API",
    description: "Current user's plan information and limits",
    url: "/api/user/plan",
    type: "api",
    category: "Plan System",
    icon: <Users className="h-4 w-4" />,
    method: "GET",
  },
  {
    name: "Media Count Debug",
    description: "Debug media count and storage usage calculations",
    url: "/api/debug-media-count",
    type: "api",
    category: "Media System",
    icon: <Upload className="h-4 w-4" />,
    method: "GET",
  },
  {
    name: "Upload Debug",
    description: "Debug file upload functionality and limits",
    url: "/api/debug-upload",
    type: "api",
    category: "Media System",
    icon: <Upload className="h-4 w-4" />,
    method: "GET",
  },
  {
    name: "Admin Debug",
    description: "Admin system setup and user privilege checks",
    url: "/api/admin/debug",
    type: "api",
    category: "Admin System",
    icon: <Users className="h-4 w-4" />,
    method: "GET",
  },
  {
    name: "Database Test",
    description: "Test database connection and basic queries",
    url: "/api/test-db",
    type: "api",
    category: "Database",
    icon: <Database className="h-4 w-4" />,
    method: "GET",
  },
  {
    name: "Token Test",
    description: "Test JWT token validation and user authentication",
    url: "/api/test-token",
    type: "api",
    category: "Authentication",
    icon: <Settings className="h-4 w-4" />,
    method: "GET",
  },

  // Debug Pages
  {
    name: "Usage Testing",
    description: "Test usage dashboard and plan limit displays",
    url: "/test-usage",
    type: "page",
    category: "Plan System",
    icon: <TestTube className="h-4 w-4" />,
  },
  {
    name: "Media Debug",
    description: "Debug media library and file management",
    url: "/debug-media",
    type: "page",
    category: "Media System",
    icon: <Upload className="h-4 w-4" />,
  },
  {
    name: "General Debug",
    description: "General system debugging and diagnostics",
    url: "/test-debug",
    type: "page",
    category: "System",
    icon: <Bug className="h-4 w-4" />,
  },
  {
    name: "Device Pairing Test",
    description: "Test device pairing and registration functionality",
    url: "/test-device-pairing",
    type: "page",
    category: "Device System",
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    name: "Database Setup",
    description: "Initialize and setup database tables",
    url: "/setup-database",
    type: "page",
    category: "Database",
    icon: <Database className="h-4 w-4" />,
  },

  // Admin Tools
  {
    name: "Admin Tools",
    description: "Quick admin tools for plan updates and user management",
    url: "/admin-tools",
    type: "tool",
    category: "Admin System",
    icon: <Settings className="h-4 w-4" />,
  },
]

const categories = Array.from(new Set(debugTools.map((tool) => tool.category)))

export default function DebugDashboard() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(window.location.origin + url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const openInNewTab = (url: string) => {
    window.open(url, "_blank")
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "api":
        return "bg-blue-100 text-blue-800"
      case "page":
        return "bg-green-100 text-green-800"
      case "tool":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Bug className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Debug Dashboard</h1>
        </div>

        <div className="text-sm text-muted-foreground">
          Centralized access to all debugging tools, test endpoints, and diagnostic utilities.
        </div>

        {categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
              <CardDescription>Debug tools and utilities for {category.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {debugTools
                  .filter((tool) => tool.category === category)
                  .map((tool) => (
                    <div key={tool.url} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {tool.icon}
                          <h3 className="font-medium">{tool.name}</h3>
                        </div>
                        <div className="flex space-x-1">
                          <Badge className={getTypeColor(tool.type)}>{tool.type.toUpperCase()}</Badge>
                          {tool.method && (
                            <Badge variant="outline" className="text-xs">
                              {tool.method}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{tool.description}</p>

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openInNewTab(tool.url)} className="flex-1">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(tool.url)}>
                          {copiedUrl === tool.url ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">API Endpoints</h4>
              <p className="text-sm text-muted-foreground">
                These return JSON data for debugging. GET endpoints can be opened directly in browser. POST endpoints
                require tools like Postman or curl.
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Debug Pages</h4>
              <p className="text-sm text-muted-foreground">
                Interactive pages with debugging interfaces and diagnostic tools.
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Admin Tools</h4>
              <p className="text-sm text-muted-foreground">
                Administrative utilities for managing users, plans, and system configuration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
