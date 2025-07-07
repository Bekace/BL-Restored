import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const sql = getDb()

    // Get table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'media_files'
      ORDER BY ordinal_position
    `

    return NextResponse.json({
      table: "media_files",
      columns: columns,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to get table structure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
