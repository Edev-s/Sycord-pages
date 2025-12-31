import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Accept projectId (legacy) or repoId and prefer the GitHub repository id when available.
    const { projectId, repoId } = body

    if (!projectId && !repoId) {
      return NextResponse.json({ error: "Missing projectId or repoId" }, { status: 400 })
    }

    let repoIdString = repoId ? String(repoId) : undefined

    if (!repoIdString && projectId) {
      let projectObjectId: ObjectId
      try {
        projectObjectId = new ObjectId(projectId)
      } catch {
        return NextResponse.json(
          { error: "Invalid projectId format" },
          { status: 400 },
        )
      }

      try {
        const client = await clientPromise
        const db = client.db()
        const project = await db.collection("projects").findOne({ _id: projectObjectId })
        if (project?.githubRepoId) {
          repoIdString = String(project.githubRepoId)
        } else {
          return NextResponse.json(
            { error: "Project is missing a linked GitHub repoId" },
            { status: 400 },
          )
        }
      } catch (err) {
        const safeProjectId = projectId ? `${String(projectId).slice(0, 6)}...` : "unknown"
        console.error(
          "[External Deploy] Failed to resolve repository for projectId",
          safeProjectId,
          ":",
          (err as Error)?.message,
        )
        return NextResponse.json(
          { error: "Failed to resolve repository ID from projectId. Ensure the project has a linked GitHub repository." },
          { status: 500 },
        )
      }
    }

    if (!repoIdString) {
      return NextResponse.json({ error: "Missing repoId for deployment" }, { status: 400 })
    }

    console.log(
      `[External Deploy] Triggering deployment for repo id: ${repoIdString}${
        projectId ? ` (project: ${projectId})` : ""
      }`,
    )

    const payload: Record<string, any> = { repo_id: repoIdString }
    if (projectId) {
      payload.project_id = projectId
    }

    const response = await fetch("https://micro1.sycord.com/api/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // The external API expects the GitHub repository id
      body: JSON.stringify(payload),
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
