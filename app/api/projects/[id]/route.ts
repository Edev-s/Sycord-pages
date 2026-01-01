import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID" }, { status: 400 })
  }

  const userData = await db.collection("users").findOne({ id: session.user.id })
  const projects = userData?.user?.projects || []
  
  const project = projects.find((p: any) => p._id.toString() === id)

  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()
  const body = await request.json()

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID" }, { status: 400 })
  }

  const result = await db.collection("users").updateOne(
    { 
      id: session.user.id,
      "user.projects._id": new ObjectId(id)
    },
    {
      $set: {
        "user.projects.$[elem].updatedAt": new Date(),
        ...Object.fromEntries(
          Object.entries(body).map(([key, value]) => [`user.projects.$[elem].${key}`, value])
        )
      }
    },
    {
      arrayFilters: [{ "elem._id": new ObjectId(id) }]
    }
  )

  if (result.matchedCount === 0) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid project ID" }, { status: 400 })
  }

  try {
    // Delete the project and associated deployments from the user's document
    const result = await db.collection("users").updateOne(
      { id: session.user.id },
      {
        $pull: {
          "user.projects": { _id: new ObjectId(id) },
          "user.deployments": { projectId: new ObjectId(id) }
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    console.log("[v0] Project deleted:", { projectId: id, userId: session.user.id })

    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting project:", error)
    return NextResponse.json({ message: "Error deleting project" }, { status: 500 })
  }
}
