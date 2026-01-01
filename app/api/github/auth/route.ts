import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const GITHUB_API_BASE = "https://api.github.com"

/**
 * Get GitHub credentials from environment variables
 * Returns null if not configured
 */
function getEnvGitHubCredentials(): { token: string; owner: string } | null {
  const token = process.env.GITHUB_API_TOKEN || process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER || process.env.GITHUB_USERNAME
  
  if (token && owner) {
    return { token, owner }
  }
  return null
}

/**
 * Validate GitHub token by making a test API call
 */
async function validateGitHubToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })

    if (response.ok) {
      const user = await response.json()
      return { valid: true, username: user.login }
    }
    return { valid: false }
  } catch (error) {
    console.error("[GitHub] Token validation error:", error)
    return { valid: false }
  }
}

/**
 * POST /api/github/auth
 * Store GitHub API credentials for a project
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, token, owner, repo } = await request.json()

    if (!projectId || !token) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, token" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    // Verify project ownership through users collection
    const userData = await db.collection("users").findOne({ id: session.user.id })
    const projects = userData?.user?.projects || []
    const project = projects.find((p: any) => p._id.toString() === projectId)

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you do not have permission to modify it" },
        { status: 403 }
      )
    }

    // Validate the token
    console.log("[GitHub] Validating API token...")
    const validation = await validateGitHubToken(token)

    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid GitHub token" },
        { status: 400 }
      )
    }

    // Store or update the token
    await db.collection("github_tokens").updateOne(
      {
        projectId: new ObjectId(projectId),
        userId: session.user.email,
      },
      {
        $set: {
          token,
          owner: owner || validation.username,
          repo: repo || null,
          username: validation.username,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    console.log("[GitHub] API credentials stored successfully")

    return NextResponse.json({
      success: true,
      message: "GitHub credentials validated and stored",
      username: validation.username,
    })
  } catch (error: any) {
    console.error("[GitHub] Auth error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to store credentials" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/github/auth
 * Get GitHub authentication status for a project
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    // First check environment variables
    const envCredentials = getEnvGitHubCredentials()
    if (envCredentials) {
      const validation = await validateGitHubToken(envCredentials.token)
      if (validation.valid) {
        const client = await clientPromise
        const db = client.db()
        
        // Get repo from project in users collection if already saved
        const userData = await db.collection("users").findOne({
          "user.projects._id": new ObjectId(projectId)
        })
        const project = userData?.user?.projects?.find(
          (p: any) => p._id.toString() === projectId
        )
        
        return NextResponse.json({
          isAuthenticated: true,
          username: validation.username,
          owner: envCredentials.owner,
          repo: project?.githubRepo || null,
          usingEnvCredentials: true,
        })
      }
    }

    // Fall back to database credentials
    const client = await clientPromise
    const db = client.db()

    const tokenDoc = await db.collection("github_tokens").findOne({
      projectId: new ObjectId(projectId),
      userId: session.user.email,
    })

    return NextResponse.json({
      isAuthenticated: !!tokenDoc,
      username: tokenDoc?.username || null,
      owner: tokenDoc?.owner || null,
      repo: tokenDoc?.repo || null,
      usingEnvCredentials: false,
    })
  } catch (error: any) {
    console.error("[GitHub] Get auth status error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get auth status" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/github/auth
 * Remove GitHub API credentials for a project
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    await db.collection("github_tokens").deleteOne({
      projectId: new ObjectId(projectId),
      userId: session.user.email,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[GitHub] Delete auth error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete credentials" },
      { status: 500 }
    )
  }
}
