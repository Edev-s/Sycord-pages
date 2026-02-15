import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getSystemPrompts } from "@/lib/ai-prompts"
import { generatePlan } from "@/lib/gemini"

// ──────────────────────────────────────────────────────
// POST /api/ai/generate-plan
// ──────────────────────────────────────────────────────
// Generates the architectural file plan using Gemini Flash
// for fast turnaround. The plan defines which files to
// generate and in what dependency order.
// ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages } = await request.json()

    const lastUserMessage = messages[messages.length - 1]

    // Fetch the plan prompt template (may be customized in DB)
    const { builderPlan: systemContextTemplate } = await getSystemPrompts()

    // Build conversation history for context
    const historyText = messages
      .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n")

    const finalPrompt = systemContextTemplate
      .replace("{{HISTORY}}", historyText)
      .replace("{{REQUEST}}", lastUserMessage.content)

    console.log("[AI] Generating architectural plan with Gemini Flash")

    // Use Flash for fast planning
    const responseText = await generatePlan(finalPrompt, lastUserMessage.content)

    return NextResponse.json({
      instruction: responseText,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate plan"
    console.error("[AI] Plan generation error:", message)
    return NextResponse.json({ message }, { status: 500 })
  }
}
