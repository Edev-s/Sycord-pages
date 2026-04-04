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
  process.env.VPS_SERVER_URL || "https://server.sycord.site"

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
    const htmlFiles: { path: string; content: string }[] = []

    if (pages.length > 0) {
      for (const page of pages) {
        let path = page.name
        if (path.startsWith("/")) path = path.substring(1)
        htmlFiles.push({ path, content: page.content })
      }
    } else if (project.aiGeneratedCode) {
      htmlFiles.push({ path: "index.html", content: project.aiGeneratedCode })
    }

    if (htmlFiles.length === 0)
      return NextResponse.json({ error: "No files to deploy." }, { status: 400 })

    // 3b. Wrap in a Vite project structure for a proper production build
    const files: { path: string; content: string }[] = []

    // Generate Vite multi-page input entries
    const inputEntries: Record<string, string> = {}
    for (const f of htmlFiles) {
      files.push({ path: f.path, content: f.content })
      // Register each HTML file as a Vite input entry for multi-page build
      const entryName = f.path.replace(/\.html$/, "").replace(/\//g, "_") || "main"
      inputEntries[entryName] = f.path
    }

    // package.json – minimal Vite project
    files.push({
      path: "package.json",
      content: JSON.stringify(
        {
          name: subdomain || "sycord-site",
          private: true,
          type: "module",
          scripts: { build: "vite build", preview: "vite preview" },
          devDependencies: { vite: "^6.0.0" },
        },
        null,
        2,
      ),
    })

    // vite.config.js – multi-page build config
    const inputLines = Object.entries(inputEntries)
      .map(([key, val]) => `        ${key}: resolve(__dirname, "${val}"),`)
      .join("\n")

    files.push({
      path: "vite.config.js",
      content: [
        `import { defineConfig } from "vite";`,
        `import { resolve } from "path";`,
        ``,
        `export default defineConfig({`,
        `  build: {`,
        `    rollupOptions: {`,
        `      input: {`,
        inputLines,
        `      },`,
        `    },`,
        `  },`,
        `});`,
      ].join("\n"),
    })

    // 4. Create Cloudflare DNS Record
    console.log(`[Deploy] Updating DNS for ${subdomain}.sycord.site via Cloudflare API...`)
    const cfApiKey = process.env.CLOUDFLARE_API_KEY
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID

    if (cfApiKey && cfZoneId) {
      try {
        // Step 4a: Check if record exists
        const dnsCheck = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?name=${subdomain}.sycord.site`, {
          headers: {
            "Authorization": `Bearer ${cfApiKey}`,
            "Content-Type": "application/json"
          }
        })
        const dnsCheckData = await dnsCheck.json()

        // Step 4b: Create or update CNAME to route to the tunnel
        const dnsPayload = {
          type: "CNAME",
          name: subdomain,
          content: "server.sycord.site",
          proxied: true,
          ttl: 1
        }

        if (dnsCheckData.success && dnsCheckData.result.length > 0) {
          // Update existing
          const recordId = dnsCheckData.result[0].id
          await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${recordId}`, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${cfApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(dnsPayload)
          })
        } else {
          // Create new
          await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${cfApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(dnsPayload)
          })
        }
      } catch (dnsErr) {
        console.error(`[Deploy] Cloudflare DNS configuration failed for ${subdomain}:`, dnsErr)
        // Non-blocking error, we still try to deploy to VPS
      }
    } else {
      console.warn("[Deploy] Missing CLOUDFLARE_API_KEY or CLOUDFLARE_ZONE_ID, skipping automated DNS configuration.")
    }

    // 5. Deploy to VPS Flask server
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
