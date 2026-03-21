import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

/**
 * POST /api/projects/[id]/builder-state
 * Persists the drag-and-drop builder JSON state onto the project document.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID" }, { status: 400 })
  }

  let body: { builderState: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.builderState || typeof body.builderState !== "object") {
    return NextResponse.json({ message: "builderState is required" }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    // The positional operator `$` targets the matched array element in `projects`.
    // The query must include the array filter condition ("projects._id": id) for `$` to resolve.
    const result = await db.collection("users").updateOne(
      { id: session.user.id, "projects._id": new ObjectId(id) },
      { $set: { "projects.$.builderState": body.builderState } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[builder-state] Error saving builder state:", error)
    return NextResponse.json({ message: "Failed to save builder state" }, { status: 500 })
  }
}

/**
 * GET /api/projects/[id]/builder-state
 * Retrieves the stored builder JSON state for a project.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID" }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    const user = await db
      .collection("users")
      .findOne({ id: session.user.id }, { projection: { projects: 1 } })

    if (!user?.projects) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    const project = (user.projects as Array<{ _id: ObjectId; builderState?: unknown }>).find(
      (p) => p._id.toString() === id,
    )

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ builderState: project.builderState ?? null })
  } catch (error) {
    console.error("[builder-state] Error fetching builder state:", error)
    return NextResponse.json({ message: "Failed to fetch builder state" }, { status: 500 })
  }
}
