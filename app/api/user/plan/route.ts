import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [PLAN API] === STARTING PLAN FETCH ===")
    console.log("🔍 [PLAN API] Request URL:", request.url)
    console.log("🔍 [PLAN API] Environment check:", {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    })

    // Test database connection first
    let sql
    try {
      sql = getDb()
      console.log("✅ [PLAN API] Database connection established")
    } catch (dbError) {
      console.error("❌ [PLAN API] Database connection failed:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
          error: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    // Get current user with detailed error handling
    let user
    try {
      user = await getCurrentUser()
      console.log("🔍 [PLAN API] Current user:", user ? { id: user.id, email: user.email } : "NO USER")
    } catch (authError) {
      console.error("❌ [PLAN API] Authentication error:", authError)
      return NextResponse.json(
        {
          success: false,
          message: "Authentication failed",
          error: authError instanceof Error ? authError.message : "Unknown auth error",
        },
        { status: 500 },
      )
    }

    if (!user) {
      console.log("❌ [PLAN API] No user authenticated")
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    // Get user's current plan and usage with detailed logging
    console.log("🔍 [PLAN API] Querying user data for ID:", user.id)
    let userData
    try {
      userData = await sql`
        SELECT 
          id,
          email,
          plan_type,
          media_files_count,
          storage_used_bytes,
          created_at,
          updated_at
        FROM users 
        WHERE id = ${user.id}
      `
      console.log("📊 [PLAN API] User data query result:", userData)
    } catch (userQueryError) {
      console.error("❌ [PLAN API] User query failed:", userQueryError)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch user data",
          error: userQueryError instanceof Error ? userQueryError.message : "Unknown user query error",
        },
        { status: 500 },
      )
    }

    if (userData.length === 0) {
      console.log("❌ [PLAN API] User not found in database")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const userRecord = userData[0]
    console.log("✅ [PLAN API] User record found:", {
      id: userRecord.id,
      email: userRecord.email,
      plan_type: userRecord.plan_type,
      media_files_count: userRecord.media_files_count,
      storage_used_bytes: userRecord.storage_used_bytes,
    })

    // Get actual media count and storage from media table
    console.log("🔍 [PLAN API] Querying actual media data for user:", user.id)
    let actualMediaData
    try {
      actualMediaData = await sql`
        SELECT 
          COUNT(*) as actual_count,
          COALESCE(SUM(file_size), 0) as actual_storage
        FROM media_files 
        WHERE user_id = ${user.id} AND deleted_at IS NULL
      `
      console.log("📊 [PLAN API] Actual media data:", actualMediaData[0])
    } catch (mediaQueryError) {
      console.error("❌ [PLAN API] Media query failed:", mediaQueryError)
      // Continue with zeros if media table doesn't exist or has issues
      actualMediaData = [{ actual_count: 0, actual_storage: 0 }]
      console.log("⚠️ [PLAN API] Using fallback media data:", actualMediaData[0])
    }

    // Get screens count
    console.log("🔍 [PLAN API] Querying screens count for user:", user.id)
    let screensData
    try {
      screensData = await sql`
        SELECT COUNT(*) as screens_count
        FROM screens 
        WHERE user_id = ${user.id}
      `
      console.log("📊 [PLAN API] Screens data:", screensData[0])
    } catch (screensQueryError) {
      console.error("❌ [PLAN API] Screens query failed:", screensQueryError)
      // Continue with zero if screens table doesn't exist or has issues
      screensData = [{ screens_count: 0 }]
      console.log("⚠️ [PLAN API] Using fallback screens data:", screensData[0])
    }

    // Get plan limits from plan_templates table
    const userPlanType = userRecord.plan_type || "free"
    console.log("🔍 [PLAN API] Looking up plan template for plan_type:", userPlanType)

    let planLimits
    try {
      planLimits = await sql`
        SELECT 
          id,
          plan_type,
          name,
          max_media_files,
          max_storage_bytes,
          max_screens,
          price_monthly,
          price_yearly,
          features,
          is_active
        FROM plan_templates 
        WHERE plan_type = ${userPlanType} AND is_active = true
        LIMIT 1
      `
      console.log("📊 [PLAN API] Plan template query result:", planLimits)
    } catch (planQueryError) {
      console.error("❌ [PLAN API] Plan template query failed:", planQueryError)

      // Check if plan_templates table exists
      try {
        const tableCheck = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'plan_templates'
        `
        console.log("📊 [PLAN API] Plan templates table check:", tableCheck)

        if (tableCheck.length === 0) {
          console.log("❌ [PLAN API] plan_templates table does not exist")
          return NextResponse.json(
            {
              success: false,
              message: "Plan templates table not found. Please run database setup.",
              error: "Missing plan_templates table",
            },
            { status: 500 },
          )
        }
      } catch (tableCheckError) {
        console.error("❌ [PLAN API] Table check failed:", tableCheckError)
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch plan template",
          error: planQueryError instanceof Error ? planQueryError.message : "Unknown plan query error",
        },
        { status: 500 },
      )
    }

    if (planLimits.length === 0) {
      console.log("❌ [PLAN API] No active plan template found for:", userPlanType)
      console.log("🔍 [PLAN API] Checking all available plan templates...")

      try {
        const allPlans = await sql`
          SELECT plan_type, name, is_active FROM plan_templates ORDER BY plan_type
        `
        console.log("📊 [PLAN API] All available plans:", allPlans)

        return NextResponse.json(
          {
            success: false,
            message: `Plan template not found for plan type: ${userPlanType}`,
            debug: {
              user_plan_type: userPlanType,
              available_plans: allPlans,
            },
          },
          { status: 404 },
        )
      } catch (allPlansError) {
        console.error("❌ [PLAN API] Failed to fetch all plans:", allPlansError)
        return NextResponse.json(
          {
            success: false,
            message: `Plan template not found and unable to list available plans`,
            error: allPlansError instanceof Error ? allPlansError.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    const limits = planLimits[0]
    console.log("✅ [PLAN API] Plan template found:", {
      id: limits.id,
      plan_type: limits.plan_type,
      name: limits.name,
      max_media_files: limits.max_media_files,
      max_storage_bytes: limits.max_storage_bytes,
      max_screens: limits.max_screens,
      is_active: limits.is_active,
    })

    const actualMedia = actualMediaData[0]
    const screens = screensData[0]

    // Update user table if counts are out of sync
    const userTableMediaCount = Number(userRecord.media_files_count) || 0
    const userTableStorage = Number(userRecord.storage_used_bytes) || 0
    const actualMediaCount = Number(actualMedia.actual_count) || 0
    const actualStorageUsed = Number(actualMedia.actual_storage) || 0

    if (userTableMediaCount !== actualMediaCount || userTableStorage !== actualStorageUsed) {
      console.log(
        `🔄 [PLAN API] Syncing user data - Media: ${userTableMediaCount} → ${actualMediaCount}, Storage: ${userTableStorage} → ${actualStorageUsed}`,
      )

      try {
        await sql`
          UPDATE users 
          SET 
            media_files_count = ${actualMediaCount},
            storage_used_bytes = ${actualStorageUsed}
          WHERE id = ${user.id}
        `
        console.log("✅ [PLAN API] User data synced")
      } catch (updateError) {
        console.error("❌ [PLAN API] Failed to sync user data:", updateError)
        // Continue without failing the request
      }
    }

    const responseData = {
      usage: {
        media_files_count: actualMediaCount,
        storage_used_bytes: actualStorageUsed,
        screens_count: Number(screens.screens_count) || 0,
        plan_type: userRecord.plan_type,
      },
      limits: {
        id: limits.id,
        plan_type: limits.plan_type,
        name: limits.name,
        max_media_files: Number(limits.max_media_files),
        max_storage_bytes: Number(limits.max_storage_bytes),
        max_screens: Number(limits.max_screens),
        price_monthly: Number(limits.price_monthly),
        price_yearly: Number(limits.price_yearly),
        features: typeof limits.features === "string" ? JSON.parse(limits.features) : limits.features || [],
      },
      plan_expires_at: null,
      debug: {
        user_id: user.id,
        user_email: user.email,
        user_plan_type_from_db: userRecord.plan_type,
        plan_template_found: limits.plan_type,
        plan_template_name: limits.name,
        user_table_media_count: userTableMediaCount,
        actual_media_count: actualMediaCount,
        user_table_storage: userTableStorage.toString(),
        actual_storage: actualStorageUsed,
        timestamp: new Date().toISOString(),
      },
    }

    console.log(`📤 [PLAN API] === FINAL RESPONSE ===`)
    console.log(`📤 [PLAN API] User: ${user.email} (${user.id})`)
    console.log(`📤 [PLAN API] Plan Type: ${userRecord.plan_type}`)
    console.log(`📤 [PLAN API] Plan Name: ${limits.name}`)
    console.log(
      `📤 [PLAN API] Limits: ${limits.max_media_files} files, ${limits.max_storage_bytes} bytes, ${limits.max_screens} screens`,
    )
    console.log(`📤 [PLAN API] === END RESPONSE ===`)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ [PLAN API] UNEXPECTED ERROR:", error)
    console.error("❌ [PLAN API] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user plan data",
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      { status: 500 },
    )
  }
}
