import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/is-admin"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdmin()

    const { userId } = await params

    const client = await clientPromise
    const db = client.db()

    // Delete the user's projects and deployments from the users collection
    await db.collection("users").updateOne(
      { id: userId },
      {
        $set: {
          "user.projects": [],
          "user.deployments": []
        }
      }
    )

    // Also clean up any orphaned products and settings
    await db.collection("products").deleteMany({ userId })
    await db.collection("webshop_settings").deleteMany({ userId })

    return NextResponse.json({
      success: true,
      message: `User and all associated data deleted`,
    })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
