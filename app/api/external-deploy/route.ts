import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // The user requested to use the database _id (Project ID) for the API, not the repository ID.
    // We expect projectId in the body.
    const { projectId, repoId } = body

    if (!projectId && !repoId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    // Prioritize projectId if available, otherwise fallback to repoId (though the instruction says use _id)
    const idToUse = projectId || repoId
    const repoIdString = String(idToUse)

    console.log(`[External Deploy] Triggering deployment for id: ${repoIdString}`)

    const response = await fetch("https://micro1.sycord.com/api/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // The external API expects "repo_id" but we are sending the Project ID as per user instruction
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
