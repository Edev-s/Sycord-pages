import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getSystemPrompts } from "@/lib/ai-prompts"

const PLAN_MODEL = "gemini-3-pro-preview"

// API Configurations
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages } = await request.json()

    // Use GOOGLE_AI_API by default, fallback to GOOGLE_API_KEY
    const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("[v0] GOOGLE_AI_API (or GOOGLE_API_KEY) not configured")
      return NextResponse.json({ message: "AI service not configured (Google)" }, { status: 500 })
    }

    const lastUserMessage = messages[messages.length - 1]

    // Fetch Global Prompt
    const { builderPlan: systemContextTemplate } = await getSystemPrompts()

    // Combine history for context
    const historyText = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")

    const finalPrompt = systemContextTemplate
        .replace("{{HISTORY}}", historyText)
        .replace("{{REQUEST}}", lastUserMessage.content)

    console.log(`[v0] Generating plan with Google model: ${PLAN_MODEL}`)

    const payload = {
        model: PLAN_MODEL,
        messages: [
             { role: "system", content: "You are an expert technical architect." },
             { role: "user", content: finalPrompt }
        ],
        temperature: 0.2
    }

    const response = await fetch(GOOGLE_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] Plan API error: ${response.status}`, errorText)
        throw new Error(`Plan generation failed: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || ""

    if (!responseText) {
        throw new Error("Empty response from AI")
    }

    // Return the raw instruction text
    return NextResponse.json({
      instruction: responseText,
    })
  } catch (error: any) {
    console.error("[v0] Plan generation error:", error)
    return NextResponse.json({ message: error.message || "Failed to generate plan" }, { status: 500 })
  }
}
