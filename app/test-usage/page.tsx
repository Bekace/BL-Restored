"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UsageDashboard } from "@/components/usage-dashboard"

// Define plan limits directly to avoid build-time API calls
const PLAN_LIMITS = {
  free: {
    plan_type: "free",
    max_media_files: 7,
    max_storage_bytes: 50 * 1024 * 1024, // 50MB
    max_screens: 1,
    price_monthly: 0,
    features: ["Basic media management", "Email support", "Community access"],
  },
  pro: {
    plan_type: "pro",
    max_media_files: 500,
    max_storage_bytes: 5 * 1024 * 1024 * 1024, // 5GB
    max_screens: 10,
    price_monthly: 29,
    features: ["Advanced media management", "Priority support", "Analytics"],
  },
  enterprise: {
    plan_type: "enterprise",
    max_media_files: -1, // Unlimited
    max_storage_bytes: -1, // Unlimited
    max_screens: -1, // Unlimited
    price_monthly: 99,
    features: ["Unlimited everything", "24/7 support", "Custom integrations"],
  },
}

function formatBytes(bytes: number): string {
  if (bytes === -1) return "Unlimited"
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function formatNumber(num: number): string {
  if (num === -1) return "Unlimited"
  return num.toLocaleString()
}

function getUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0 // Unlimited
  if (limit === 0) return 100
  return Math.min((used / limit) * 100, 100)
}

export default function TestUsagePage() {
  const [testData, setTestData] = useState({
    usage: {
      media_files_count: 3,
      storage_used_bytes: 50 * 1024 * 1024, // 50MB
      screens_count: 1,
      plan_type: "free",
    },
    limits: PLAN_LIMITS.free,
  })

  const testScenarios = [
    {
      name: "Free Plan - Low Usage",
      data: {
        usage: {
          media_files_count: 2,
          storage_used_bytes: 25 * 1024 * 1024, // 25MB
          screens_count: 1,
          plan_type: "free",
        },
        limits: PLAN_LIMITS.free,
      },
    },
    {
      name: "Free Plan - High Usage",
      data: {
        usage: {
          media_files_count: 6,
          storage_used_bytes: 45 * 1024 * 1024, // 45MB
          screens_count: 1,
          plan_type: "free",
        },
        limits: PLAN_LIMITS.free,
      },
    },
    {
      name: "Pro Plan - Medium Usage",
      data: {
        usage: {
          media_files_count: 150,
          storage_used_bytes: 2 * 1024 * 1024 * 1024, // 2GB
          screens_count: 5,
          plan_type: "pro",
        },
        limits: PLAN_LIMITS.pro,
      },
    },
    {
      name: "Enterprise Plan - High Usage",
      data: {
        usage: {
          media_files_count: 800,
          storage_used_bytes: 50 * 1024 * 1024 * 1024, // 50GB
          screens_count: 25,
          plan_type: "enterprise",
        },
        limits: PLAN_LIMITS.enterprise,
      },
    },
  ]

  const TestCard = ({ title, usage, limit, type }: { title: string; usage: number; limit: number; type: string }) => {
    const percentage = getUsagePercentage(usage, limit)
    const isUnlimited = limit === -1

    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{title}</span>
              <span className="text-gray-600">
                {type === "storage" ? formatBytes(usage) : formatNumber(usage)} /{" "}
                {type === "storage" ? formatBytes(limit) : formatNumber(limit)}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-xs text-gray-500">{isUnlimited ? "Unlimited" : `${percentage.toFixed(1)}% used`}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Usage Dashboard Test</h1>
        <p className="text-gray-600">Test different usage scenarios and verify percentage calculations</p>
      </div>

      {/* Function Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Function Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Format Functions</h3>
              <div className="space-y-1 text-sm">
                <div>formatBytes(1024): {formatBytes(1024)}</div>
                <div>formatBytes(1048576): {formatBytes(1048576)}</div>
                <div>formatBytes(-1): {formatBytes(-1)}</div>
                <div>formatNumber(1000): {formatNumber(1000)}</div>
                <div>formatNumber(-1): {formatNumber(-1)}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Percentage Calculations</h3>
              <div className="space-y-1 text-sm">
                <div>getUsagePercentage(50, 100): {getUsagePercentage(50, 100)}%</div>
                <div>getUsagePercentage(75, 100): {getUsagePercentage(75, 100)}%</div>
                <div>getUsagePercentage(120, 100): {getUsagePercentage(120, 100)}%</div>
                <div>getUsagePercentage(50, -1): {getUsagePercentage(50, -1)}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <div className="space-y-6">
        {testScenarios.map((scenario, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{scenario.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setTestData(scenario.data)}>
                  Load Scenario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <TestCard
                  title="Media Files"
                  usage={scenario.data.usage.media_files_count}
                  limit={scenario.data.limits.max_media_files}
                  type="files"
                />
                <TestCard
                  title="Storage"
                  usage={scenario.data.usage.storage_used_bytes}
                  limit={scenario.data.limits.max_storage_bytes}
                  type="storage"
                />
                <TestCard
                  title="Screens"
                  usage={scenario.data.usage.screens_count}
                  limit={scenario.data.limits.max_screens}
                  type="screens"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Usage Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Live Usage Dashboard</CardTitle>
          <p className="text-sm text-gray-600">This shows your actual usage data from the API</p>
        </CardHeader>
        <CardContent>
          <UsageDashboard />
        </CardContent>
      </Card>

      {/* API Test */}
      <Card>
        <CardHeader>
          <CardTitle>API Response Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              try {
                const response = await fetch("/api/user/plan")
                const data = await response.json()
                console.log("API Response:", data)
                alert("Check console for API response")
              } catch (error) {
                console.error("API Error:", error)
                alert("API Error - check console")
              }
            }}
          >
            Test API Response
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
