import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { companyName, companyAddress, companyPhone } = body

    // Validate input
    if (!companyName || companyName.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Company name is required" }, { status: 400 })
    }

    if (companyName.length > 100) {
      return NextResponse.json(
        { success: false, message: "Company name must be less than 100 characters" },
        { status: 400 },
      )
    }

    if (companyAddress && companyAddress.length > 200) {
      return NextResponse.json({ success: false, message: "Address must be less than 200 characters" }, { status: 400 })
    }

    if (companyPhone && companyPhone.length > 20) {
      return NextResponse.json(
        { success: false, message: "Phone number must be less than 20 characters" },
        { status: 400 },
      )
    }

    const sql = getDb()

    // Update user's company information
    await sql`
      UPDATE users 
      SET 
        company = ${companyName.trim()},
        company_address = ${companyAddress?.trim() || null},
        company_phone = ${companyPhone?.trim() || null},
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Company information updated successfully",
      data: {
        companyName: companyName.trim(),
        companyAddress: companyAddress?.trim() || null,
        companyPhone: companyPhone?.trim() || null,
      },
    })
  } catch (error) {
    console.error("Company update error:", error)
    return NextResponse.json({ success: false, message: "Failed to update company information" }, { status: 500 })
  }
}
