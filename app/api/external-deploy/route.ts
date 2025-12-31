import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _id } = body

    if (!_id) {
      return NextResponse.json({ error: "Missing _id" }, { status: 400 })
    }

    const idString = String(_id)

    console.log(`[External Deploy] Triggering deployment for _id: ${idString}`)

    const response = await fetch("https://micro1.sycord.com/api/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: idString }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[External Deploy] Failed:", data)
      return NextResponse.json(
        { error: data.message || "External deployment failed", details: data },
        { status: response.status }
      )
    }

    console.log("[External Deploy] Success:", data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[External Deploy] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
