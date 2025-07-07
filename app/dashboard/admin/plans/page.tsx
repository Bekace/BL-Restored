"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, DollarSign, HardDrive, Monitor, FileImage, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardLayout } from "@/components/dashboard-layout"
import { formatBytes, formatNumber } from "@/lib/plans"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: number
  plan_type: string
  name: string
  description: string
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
  price_yearly: number
  features: string[]
  is_active: boolean
  sort_order: number
  subscriber_count: number
  created_at: string
  updated_at: string
}

interface Feature {
  id: number
  feature_name: string
  description: string
  category: string
  is_active: boolean
}

const defaultPlan: Omit<Plan, "id" | "created_at" | "updated_at" | "subscriber_count"> = {
  plan_type: "custom",
  name: "",
  description: "",
  max_media_files: 5,
  max_storage_bytes: 104857600, // 100MB
  max_screens: 1,
  price_monthly: 0,
  price_yearly: 0,
  features: [],
  is_active: true,
  sort_order: 0,
}

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newPlan, setNewPlan] =
    useState<Omit<Plan, "id" | "created_at" | "updated_at" | "subscriber_count">>(defaultPlan)
  const { toast } = useToast()

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/plans")
      const data = await response.json()

      if (response.ok) {
        setPlans(data.plans || [])
        setError(null)
      } else {
        setError(data.message || "Failed to load plans")
        toast({
          title: "Error",
          description: data.message || "Failed to load plans",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Failed to load plans")
      console.error("Error loading plans:", err)
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFeatures = async () => {
    try {
      const response = await fetch("/api/admin/features")
      const data = await response.json()

      if (response.ok) {
        setFeatures(data.features || [])
      }
    } catch (err) {
      console.error("Error loading features:", err)
    }
  }

  useEffect(() => {
    loadPlans()
    loadFeatures()
  }, [])

  const validatePlan = (plan: Omit<Plan, "id" | "created_at" | "updated_at" | "subscriber_count">): string | null => {
    if (!plan.plan_type.trim()) return "Plan type is required"
    if (!plan.name.trim()) return "Plan name is required"
    if (!plan.description.trim()) return "Plan description is required"
    if (plan.max_media_files < -1) return "Media files limit must be -1 (unlimited) or positive"
    if (plan.max_storage_bytes < -1) return "Storage limit must be -1 (unlimited) or positive"
    if (plan.max_screens < -1) return "Screens limit must be -1 (unlimited) or positive"
    if (plan.price_monthly < 0) return "Monthly price cannot be negative"
    if (plan.price_yearly < 0) return "Yearly price cannot be negative"
    return null
  }

  const handleCreatePlan = async () => {
    console.log("Creating plan:", newPlan)

    const validationError = validatePlan(newPlan)
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlan),
      })

      const data = await response.json()
      console.log("Create plan response:", data)

      if (response.ok) {
        setPlans([...plans, data.plan])
        setIsCreateDialogOpen(false)
        setNewPlan(defaultPlan)
        toast({
          title: "Success",
          description: "Plan created successfully",
        })
      } else {
        setError(data.message || "Failed to create plan")
        toast({
          title: "Error",
          description: data.message || "Failed to create plan",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error creating plan:", err)
      setError("Failed to create plan")
      toast({
        title: "Error",
        description: "Failed to create plan",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan })
    setIsEditDialogOpen(true)
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return

    const validationError = validatePlan(editingPlan)
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    try {
      setUpdating(editingPlan.id)
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingPlan),
      })

      const data = await response.json()

      if (response.ok) {
        setPlans(plans.map((plan) => (plan.id === editingPlan.id ? data.plan : plan)))
        setEditingPlan(null)
        setIsEditDialogOpen(false)
        toast({
          title: "Success",
          description: "Plan updated successfully",
        })
      } else {
        setError(data.message || "Failed to update plan")
        toast({
          title: "Error",
          description: data.message || "Failed to update plan",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Failed to update plan")
      console.error("Error updating plan:", err)
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleDeletePlan = async (planId: number) => {
    const plan = plans.find((p) => p.id === planId)

    if (plan && plan.subscriber_count > 0) {
      toast({
        title: "Cannot Delete Plan",
        description: `This plan has ${plan.subscriber_count} active subscribers. Please migrate users to another plan first.`,
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to delete this plan? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        setPlans(plans.filter((plan) => plan.id !== planId))
        toast({
          title: "Success",
          description: "Plan deleted successfully",
        })
      } else {
        setError(data.message || "Failed to delete plan")
        toast({
          title: "Error",
          description: data.message || "Failed to delete plan",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("Failed to delete plan")
      console.error("Error deleting plan:", err)
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive",
      })
    }
  }

  const formatStorageInput = (bytes: number): string => {
    if (bytes === -1) return ""
    return (bytes / (1024 * 1024)).toString() // Convert to MB
  }

  const parseStorageInput = (value: string): number => {
    if (!value || value.toLowerCase() === "unlimited") return -1
    const mb = Number.parseFloat(value)
    return isNaN(mb) ? 0 : mb * 1024 * 1024 // Convert MB to bytes
  }

  const parseNumberInput = (value: string): number => {
    if (!value || value.toLowerCase() === "unlimited") return -1
    const num = Number.parseInt(value)
    return isNaN(num) ? 0 : num
  }

  const PlanForm = ({ plan, setPlan, isEdit = false }: { plan: any; setPlan: any; isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plan_type">Plan Type *</Label>
          <Input
            id="plan_type"
            value={plan.plan_type}
            onChange={(e) => setPlan({ ...plan, plan_type: e.target.value })}
            placeholder="e.g., premium"
            required
            disabled={isEdit} // Don't allow changing plan_type for existing plans
          />
          {isEdit && <p className="text-xs text-muted-foreground mt-1">Plan type cannot be changed</p>}
        </div>
        <div>
          <Label htmlFor="name">Plan Name *</Label>
          <Input
            id="name"
            value={plan.name}
            onChange={(e) => setPlan({ ...plan, name: e.target.value })}
            placeholder="e.g., Premium Plan"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={plan.description}
          onChange={(e) => setPlan({ ...plan, description: e.target.value })}
          placeholder="Plan description..."
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="max_media_files">Media Files Limit</Label>
          <Input
            id="max_media_files"
            value={plan.max_media_files === -1 ? "" : plan.max_media_files}
            onChange={(e) => setPlan({ ...plan, max_media_files: parseNumberInput(e.target.value) })}
            placeholder="5 or 'unlimited'"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
        </div>
        <div>
          <Label htmlFor="max_storage">Storage Limit (MB)</Label>
          <Input
            id="max_storage"
            value={formatStorageInput(plan.max_storage_bytes)}
            onChange={(e) => setPlan({ ...plan, max_storage_bytes: parseStorageInput(e.target.value) })}
            placeholder="100 or 'unlimited'"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
        </div>
        <div>
          <Label htmlFor="max_screens">Screens Limit</Label>
          <Input
            id="max_screens"
            value={plan.max_screens === -1 ? "" : plan.max_screens}
            onChange={(e) => setPlan({ ...plan, max_screens: parseNumberInput(e.target.value) })}
            placeholder="1 or 'unlimited'"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_monthly">Monthly Price ($)</Label>
          <Input
            id="price_monthly"
            type="number"
            step="0.01"
            min="0"
            value={plan.price_monthly}
            onChange={(e) => setPlan({ ...plan, price_monthly: Number.parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="price_yearly">Yearly Price ($)</Label>
          <Input
            id="price_yearly"
            type="number"
            step="0.01"
            min="0"
            value={plan.price_yearly}
            onChange={(e) => setPlan({ ...plan, price_yearly: Number.parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="sort_order">Sort Order</Label>
        <Input
          id="sort_order"
          type="number"
          min="0"
          value={plan.sort_order}
          onChange={(e) => setPlan({ ...plan, sort_order: Number.parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>
      {features.length > 0 && (
        <div>
          <Label>Features</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature.id}`}
                  checked={plan.features.includes(feature.feature_name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPlan({ ...plan, features: [...plan.features, feature.feature_name] })
                    } else {
                      setPlan({
                        ...plan,
                        features: plan.features.filter((f: string) => f !== feature.feature_name),
                      })
                    }
                  }}
                />
                <Label htmlFor={`feature-${feature.id}`} className="text-sm">
                  {feature.feature_name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={plan.is_active}
          onCheckedChange={(checked) => setPlan({ ...plan, is_active: checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </div>
  )

  const totalSubscribers = plans.reduce((sum, plan) => sum + plan.subscriber_count, 0)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">Loading plans...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plan Management</h1>
            <p className="text-muted-foreground">Manage subscription plans and pricing</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Plan</DialogTitle>
                <DialogDescription>Create a new subscription plan with custom limits and pricing</DialogDescription>
              </DialogHeader>
              <PlanForm plan={newPlan} setPlan={setNewPlan} />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan} disabled={creating}>
                  {creating ? "Creating..." : "Create Plan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Plan Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>Modify the plan limits, pricing, and features</DialogDescription>
            </DialogHeader>
            {editingPlan && <PlanForm plan={editingPlan} setPlan={setEditingPlan} isEdit={true} />}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingPlan(null)
                }}
                disabled={updating !== null}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdatePlan} disabled={updating !== null}>
                {updating !== null ? "Updating..." : "Update Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Plans Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.filter((p) => p.is_active).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubscribers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(plans.reduce((sum, p) => sum + p.price_monthly, 0) / plans.length || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
            <CardDescription>
              Manage your subscription plans. The subscriber count shows how many users are currently on each plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No plans created yet. Create your first plan to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">{plan.description}</div>
                          <Badge variant="outline" className="mt-1">
                            {plan.plan_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <FileImage className="h-3 w-3 mr-1" />
                            {formatNumber(plan.max_media_files)} files
                          </div>
                          <div className="flex items-center">
                            <HardDrive className="h-3 w-3 mr-1" />
                            {formatBytes(plan.max_storage_bytes)}
                          </div>
                          <div className="flex items-center">
                            <Monitor className="h-3 w-3 mr-1" />
                            {formatNumber(plan.max_screens)} screens
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>${plan.price_monthly}/month</div>
                          <div className="text-muted-foreground">${plan.price_yearly}/year</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {plan.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{plan.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{plan.subscriber_count}</span>
                          {plan.subscriber_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlan(plan)}
                            disabled={updating === plan.id}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600 hover:text-red-700"
                            disabled={plan.subscriber_count > 0}
                            title={
                              plan.subscriber_count > 0 ? "Cannot delete plan with active subscribers" : "Delete plan"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
