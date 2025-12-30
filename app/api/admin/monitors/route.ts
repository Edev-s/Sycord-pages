import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.email !== "dmarton336@gmail.com") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()
    const monitors = await db.collection("monitors").find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json(monitors)
  } catch (error) {
    console.error("Error fetching monitors:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.email !== "dmarton336@gmail.com") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, cronitorId, provider, icon, uniqueUri } = body

    if (!name || !cronitorId) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const monitor = {
      name,
      cronitorId,
      provider: provider || "",
      icon: icon || "Server",
      uniqueUri: uniqueUri || cronitorId,
      createdAt: new Date(),
    }

    const result = await db.collection("monitors").insertOne(monitor)
    return NextResponse.json({ ...monitor, _id: result.insertedId })
  } catch (error) {
    console.error("Error creating monitor:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
