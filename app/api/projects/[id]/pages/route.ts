import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const { name, content } = await request.json()

    if (!ObjectId.isValid(id)) {
        return NextResponse.json({ message: "Invalid project ID" }, { status: 400 })
    }

    if (!name || !content) {
      return NextResponse.json({ message: "Name and content required" }, { status: 400 })
    }

    // Basic sanitization/validation for page name to prevent path traversal or invalid filenames
    // Although Cloudflare Worker handles routing, we want to enforce clean names
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
         return NextResponse.json({ message: "Invalid page name" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Validate project exists and user owns it
    const userData = await db.collection("users").findOne({ id: session.user.id })
    const projects = userData?.user?.projects || []
    const project = projects.find((p: any) => p._id.toString() === id)

    if (!project) {
        return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    // Add or update page in the project's pages array
    await db.collection("users").updateOne(
        {
          id: session.user.id,
          "user.projects._id": new ObjectId(id)
        },
        {
          $pull: {
            "user.projects.$.pages": { name: name }
          }
        }
    )
    
    await db.collection("users").updateOne(
        {
          id: session.user.id,
          "user.projects._id": new ObjectId(id)
        },
        {
          $push: {
            "user.projects.$.pages": {
              name: name,
              content: content,
              updatedAt: new Date(),
              createdAt: new Date()
            }
          }
        }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error saving page:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const pageName = searchParams.get("name")

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid project ID" }, { status: 400 })
    }

    if (!pageName) {
      return NextResponse.json({ message: "Page name required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Validate project exists and user owns it
    const userData = await db.collection("users").findOne({ id: session.user.id })
    const projects = userData?.user?.projects || []
    const project = projects.find((p: any) => p._id.toString() === id)

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 })
    }

    const result = await db.collection("users").updateOne(
      {
        id: session.user.id,
        "user.projects._id": new ObjectId(id)
      },
      {
        $pull: {
          "user.projects.$.pages": { name: pageName }
        }
      }
    )

    if (result.deletedCount === 0) {
        return NextResponse.json({ message: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting page:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
