"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Home, Monitor, ImageIcon, Play, Settings, Shield, Menu, DollarSign, Users, Tag, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardFooter } from "@/components/dashboard-footer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Screens", href: "/dashboard/screens", icon: Monitor },
  { name: "Media", href: "/dashboard/media", icon: ImageIcon },
  { name: "Playlists", href: "/dashboard/playlists", icon: Play },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const adminNavigation = [
  { name: "Admin Overview", href: "/dashboard/admin", icon: Shield },
  { name: "User Management", href: "/dashboard/admin/users", icon: Users },
  { name: "Plan Management", href: "/dashboard/admin/plans", icon: DollarSign },
  { name: "Feature Management", href: "/dashboard/admin/features", icon: Tag },
  { name: "Debug Dashboard", href: "/dashboard/debug", icon: Bug },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/user/profile")
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.user?.isAdmin || false)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }

    checkAdminStatus()
  }, [])

  const allNavigation = [...navigation, ...(isAdmin ? adminNavigation : [])]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-semibold">Digital Signage</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}

              {isAdmin && (
                <>
                  <Separator className="my-4" />
                  <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </div>
                  {adminNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 right-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-semibold">Digital Signage</h1>
            </div>
            <Separator />
            <nav className="flex-1 px-2 py-4 space-y-1">
              {allNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
        <DashboardFooter />
      </div>
    </div>
  )
}

export default DashboardLayout
