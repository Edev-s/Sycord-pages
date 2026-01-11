import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const REFACTOR_MODEL = "gemini-2.0-flash"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { existingCode, filename, userRequest, allFiles } = await request.json()

    const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "AI service not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: REFACTOR_MODEL })

    // Create a summary of all files for context
    const filesSummary = allFiles
      ?.map((f: { name: string; code: string }) => `- ${f.name} (${f.code.length} bytes)`)
      .join('\n') || 'No other files'

    const systemPrompt = `
You are an expert code refactoring AI that makes SURGICAL, MINIMAL changes to code.
Your job is to analyze existing code and make only the necessary modifications requested by the user.

**YOUR PRINCIPLES:**
1. PRESERVE existing code structure and patterns
2. ONLY modify what is absolutely necessary
3. MAINTAIN consistency with the existing codebase style
4. NEVER remove functionality unless explicitly requested
5. ADD improvements while keeping what works

**CONTEXT:**
File being modified: ${filename}
Other project files: 
${filesSummary}

**EXISTING CODE:**
\`\`\`
${existingCode}
\`\`\`

**USER REQUEST:**
${userRequest}

**YOUR TASK:**
1. Analyze the existing code structure
2. Identify the MINIMAL changes needed to fulfill the request
3. Apply changes while preserving working code
4. Ensure the modified code is complete and functional

**OUTPUT FORMAT:**
First, explain what you're changing in a brief summary (2-3 sentences).
Then output the complete modified code wrapped in [code]...[/code] tags.

Example:
I will add a hover effect to the button and update the color scheme to blue gradient while keeping the existing structure.
[code]
// ... complete modified code here ...
[/code]

**CRITICAL RULES:**
1. Output the COMPLETE file content (not just the changes)
2. Keep all existing imports and exports
3. Preserve type annotations and comments
4. Do NOT use markdown code blocks, only [code]...[/code]
`

    console.log(`[v0] Refactoring file: ${filename}`)

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const responseText = response.text()

    // Extract explanation and code
    let explanation = ""
    let newCode = ""

    // Find the code block
    const codeMatch = responseText.match(/\[code\]([\s\S]*?)\[\/code\]/i)
    if (codeMatch) {
      newCode = codeMatch[1].trim()
      // Get explanation (everything before [code])
      explanation = responseText.split('[code]')[0].trim()
    } else {
      // Fallback: try markdown blocks
      const mdMatch = responseText.match(/```(?:typescript|ts|html|css|json|javascript|js)?\s*([\s\S]*?)```/)
      if (mdMatch) {
        newCode = mdMatch[1].trim()
        explanation = responseText.split('```')[0].trim()
      } else {
        // No code found, return error
        return NextResponse.json({ 
          message: "Failed to extract refactored code from AI response",
          raw: responseText 
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      filename,
      explanation,
      code: newCode,
      originalLength: existingCode.length,
      newLength: newCode.length
    })

  } catch (error: any) {
    console.error("[v0] Refactor error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
