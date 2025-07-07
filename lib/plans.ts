export interface PlanLimits {
  plan_type: string
  max_media_files: number
  max_storage_bytes: number
  max_screens: number
  price_monthly: number
  features: string[]
}

export interface UserUsage {
  media_files_count: number
  storage_used_bytes: number
  screens_count: number
  plan_type: string
}

export const PLAN_NAMES = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
} as const

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  if (bytes === -1) return "Unlimited"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatNumber(num: number): string {
  if (num === -1) return "Unlimited"
  return num.toLocaleString()
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0 // Unlimited
  return Math.min((used / limit) * 100, 100)
}

export function canUploadFile(
  currentUsage: UserUsage,
  planLimits: PlanLimits,
  fileSize: number,
): { allowed: boolean; reason?: string } {
  // Check file count limit
  if (planLimits.max_media_files !== -1 && currentUsage.media_files_count >= planLimits.max_media_files) {
    return {
      allowed: false,
      reason: `You've reached your plan's limit of ${formatNumber(planLimits.max_media_files)} media files. Upgrade to upload more.`,
    }
  }

  // Check storage limit
  if (
    planLimits.max_storage_bytes !== -1 &&
    currentUsage.storage_used_bytes + fileSize > planLimits.max_storage_bytes
  ) {
    return {
      allowed: false,
      reason: `This file would exceed your storage limit of ${formatBytes(planLimits.max_storage_bytes)}. Upgrade for more storage.`,
    }
  }

  return { allowed: true }
}

// Remove hardcoded limits - now fetched from database
export async function getPlanLimits(planType: string): Promise<PlanLimits | null> {
  try {
    const response = await fetch(`/api/plans/${planType}`)
    if (response.ok) {
      const data = await response.json()
      return data.plan
    }
  } catch (error) {
    console.error("Error fetching plan limits:", error)
  }
  return null
}
