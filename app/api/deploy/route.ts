import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

/**
 * VPS Flask server base URL.
 * The Flask app runs on a VPS behind a Cloudflare Tunnel, serving deployed
 * sites via subdomain detection.
 */
const VPS_BASE_URL =
  process.env.VPS_SERVER_URL || "https://server.sycord.com"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId } = await request.json()
    if (!projectId)
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

    const client = await clientPromise
    const db = client.db()

    // 1. Project Data
    const userDoc = await db.collection("users").findOne({ id: session.user.id })
    const project = userDoc?.projects?.find(
      (p: any) => p._id.toString() === projectId,
    )
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })

    // 2. Derive a subdomain from the project
    const subdomain =
      project.subdomain ||
      project.businessName
        ?.toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "") ||
      `project-${projectId}`

    // 3. Prepare Files
    const pages = project.pages || []
    const files: { path: string; content: string }[] = []

    if (pages.length > 0) {
      for (const page of pages) {
        let path = page.name
        if (path.startsWith("/")) path = path.substring(1)
        files.push({ path, content: page.content })
      }
    } else if (project.aiGeneratedCode) {
      files.push({ path: "index.html", content: project.aiGeneratedCode })
    }

    if (files.length === 0)
      return NextResponse.json({ error: "No files to deploy." }, { status: 400 })

    // 4. Deploy to VPS Flask server
    console.log(`[Deploy] Sending ${files.length} file(s) to VPS for project ${projectId}…`)
    const deployRes = await fetch(`${VPS_BASE_URL}/api/deploy/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, subdomain }),
    })

    if (!deployRes.ok) {
      const errBody = await deployRes.json().catch(() => ({}))
      throw new Error(errBody.error || `VPS deploy failed (HTTP ${deployRes.status})`)
    }

    const deployData = await deployRes.json()
    const deployedDomain = deployData.domain
      ? `https://${deployData.domain}`
      : null

    // 5. Persist deployment metadata in MongoDB
    await db.collection("users").updateOne(
      { id: session.user.id, "projects._id": new ObjectId(projectId) },
      {
        $set: {
          "projects.$.subdomain": subdomain,
          "projects.$.deployedAt": new Date(),
          "projects.$.cloudflareUrl": deployedDomain,
          "projects.$.vpsProjectId": projectId,
        },
      },
    )

    console.log(`[Deploy] Project ${projectId} deployed → ${deployedDomain ?? "pending"}`)

    return NextResponse.json({
      success: true,
      url: deployedDomain,
      cloudflareUrl: deployedDomain,
      filesCount: files.length,
      message: deployedDomain
        ? "Deployed to VPS!"
        : "Deployed – domain will be available shortly.",
      projectId,
    })
  } catch (error: any) {
    console.error("[Deploy] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
