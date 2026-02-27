import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSystemPrompts } from "@/lib/ai-prompts"
import { getOrCreateProjectCache } from "@/lib/gemini-cache"

const PLAN_MODEL = "gemini-3.1-pro-preview"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, projectId } = await request.json()

    // Use GOOGLE_AI_API by default, fallback to GOOGLE_API_KEY
    const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("[v0] GOOGLE_AI_API (or GOOGLE_API_KEY) not configured")
      return NextResponse.json({ message: "AI service not configured (Google)" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Get or create cached content for this project
    // The cache contains all the architectural guidance, Hero UI patterns, etc.
    let model
    if (projectId) {
      console.log(`[v0] Using cached context for project ${projectId}`)
      const cachedContent = await getOrCreateProjectCache(apiKey, projectId, "multi-page")
      model = genAI.getGenerativeModelFromCachedContent(cachedContent, {
        model: PLAN_MODEL
      })
    } else {
      // Fallback to regular model without cache
      model = genAI.getGenerativeModel({ model: PLAN_MODEL })
    }

    const lastUserMessage = messages[messages.length - 1]

    // Fetch Global Prompt
    const { builderPlan: systemContextTemplate } = await getSystemPrompts()

    // Combine history for context
    const historyText = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")

    const finalPrompt = systemContextTemplate
        .replace("{{HISTORY}}", historyText)
        .replace("{{REQUEST}}", lastUserMessage.content)

    console.log(`[v0] Generating plan with Google model: ${PLAN_MODEL} (using cache: ${!!projectId})`)

    const result = await model.generateContent(finalPrompt)
    const response = await result.response
    const responseText = response.text()

    // Return the raw instruction text
    return NextResponse.json({
      instruction: responseText,
    })
  } catch (error: any) {
    console.error("[v0] Plan generation error:", error)
    return NextResponse.json({ message: error.message || "Failed to generate plan" }, { status: 500 })
  }
}
