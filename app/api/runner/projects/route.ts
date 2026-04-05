import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/is-admin"

const VPS_BASE_URL =
  process.env.VPS_SERVER_URL || "https://server.sycord.site"

/**
 * Proxy the VPS projects list endpoint so the admin panel can see all
 * projects that are actually deployed on disk.
 *
 * GET /api/runner/projects
 */
export async function GET() {
  try {
    await requireAdmin()

    const res = await fetch(`${VPS_BASE_URL}/api/projects`, {
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "VPS projects endpoint returned " + res.status },
        { status: 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Runner Projects] Error:", error)
    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to reach VPS projects endpoint" },
      { status: 502 },
    )
  }
}
