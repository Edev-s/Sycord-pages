import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    // Invalidate all existing sessions for this user by incrementing sessionVersion
    await db.collection("users").updateOne(
      { id: session.user.id },
      { $set: { sessionVersion: Date.now() } }
    )

    const response = NextResponse.json({ success: true, message: "Session invalidated server-side" })
    const cookieStore = await cookies()

    const clearCookie = (name: string) => {
      response.cookies.set({
        name,
        value: "",
        maxAge: 0,
        path: "/",
      })
    }

    clearCookie("next-auth.session-token")
    clearCookie("__Secure-next-auth.session-token")
    clearCookie("next-auth.csrf-token")
    clearCookie("__Secure-next-auth.csrf-token")
    clearCookie("access_token")
    clearCookie("refresh_token")

    return response
  } catch (error: any) {
    console.error("Error logging out:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
