import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

const VPS_BASE_URL =
  process.env.VPS_SERVER_URL || "https://vps.sycord.com"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ repoId: string }> }
) {
    const { repoId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!repoId) {
        return NextResponse.json({ error: "Missing project ID" }, { status: 400 })
    }

    try {
        console.log(`[Domain Check] Checking domain for project ${repoId}`)

        let domain = null

        // Query the VPS Flask server for project info
        try {
            const res = await fetch(`${VPS_BASE_URL}/api/projects/${repoId}`)
            if (res.ok) {
                const data = await res.json()
                if (data.success && data.domain) {
                    domain = `https://${data.domain}`
                    console.log(`[Domain Check] Found via VPS: ${domain}`)
                }
            }
        } catch (apiError) {
            console.error(`[Domain Check] VPS fetch error:`, apiError)
        }

        // Update database if domain found
        if (domain) {
            const client = await clientPromise
            const db = client.db()

            // Try updating by project ID stored in vpsProjectId
            const updateResult = await db.collection("users").updateOne(
                {
                    id: session.user.id,
                    "projects.vpsProjectId": repoId
                },
                {
                    $set: { "projects.$.cloudflareUrl": domain }
                }
            )

            // Fallback: try by numeric githubRepoId for backward compat
            if (!updateResult || updateResult.matchedCount === 0) {
                const numericId = parseInt(repoId)
                if (!isNaN(numericId)) {
                    await db.collection("users").updateOne(
                        {
                            id: session.user.id,
                            "projects.githubRepoId": numericId
                        },
                        {
                            $set: { "projects.$.cloudflareUrl": domain }
                        }
                    )
                }
            }

            return NextResponse.json({ success: true, domain })
        }

        return NextResponse.json({ success: false, message: "Domain not found yet" })

    } catch (e: any) {
        console.error("Domain fetch error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
