"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Loader2,
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"
import { formatBytes, formatNumber } from "@/lib/plans"
import { DebugPanel } from "@/components/debug-panel"
import { DebugAPIComparison } from "@/components/debug-api-comparison"
import { debugLogger } from "@/lib/debug"

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

interface Plan {
  id: number
  plan_type: string
  name: string
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
  is_active: boolean
  subscriber_count?: number
}

interface ValidationErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  plan?: string
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState<number | null>(null)
  const [deletingUser, setDeletingUser] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("all")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [bulkAssignPlan, setBulkAssignPlan] = useState("")
  const [bulkAssigning, setBulkAssigning] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Create User Dialog State
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    plan: "",
    password: "",
    isAdmin: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  // Edit User Dialog State
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    plan: "",
    password: "",
    isAdmin: false,
  })
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [updatingUserEdit, setUpdatingUserEdit] = useState(false)
  const [editValidationErrors, setEditValidationErrors] = useState<ValidationErrors>({})

  // EXACT MEDIA PATTERN - NOT ASYNC!
  const loadUsers = async () => {
    try {
      debugLogger.apiCall("GET", "/api/admin/users")
      debugLogger.stateChange("UsersPage", "Loading users started", { loading: true })

      setLoading(true)
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      debugLogger.apiResponse("/api/admin/users", response.ok, {
        status: response.status,
        userCount: data.users?.length || 0,
        fullResponse: data,
      })

      if (response.ok) {
        debugLogger.stateChange("UsersPage", "Users loaded successfully", {
          userCount: data.users?.length || 0,
          previousCount: users.length,
          newUsers: data.users,
        })
        setUsers(data.users || [])
        setError(null)
      } else {
        debugLogger.stateChange("UsersPage", "Users loading failed", { error: data.message })
        setError(data.message || "Failed to load users")
      }
    } catch (err) {
      debugLogger.stateChange("UsersPage", "Users loading error", { error: err.message })
      setError("Failed to load users")
      console.error("Error loading users:", err)
    } finally {
      debugLogger.stateChange("UsersPage", "Loading users finished", { loading: false })
      setLoading(false)
    }
  }

  const loadPlans = async () => {
    try {
      debugLogger.apiCall("GET", "/api/admin/plans")
      const response = await fetch("/api/admin/plans")
      const data = await response.json()

      debugLogger.apiResponse("/api/admin/plans", response.ok, {
        planCount: data.plans?.length || 0,
      })

      if (response.ok) {
        setPlans(data.plans || [])
      }
    } catch (err) {
      debugLogger.stateChange("UsersPage", "Plans loading error", { error: err.message })
      console.error("Error loading plans:", err)
    }
  }

  useEffect(() => {
    debugLogger.stateChange("UsersPage", "Component mounted")
    loadUsers()
    loadPlans()
  }, [])

  // Debug refresh trigger changes
  useEffect(() => {
    debugLogger.refresh("UsersPage", `refreshTrigger changed to ${refreshTrigger}`)
  }, [refreshTrigger])

  const triggerRefresh = () => {
    const newTrigger = refreshTrigger + 1
    debugLogger.userAction("Trigger refresh", { oldTrigger: refreshTrigger, newTrigger })
    setRefreshTrigger(newTrigger)
  }

  // EXACT MEDIA PATTERN - NOT ASYNC!
  const handleUserCreated = () => {
    debugLogger.userAction("Handle user created - START (MEDIA PATTERN)")
    loadUsers()
    setCreateUserDialogOpen(false)
    triggerRefresh()
    debugLogger.userAction("Handle user created - END (MEDIA PATTERN)")
  }

  // EXACT MEDIA PATTERN - NOT ASYNC!
  const handleUserUpdated = () => {
    debugLogger.userAction("Handle user updated - START (MEDIA PATTERN)")
    loadUsers()
    setEditUserDialogOpen(false)
    triggerRefresh()
    debugLogger.userAction("Handle user updated - END (MEDIA PATTERN)")
  }

  // EXACT MEDIA PATTERN - NOT ASYNC!
  const handleUserDeleted = () => {
    debugLogger.userAction("Handle user deleted - START (MEDIA PATTERN)")
    loadUsers()
    triggerRefresh()
    debugLogger.userAction("Handle user deleted - END (MEDIA PATTERN)")
  }

  // Debug dialog state changes
  useEffect(() => {
    debugLogger.stateChange("CreateDialog", `Dialog ${createUserDialogOpen ? "opened" : "closed"}`)
  }, [createUserDialogOpen])

  useEffect(() => {
    debugLogger.stateChange("EditDialog", `Dialog ${editUserDialogOpen ? "opened" : "closed"}`)
  }, [editUserDialogOpen])

  // Filter users based on search and plan filter
  useEffect(() => {
    let filtered = users

    // Search filter - with null safety
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          (user.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.company || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Plan filter
    if (selectedPlanFilter !== "all") {
      filtered = filtered.filter((user) => user.plan === selectedPlanFilter)
    }

    debugLogger.stateChange("UsersPage", "Users filtered", {
      totalUsers: users.length,
      filteredUsers: filtered.length,
      searchTerm,
      planFilter: selectedPlanFilter,
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, selectedPlanFilter])

  const validateForm = (formData: any, errors: ValidationErrors): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const trimmedEmail = formData.email.trim().toLowerCase()
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = "Please enter a valid email address (e.g., user@example.com)"
      }
    }

    if (formData.password && formData.password.trim() && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long"
    }

    if (!formData.plan) {
      newErrors.plan = "Plan selection is required"
    }

    Object.assign(errors, newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateUserPlan = async (userId: number, newPlan: string) => {
    try {
      debugLogger.userAction("Update user plan", { userId, newPlan })
      setUpdatingUser(userId)

      debugLogger.apiCall("PUT", `/api/admin/users/${userId}/plan`, { plan: newPlan })
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: newPlan }),
      })

      const data = await response.json()
      debugLogger.apiResponse(`/api/admin/users/${userId}/plan`, response.ok, data)

      console.log("Plan update response:", { status: response.status, data })

      if (response.ok && data.success) {
        // Update the user in the local state
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, plan: newPlan } : user)))
        triggerRefresh() // Refresh usage data

        toast({
          title: "Plan Updated",
          description: data.message || `User plan updated to ${newPlan} successfully.`,
        })

        console.log("Plan update successful:", data.user)
      } else {
        console.error("Plan update failed:", data)
        setError(data.message || "Failed to update user plan")
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update user plan",
          variant: "destructive",
        })
      }
    } catch (err) {
      debugLogger.userAction("Update user plan error", { error: err.message })
      console.error("Network error updating user plan:", err)
      setError("Network error: Failed to update user plan")
      toast({
        title: "Update Failed",
        description: "Network error: Failed to update user plan",
        variant: "destructive",
      })
    } finally {
      setUpdatingUser(null)
    }
  }

  const deleteUser = async (userId: number) => {
    try {
      debugLogger.userAction("Delete user", { userId })
      setDeletingUser(userId)

      debugLogger.apiCall("DELETE", `/api/admin/users/${userId}`)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      debugLogger.apiResponse(`/api/admin/users/${userId}`, response.ok, data)

      if (response.ok) {
        toast({
          title: "User Deleted",
          description: data.message || "User deleted successfully.",
        })
        handleUserDeleted() // NOT ASYNC - EXACT MEDIA PATTERN
      } else {
        toast({
          title: "Delete Failed",
          description: data.message || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (err) {
      debugLogger.userAction("Delete user error", { error: err.message })
      console.error("Error deleting user:", err)
      toast({
        title: "Delete Failed",
        description: "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setDeletingUser(null)
    }
  }

  const handleBulkAssign = async () => {
    if (!bulkAssignPlan || selectedUsers.length === 0) return

    try {
      debugLogger.userAction("Bulk assign plans", { userCount: selectedUsers.length, plan: bulkAssignPlan })
      setBulkAssigning(true)
      const promises = selectedUsers.map((userId) => updateUserPlan(userId, bulkAssignPlan))
      await Promise.all(promises)

      toast({
        title: "Bulk Assignment Complete",
        description: `Successfully assigned ${bulkAssignPlan} plan to ${selectedUsers.length} users.`,
      })

      setSelectedUsers([])
      setBulkAssignDialogOpen(false)
      setBulkAssignPlan("")
    } catch (err) {
      debugLogger.userAction("Bulk assign error", { error: err.message })
      toast({
        title: "Bulk Assignment Failed",
        description: "Some plan assignments may have failed.",
        variant: "destructive",
      })
    } finally {
      setBulkAssigning(false)
    }
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
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
        return "bg-green-100 text-green-800"
    }
  }

  const getPlanLimits = (planType: string) => {
    const plan = plans.find((p) => p.plan_type === planType)
    return plan || { max_media_files: 5, max_storage_bytes: 104857600, max_screens: 1 }
  }

  const exportUsers = () => {
    debugLogger.userAction("Export users", { userCount: filteredUsers.length })
    const csvContent = [
      ["Name", "Email", "Company", "Plan", "Media Files", "Storage Used", "Admin", "Created"],
      ...filteredUsers.map((user) => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.company || "",
        user.plan,
        user.mediaCount.toString(),
        formatBytes(user.storageUsed),
        user.isAdmin ? "Yes" : "No",
        new Date(user.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users-export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const createUser = async () => {
    debugLogger.userAction("Create user - START", newUser)

    // Clear previous validation errors
    setValidationErrors({})

    // Validate form
    if (!validateForm(newUser, validationErrors)) {
      debugLogger.userAction("Create user - VALIDATION FAILED", validationErrors)
      setValidationErrors({ ...validationErrors })
      return
    }

    // Additional validation for create (password required)
    if (!newUser.password?.trim()) {
      debugLogger.userAction("Create user - PASSWORD REQUIRED")
      setValidationErrors({ ...validationErrors, password: "Password is required" })
      return
    }

    try {
      debugLogger.stateChange("CreateUser", "Setting creating state", { creating: true })
      setCreatingUser(true)

      debugLogger.apiCall("POST", "/api/admin/users/create", newUser)
      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()
      debugLogger.apiResponse("/api/admin/users/create", response.ok, data)

      if (response.ok && data.success) {
        debugLogger.userAction("Create user - API SUCCESS", data.user)

        toast({
          title: "User Created",
          description: `User ${data.user.firstName} ${data.user.lastName} created successfully.`,
        })

        // Reset form
        debugLogger.stateChange("CreateUser", "Resetting form")
        resetCreateForm()

        // EXACT MEDIA PATTERN - NOT ASYNC!
        debugLogger.userAction("Create user - CALLING HANDLER (MEDIA PATTERN)")
        handleUserCreated() // NOT AWAITED - EXACT MEDIA PATTERN

        debugLogger.userAction("Create user - COMPLETE SUCCESS")
      } else {
        debugLogger.userAction("Create user - API ERROR", data)
        console.error("API error:", data)

        // Check if it's a duplicate email error
        if (data.message && data.message.toLowerCase().includes("already exists")) {
          setValidationErrors({ email: data.message })
        } else {
          toast({
            title: "Creation Failed",
            description: data.message || "Failed to create user",
            variant: "destructive",
          })
        }
        return
      }
    } catch (err) {
      debugLogger.userAction("Create user - NETWORK ERROR", { error: err.message })
      console.error("Network error:", err)
      toast({
        title: "Creation Failed",
        description: "Network error: Failed to create user",
        variant: "destructive",
      })
    } finally {
      debugLogger.stateChange("CreateUser", "Setting creating state", { creating: false })
      setCreatingUser(false)
    }
  }

  const openEditDialog = (user: User) => {
    debugLogger.userAction("Open edit dialog", { userId: user.id, userName: `${user.firstName} ${user.lastName}` })
    setEditingUser(user)
    setEditUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      company: user.company || "",
      plan: user.plan,
      password: "",
      isAdmin: user.isAdmin,
    })
    setEditValidationErrors({})
    setShowEditPassword(false)
    setEditUserDialogOpen(true)
  }

  const updateUser = async () => {
    debugLogger.userAction("Update user - START", { userId: editingUser?.id, data: editUser })

    // Clear previous validation errors
    setEditValidationErrors({})

    // Validate form
    if (!validateForm(editUser, editValidationErrors)) {
      debugLogger.userAction("Update user - VALIDATION FAILED", editValidationErrors)
      setEditValidationErrors({ ...editValidationErrors })
      return
    }

    try {
      debugLogger.stateChange("EditUser", "Setting updating state", { updating: true })
      setUpdatingUserEdit(true)

      debugLogger.apiCall("PUT", `/api/admin/users/${editingUser?.id}/edit`, editUser)
      const response = await fetch(`/api/admin/users/${editingUser?.id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editUser),
      })

      const data = await response.json()
      debugLogger.apiResponse(`/api/admin/users/${editingUser?.id}/edit`, response.ok, data)

      if (response.ok && data.success) {
        debugLogger.userAction("Update user - API SUCCESS", data.user)

        toast({
          title: "User Updated",
          description: `User ${data.user.firstName} ${data.user.lastName} updated successfully.`,
        })

        // Reset form
        debugLogger.stateChange("EditUser", "Resetting form")
        resetEditForm()

        // EXACT MEDIA PATTERN - NOT ASYNC!
        debugLogger.userAction("Update user - CALLING HANDLER (MEDIA PATTERN)")
        handleUserUpdated() // NOT AWAITED - EXACT MEDIA PATTERN

        debugLogger.userAction("Update user - COMPLETE SUCCESS")
      } else {
        debugLogger.userAction("Update user - API ERROR", data)
        console.error("Edit API error:", data)

        // Check if it's a duplicate email error
        if (data.message && data.message.toLowerCase().includes("already in use")) {
          setEditValidationErrors({ email: data.message })
        } else {
          toast({
            title: "Update Failed",
            description: data.message || "Failed to update user",
            variant: "destructive",
          })
        }
        return
      }
    } catch (err) {
      debugLogger.userAction("Update user - NETWORK ERROR", { error: err.message })
      console.error("Edit Network error:", err)
      toast({
        title: "Update Failed",
        description: "Network error: Failed to update user",
        variant: "destructive",
      })
    } finally {
      debugLogger.stateChange("EditUser", "Setting updating state", { updating: false })
      setUpdatingUserEdit(false)
    }
  }

  const resetCreateForm = () => {
    debugLogger.stateChange("CreateUser", "Form reset")
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      plan: "",
      password: "",
      isAdmin: false,
    })
    setValidationErrors({})
    setShowPassword(false)
  }

  const resetEditForm = () => {
    debugLogger.stateChange("EditUser", "Form reset")
    setEditUser({
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      plan: "",
      password: "",
      isAdmin: false,
    })
    setEditValidationErrors({})
    setShowEditPassword(false)
    setEditingUser(null)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
        <DebugPanel />
        <DebugAPIComparison />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadUsers} variant="outline">
            Try Again
          </Button>
        </div>
        <DebugPanel />
        <DebugAPIComparison />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">User Management</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={exportUsers} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                debugLogger.userAction("Open create user dialog")
                setCreateUserDialogOpen(true)
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>

            {/* Create User Dialog */}
            <Dialog
              open={createUserDialogOpen}
              onOpenChange={(open) => {
                debugLogger.stateChange("CreateDialog", `Dialog ${open ? "opening" : "closing"}`)
                setCreateUserDialogOpen(open)
              }}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the system and assign them a plan.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newUser.firstName}
                        onChange={(e) => {
                          setNewUser((prev) => ({ ...prev, firstName: e.target.value }))
                          if (validationErrors.firstName) {
                            setValidationErrors((prev) => ({ ...prev, firstName: undefined }))
                          }
                        }}
                        placeholder="John"
                        className={validationErrors.firstName ? "border-red-500" : ""}
                      />
                      {validationErrors.firstName && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.firstName}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newUser.lastName}
                        onChange={(e) => {
                          setNewUser((prev) => ({ ...prev, lastName: e.target.value }))
                          if (validationErrors.lastName) {
                            setValidationErrors((prev) => ({ ...prev, lastName: undefined }))
                          }
                        }}
                        placeholder="Doe"
                        className={validationErrors.lastName ? "border-red-500" : ""}
                      />
                      {validationErrors.lastName && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => {
                        setNewUser((prev) => ({ ...prev, email: e.target.value }))
                        if (validationErrors.email) {
                          setValidationErrors((prev) => ({ ...prev, email: undefined }))
                        }
                      }}
                      placeholder="john@example.com"
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <div className="flex items-center mt-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.email}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newUser.company}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => {
                          setNewUser((prev) => ({ ...prev, password: e.target.value }))
                          if (validationErrors.password) {
                            setValidationErrors((prev) => ({ ...prev, password: undefined }))
                          }
                        }}
                        placeholder="Minimum 6 characters"
                        className={validationErrors.password ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {validationErrors.password && (
                      <div className="flex items-center mt-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.password}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="plan">Plan *</Label>
                    <Select
                      value={newUser.plan}
                      onValueChange={(value) => {
                        setNewUser((prev) => ({ ...prev, plan: value }))
                        if (validationErrors.plan) {
                          setValidationErrors((prev) => ({ ...prev, plan: undefined }))
                        }
                      }}
                    >
                      <SelectTrigger className={validationErrors.plan ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans
                          .filter((plan) => plan.is_active)
                          .map((plan) => (
                            <SelectItem key={plan.plan_type} value={plan.plan_type}>
                              {plan.name} - ${plan.price_monthly}/month
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.plan && (
                      <div className="flex items-center mt-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {validationErrors.plan}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isAdmin"
                      checked={newUser.isAdmin}
                      onCheckedChange={(checked) => setNewUser((prev) => ({ ...prev, isAdmin: !!checked }))}
                    />
                    <Label htmlFor="isAdmin">Make this user an administrator</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      debugLogger.userAction("Cancel create user")
                      setCreateUserDialogOpen(false)
                      resetCreateForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createUser} disabled={creatingUser}>
                    {creatingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog
              open={editUserDialogOpen}
              onOpenChange={(open) => {
                debugLogger.stateChange("EditDialog", `Dialog ${open ? "opening" : "closing"}`)
                setEditUserDialogOpen(open)
              }}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information and settings for {editingUser?.firstName} {editingUser?.lastName}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editFirstName">First Name *</Label>
                      <Input
                        id="editFirstName"
                        value={editUser.firstName}
                        onChange={(e) => {
                          setEditUser((prev) => ({ ...prev, firstName: e.target.value }))
                          if (editValidationErrors.firstName) {
                            setEditValidationErrors((prev) => ({ ...prev, firstName: undefined }))
                          }
                        }}
                        placeholder="John"
                        className={editValidationErrors.firstName ? "border-red-500" : ""}
                      />
                      {editValidationErrors.firstName && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {editValidationErrors.firstName}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="editLastName">Last Name *</Label>
                      <Input
                        id="editLastName"
                        value={editUser.lastName}
                        onChange={(e) => {
                          setEditUser((prev) => ({ ...prev, lastName: e.target.value }))
                          if (editValidationErrors.lastName) {
                            setEditValidationErrors((prev) => ({ ...prev, lastName: undefined }))
                          }
                        }}
                        placeholder="Doe"
                        className={editValidationErrors.lastName ? "border-red-500" : ""}
                      />
                      {editValidationErrors.lastName && (
                        <div className="flex items-center mt-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {editValidationErrors.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editEmail">Email *</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editUser.email}
                      onChange={(e) => {
                        setEditUser((prev) => ({ ...prev, email: e.target.value }))
                        if (editValidationErrors.email) {
                          setEditValidationErrors((prev) => ({ ...prev, email: undefined }))
                        }
                      }}
                      placeholder="john@example.com"
                      className={editValidationErrors.email ? "border-red-500" : ""}
                    />
                    {editValidationErrors.email && (
                      <div className="flex items-center mt-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editValidationErrors.email}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="editCompany">Company</Label>
                    <Input
                      id="editCompany"
                      value={editUser.company}
                      onChange={(e) => setEditUser((prev) => ({ ...prev, company: e.target.value }))}
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPassword">Password (leave blank to keep current)</Label>
                    <div className="relative">
                      <Input
                        id="editPassword"
                        type={showEditPassword ? "text" : "password"}
                        value={editUser.password}
                        onChange={(e) => {
                          setEditUser((prev) => ({ ...prev, password: e.target.value }))
                          if (editValidationErrors.password) {
                            setEditValidationErrors((prev) => ({ ...prev, password: undefined }))
                          }
                        }}
                        placeholder="New password (optional)"
                        className={editValidationErrors.password ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                      >
                        {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {editValidationErrors.password && (
                      <div className="flex items-center mt-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editValidationErrors.password}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="editPlan">Plan *</Label>
                    <Select
                      value={editUser.plan}
                      onValueChange={(value) => {
                        setEditUser((prev) => ({ ...prev, plan: value }))
                        if (editValidationErrors.plan) {
                          setEditValidationErrors((prev) => ({ ...prev, plan: undefined }))
                        }
                      }}
                    >
                      <SelectTrigger className={editValidationErrors.plan ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans
                          .filter((plan) => plan.is_active)
                          .map((plan) => (
                            <SelectItem key={plan.plan_type} value={plan.plan_type}>
                              {plan.name} - ${plan.price_monthly}/month
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {editValidationErrors.plan && (
                      <div className="flex items-center mt-1 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editValidationErrors.plan}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="editIsAdmin"
                      checked={editUser.isAdmin}
                      onCheckedChange={(checked) => setEditUser((prev) => ({ ...prev, isAdmin: !!checked }))}
                    />
                    <Label htmlFor="editIsAdmin">Administrator privileges</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      debugLogger.userAction("Cancel edit user")
                      setEditUserDialogOpen(false)
                      resetEditForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={updateUser} disabled={updatingUserEdit}>
                    {updatingUserEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {selectedUsers.length > 0 && (
              <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Plans ({selectedUsers.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Plan Assignment</DialogTitle>
                    <DialogDescription>
                      Assign a plan to {selectedUsers.length} selected user{selectedUsers.length > 1 ? "s" : ""}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-plan">Select Plan</Label>
                      <Select value={bulkAssignPlan} onValueChange={setBulkAssignPlan}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans
                            .filter((plan) => plan.is_active)
                            .map((plan) => (
                              <SelectItem key={plan.plan_type} value={plan.plan_type}>
                                {plan.name} - ${plan.price_monthly}/month
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkAssignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkAssign} disabled={!bulkAssignPlan || bulkAssigning}>
                      {bulkAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Assign Plans
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedPlanFilter} onValueChange={setSelectedPlanFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.plan_type} value={plan.plan_type}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedUsers.length} selected</p>
              )}
            </CardContent>
          </Card>
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{plan.name} Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.filter((u) => u.plan === plan.plan_type).length}</div>
                <p className="text-xs text-muted-foreground">${plan.price_monthly}/month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and assign subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Current Plan</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Assign Plan</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const limits = getPlanLimits(user.plan)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </TableCell>
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
                            Files: {user.mediaCount}/{formatNumber(limits.max_media_files)}
                          </div>
                          <div>
                            Storage: {formatBytes(user.storageUsed)}/{formatBytes(limits.max_storage_bytes)}
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
                            {updatingUser === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                          </SelectTrigger>
                          <SelectContent>
                            {plans
                              .filter((plan) => plan.is_active)
                              .map((plan) => (
                                <SelectItem key={plan.plan_type} value={plan.plan_type}>
                                  {plan.name} - ${plan.price_monthly}/mo
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    <strong>
                                      {user.firstName} {user.lastName}
                                    </strong>
                                    ?
                                    <br />
                                    <br />
                                    This will permanently delete:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                      <li>User account and profile</li>
                                      <li>All media files ({user.mediaCount} files)</li>
                                      <li>All playlists and devices</li>
                                      <li>All associated data</li>
                                    </ul>
                                    <br />
                                    <strong>This action cannot be undone.</strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deletingUser === user.id}
                                  >
                                    {deletingUser === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <DebugPanel />
      <DebugAPIComparison />
    </DashboardLayout>
  )
}
