import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    const user = await db.collection("users").findOne({ id: session.user.id })

    if (!user) {
      // Return basic info from session if user not found in DB
      return NextResponse.json({
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || "",
        userId: session.user.id,
      })
    }

    return NextResponse.json({
      name: user.name || session.user.name || "",
      email: user.email || session.user.email || "",
      image: user.image || session.user.image || "",
      userId: user.id || session.user.id,
      createdAt: user.createdAt || new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
