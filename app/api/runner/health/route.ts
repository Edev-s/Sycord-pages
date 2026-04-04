import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/is-admin"

const VPS_BASE_URL =
  process.env.VPS_SERVER_URL || "https://server.sycord.site"

/**
 * Proxy the VPS health endpoint so the admin panel can fetch resource
 * metrics (CPU, RAM, disk) without CORS issues.
 *
 * GET /api/runner/health
 */
export async function GET() {
  try {
    await requireAdmin()

    const res = await fetch(`${VPS_BASE_URL}/api/health?detailed=true`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "VPS health endpoint returned " + res.status },
        { status: 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Runner Health] Error:", error)
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to reach VPS health endpoint" },
      { status: 502 },
    )
  }
}
