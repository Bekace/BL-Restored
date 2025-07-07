import { create } from "zustand"

interface PlanData {
  usage: {
    media_files_count: number
    storage_used_bytes: number
    screens_count: number
    plan_type: string
  }
  limits: {
    plan_type: string
    max_media_files: number
    max_storage_bytes: number
    max_screens: number
    price_monthly: number
    features: string[]
  }
  plan_expires_at?: string
}

interface PlanStore {
  planData: PlanData | null
  lastUpdated: number
  setPlanData: (data: PlanData) => void
  triggerRefresh: () => void
  shouldRefresh: (threshold?: number) => boolean
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  planData: null,
  lastUpdated: 0,
  setPlanData: (data) => set({ planData: data, lastUpdated: Date.now() }),
  triggerRefresh: () => set({ lastUpdated: Date.now() }),
  shouldRefresh: (threshold = 5000) => {
    const { lastUpdated } = get()
    return Date.now() - lastUpdated > threshold
  },
}))
