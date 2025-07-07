import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
    },
    steps: [],
  }

  try {
    // Step 1: Database connection
    debugInfo.steps.push("1. Testing database connection...")
    const sql = getDb()
    const dbTest = await sql`SELECT 1 as test`
    debugInfo.steps.push("✅ Database connection successful")
    debugInfo.dbTest = dbTest

    // Step 2: Check tables exist
    debugInfo.steps.push("2. Checking required tables...")
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('users', 'plan_templates', 'media_files', 'screens')
      ORDER BY table_name
    `
    debugInfo.tables = tables
    debugInfo.steps.push(`✅ Found ${tables.length} tables: ${tables.map((t) => t.table_name).join(", ")}`)

    // Step 3: Check plan templates
    debugInfo.steps.push("3. Checking plan templates...")
    const planTemplates = await sql`
      SELECT plan_type, name, is_active, max_media_files, max_storage_bytes, max_screens
      FROM plan_templates 
      ORDER BY plan_type
    `
    debugInfo.planTemplates = planTemplates
    debugInfo.steps.push(`✅ Found ${planTemplates.length} plan templates`)

    // Step 4: Authentication test
    debugInfo.steps.push("4. Testing authentication...")
    try {
      const user = await getCurrentUser()
      if (user) {
        debugInfo.steps.push(`✅ User authenticated: ${user.email}`)
        debugInfo.user = { id: user.id, email: user.email, plan: user.plan }

        // Step 5: User data check
        debugInfo.steps.push("5. Checking user data...")
        const userData = await sql`
          SELECT id, email, plan_type, media_files_count, storage_used_bytes
          FROM users 
          WHERE id = ${user.id}
        `
        debugInfo.userData = userData[0]
        debugInfo.steps.push("✅ User data retrieved")
      } else {
        debugInfo.steps.push("❌ No user authenticated")
      }
    } catch (authError) {
      debugInfo.steps.push(`❌ Authentication error: ${authError instanceof Error ? authError.message : "Unknown"}`)
      debugInfo.authError = authError instanceof Error ? authError.message : String(authError)
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    debugInfo.steps.push(`❌ Fatal error: ${error instanceof Error ? error.message : "Unknown"}`)
    debugInfo.fatalError = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }

    return NextResponse.json(
      {
        success: false,
        debug: debugInfo,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
