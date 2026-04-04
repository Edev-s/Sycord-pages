import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const VPS_BASE_URL =
  process.env.VPS_SERVER_URL || "https://server.sycord.site"

/**
 * Proxy deployment logs from the VPS server so the browser never
 * needs to make a cross-origin request directly.
 *
 * GET /api/logs?project_id=<id>&limit=<n>
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("project_id")
  const limit = searchParams.get("limit") || "200"

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing project_id query parameter" },
      { status: 400 },
    )
  }

  try {
    const vpsEndpoint = `${VPS_BASE_URL}/api/logs?project_id=${encodeURIComponent(projectId)}&limit=${encodeURIComponent(limit)}`
    console.log(`[Logs Proxy] Fetching: ${vpsEndpoint}`)

    const res = await fetch(vpsEndpoint)
    const data = await res.json()

    console.log(`[Logs Proxy] VPS responded ${res.status}, success=${data.success}, logCount=${data.logs?.length ?? 0}`)

    return NextResponse.json(data, { status: res.status })
  } catch (e: any) {
    console.error("[Logs Proxy] Failed to reach VPS:", e)
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs from deployment server" },
      { status: 502 },
    )
  }
}
