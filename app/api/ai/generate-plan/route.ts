import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const PLAN_MODEL = "gemini-2.0-flash"

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

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: PLAN_MODEL,
    })

    const lastUserMessage = messages[messages.length - 1]

    // Construct prompt
    const systemContext = `
    You are a Senior Technical Architect planning a massive, production-grade website.
    Your goal is to create a detailed architectural plan and file structure.

    OUTPUT FORMAT:
    You must output a single text block strictly following this format:

    [0] The user base plan is to create [Overview of the site]. As an AI web builder, I will generate the following files: {index.html, style.css, script.js, ...}. I will mention to myself that the backend will help to identify the file I am building, this happen by the backend will replace the number mark [1] with a [Done] mark.

    [1] index.html : <description of file>
    [2] style.css : <description of file>
    [3] script.js : <description of file>
    ...

    REQUIREMENTS:
    1.  **Scale**: Plan for a COMPLETE experience (5-10 files typically).
    2.  **Files**: Must include at least index.html and style.css (or styles inside html if preferred, but separate is better for complex apps).
    3.  **Strict Syntax**: Use brackets [1], [2], etc. for file steps.
    4.  **Static Only**: Only suggest files that can run in a browser (HTML/CSS/JS). Do not suggest backend files (e.g., node.js servers, php) unless they are purely client-side mocks.
    `

    // Combine history for context
    const historyText = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
    const finalPrompt = `${systemContext}\n\nCONVERSATION HISTORY:\n${historyText}\n\nRequest: ${lastUserMessage.content}`

    console.log(`[v0] Generating plan with Google model: ${PLAN_MODEL}`)

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
