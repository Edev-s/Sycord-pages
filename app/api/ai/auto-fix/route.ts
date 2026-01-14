import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getProjectPrompts } from "@/lib/ai-prompts"

const FIX_MODEL = "gemini-2.0-flash"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { logs, fileStructure, fileContent, lastAction, history, fixedFiles, projectId } = await request.json()

    // Use GOOGLE_AI_API by default, fallback to GOOGLE_API_KEY
    const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "AI service not configured" }, { status: 500 })
    }

    // Fetch Custom Prompt
    // Note: If projectId is missing from request body, we might need to handle it or fallback.
    // The previous frontend change didn't explicitly pass projectId to auto-fix route in `AIWebsiteBuilder`?
    // Let's assume it might not be there in all calls, but it SHOULD be.
    // I will check the frontend code later, but for now, if projectId is missing, we use default.
    const { autoFix: promptTemplate } = await getProjectPrompts(projectId || "")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: FIX_MODEL })

    let memorySection = ""
    if (fixedFiles && fixedFiles.length > 0) {
        memorySection += `
        **CRITICAL MEMORY (ALREADY FIXED FILES):**
        You have already modified the following files in this session:
        ${fixedFiles.join(', ')}
        WARNING: If you see errors persisting in these files, your previous fix was incorrect.
        DO NOT apply the exact same fix again. Try a different approach.
        `
    }

    if (history && Array.isArray(history) && history.length > 0) {
        memorySection += `
        **SESSION HISTORY (ACTIONS TAKEN):**
        The following actions have already been attempted:
        ${history.map((h: any) => `- ${h.action.toUpperCase()}: ${h.target} -> ${h.summary || h.result}`).join('\n')}
        Use this history to avoid loops.
        `
    }

    let contentSection = ""
    if (lastAction === 'take a look' && fileContent) {
        contentSection += `
        **FILE CONTENT (${fileContent.filename}):**
        \`\`\`
        ${fileContent.code}
        \`\`\`
        Now that you see the file, determine the fix.
        If you need to edit it, output [fix] ${fileContent.filename} and the new code.
        `
    }

    // Inject into template
    let systemPrompt = promptTemplate
        .replace("{{LOGS}}", logs.join('\n'))
        .replace("{{FILE_STRUCTURE}}", fileStructure)
        .replace("{{MEMORY_SECTION}}", memorySection)
        .replace("{{CONTENT_SECTION}}", contentSection)

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const responseText = response.text()

    // Parse the response
    let action = null
    let targetFile = null
    let newPath = null
    let code = null
    let explanation = ""

    const lines = responseText.split('\n')
    for (const line of lines) {
        if (line.trim().startsWith('[take a look]')) {
            action = 'read'
            targetFile = line.replace('[take a look]', '').trim()
        } else if (line.trim().startsWith('[move]')) {
            action = 'move'
            const parts = line.replace('[move]', '').trim().split(/\s+/)
            targetFile = parts[0]
            newPath = parts[1]
        } else if (line.trim().startsWith('[delete]')) {
            action = 'delete'
            targetFile = line.replace('[delete]', '').trim()
        } else if (line.trim().startsWith('[fix]')) {
            action = 'write'
            targetFile = line.replace('[fix]', '').trim()
        } else if (line.trim().startsWith('[done]')) {
            action = 'done'
        } else if (!action && line.trim().length > 0) {
            explanation += line + " "
        }
    }

    if (action === 'write') {
        const codeMatch = responseText.match(/\[code\]([\s\S]*?)\[\/code\]/)
        if (codeMatch) {
            code = codeMatch[1].trim()
        }
    }

    return NextResponse.json({
        action,
        targetFile,
        newPath,
        code,
        explanation: explanation.trim(),
        raw: responseText
    })

  } catch (error: any) {
    console.error("[v0] Auto-fix error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
