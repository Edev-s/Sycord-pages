import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { repoId } = body

    if (!repoId) {
      return NextResponse.json({ error: "Missing repoId" }, { status: 400 })
    }

    // Ensure repoId is a string for the external API
    const repoIdString = String(repoId)

    console.log(`[External Deploy] Triggering deployment for repoId: ${repoIdString}`)

    // Send only the repo_id to the external deploy service
    const response = await fetch("https://micro1.sycord.com/api/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repo_id: repoIdString }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[External Deploy] Failed:", data)
      return NextResponse.json(
        { error: data.message || "External deployment failed", details: data },
        { status: response.status }
      )
    }

    console.log("[External Deploy] Success:", data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[External Deploy] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
