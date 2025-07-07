import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { deviceId: string } }) {
  try {
    const deviceId = params.deviceId
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Invalid device credentials" }, { status: 401 })
    }

    // Demo validation - accept any device ID with proper auth header
    return NextResponse.json({
      success: true,
      device: {
        id: deviceId,
        screenName: "Demo Screen",
        status: "online",
        lastSeen: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
