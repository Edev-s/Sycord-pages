import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomain: string; path: string[] }> }
) {
  const { subdomain, path } = await params
  const rawFilename = path.join("/")
  // Normalize filename: remove leading slash
  const filename = rawFilename.replace(/^\//, "")

  try {
    const client = await clientPromise
    const db = client.db()

    // Find user with deployment matching the subdomain
    const userData = await db.collection("users").findOne({
      "user.deployments.subdomain": subdomain.toLowerCase()
    })

    if (!userData) {
      return new Response("Site Not Found", { status: 404 })
    }

    // Find the specific deployment
    const deployment = userData.user?.deployments?.find(
      (d: any) => d.subdomain === subdomain.toLowerCase()
    )

    if (!deployment) {
      return new Response("Site Not Found", { status: 404 })
    }

    // Find the project associated with this deployment
    const project = userData.user?.projects?.find(
      (p: any) => p._id.toString() === deployment.projectId.toString()
    )

    if (!project) {
      return new Response("Project Not Found", { status: 404 })
    }

    if (!project.pages) {
      // Fallback to aiGeneratedCode if pages array doesn't exist (legacy)
      if (project.aiGeneratedCode && (filename === "index.html" || filename === "index")) {
         return new Response(project.aiGeneratedCode, {
            headers: { "Content-Type": "text/html" },
         })
      }
      return new Response("Content Not Found", { status: 404 })
    }

    // Find file in pages array with robust matching
    let file = project.pages.find((p: any) => {
        const storedName = p.name.replace(/^\//, "")
        return storedName === filename
    })

    // Try adding .html if missing
    if (!file && !filename.includes('.')) {
        file = project.pages.find((p: any) => {
            const storedName = p.name.replace(/^\//, "")
            return storedName === `${filename}.html`
        })
    }

    // Default to index.html if root request
    if (!file && (filename === "" || filename === "index")) {
        file = project.pages.find((p: any) => {
            const storedName = p.name.replace(/^\//, "")
            return storedName === "index.html"
        })
    }

    if (!file) {
      console.log(`[v0] File not found: ${filename} in project ${project._id}`)
      return new Response("File Not Found", { status: 404 })
    }

    // Determine Content Type
    let contentType = "text/html"
    if (filename.endsWith(".css")) contentType = "text/css"
    if (filename.endsWith(".js")) contentType = "application/javascript"
    if (filename.endsWith(".json")) contentType = "application/json"
    if (filename.endsWith(".png")) contentType = "image/png"
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg"
    if (filename.endsWith(".svg")) contentType = "image/svg+xml"

    return new Response(file.content, {
      headers: { "Content-Type": contentType },
    })
  } catch (error) {
    console.error("Error serving content:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
