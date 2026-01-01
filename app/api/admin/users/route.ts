import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/is-admin"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    await requireAdmin()

    const client = await clientPromise
    const db = client.db()

    // Fetch all registered users from the 'users' collection
    const users = await db.collection("users").find({}).toArray()

    // Construct the response object with user data from users collection
    const userList = users.map(user => {
        const userProjects = user.user?.projects || []

        return {
            userId: user.id,
            email: user.email || "Unknown",
            name: user.name || "Unknown",
            projectCount: userProjects.length,
            isPremium: user.isPremium || false,
            ip: userProjects.length > 0 ? (userProjects[0].userIP || "Unknown") : "Unknown",
            createdAt: user.createdAt || new Date().toISOString(),
            websites: userProjects.map((p: any) => ({
                id: p._id,
                businessName: p.businessName,
                subdomain: p.subdomain
            }))
        }
    })

    return NextResponse.json(userList)
  } catch (error) {
    console.error("[v0] Admin users GET error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
