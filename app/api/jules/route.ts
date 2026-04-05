import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db()

    // Fetch the user's data directly to bypass authentication
    const user = await db.collection("users").findOne({ email: "dmarton336@gmail.com" })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove sensitive data (if any) or just return the projects for debugging
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        projects: user.projects || []
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
