import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

const SYCORD_DEPLOY_API_BASE = "https://micro1.sycord.com"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ repoId: string }> }
) {
    const { repoId } = await params
    const session = await getServerSession(authOptions)

    // We strictly need user session to allow updating the DB,
    // although technically checking the domain is public info if you know the repoId.
    // Sticking to auth for security.
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!repoId) {
        return NextResponse.json({ error: "Missing Repo ID" }, { status: 400 })
    }

    try {
        // Fetch from upstream
        const res = await fetch(`${SYCORD_DEPLOY_API_BASE}/api/deploy/${repoId}/domain`)
        const data = await res.json()

        if (data.success && data.domain) {
            // Update Database if we found a domain
            const client = await clientPromise
            const db = client.db()

            // We need to find the project with this repoId.
            // The projects are embedded in users.
            // We filter by user ID AND the project's repo ID to ensure ownership.
            // Note: githubRepoId is stored as a number in DB typically (from GitHub API), but might be string in param.

            // Try to update.
            const updateResult = await db.collection("users").updateOne(
                {
                    id: session.user.id,
                    "projects.githubRepoId": parseInt(repoId) // GitHub IDs are numbers
                },
                {
                    $set: { "projects.$.cloudflareUrl": data.domain }
                }
            )

            // If parseInt failed or didn't match, maybe it's stored as string?
            if (updateResult.matchedCount === 0) {
                 await db.collection("users").updateOne(
                    {
                        id: session.user.id,
                        "projects.githubRepoId": repoId
                    },
                    {
                        $set: { "projects.$.cloudflareUrl": data.domain }
                    }
                )
            }
        }

        return NextResponse.json(data)

    } catch (e: any) {
        console.error("Domain fetch error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
