import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getSystemPrompts, saveSystemPrompts } from "@/lib/ai-prompts"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email?.includes("dmarton336@gmail.com")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  try {
    const prompts = await getSystemPrompts()
    return NextResponse.json(prompts)
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email?.includes("dmarton336@gmail.com")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await request.json()
    await saveSystemPrompts(body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
