import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const FIX_MODEL = "gemini-2.0-flash"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { logs, fileStructure, fileContent, currentStep, lastAction } = await request.json()

    // Use GOOGLE_AI_API by default, fallback to GOOGLE_API_KEY
    const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ message: "AI service not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: FIX_MODEL })

    let systemPrompt = `
      You are an expert AI DevOps and Full Stack Engineer. Your goal is to fix deployment errors in a Vite + TypeScript project automatically.

      **CONTEXT:**
      The user is trying to deploy a website but encountered errors.
      You have access to the server logs and the project file structure.

      **YOUR TOOLKIT:**
      You can perform ONE of the following actions at a time:

      1.  **[take a look] <filename>**: Request to see the content of a specific file to debug it.
          *   Use this if the logs point to a syntax error, import error, or logic error in a specific file.

      2.  **[move] <old_path> <new_path>**: Rename or move a file.
          *   Use this if a file is in the wrong place (e.g., index.html in public/ instead of root).

      3.  **[delete] <filename>**: Delete a file.
          *   Use this if a file is conflicting or unnecessary.

      4.  **[fix] <filename>**: Provide the corrected code for a file.
          *   Use this ONLY after you have seen the file content (via [take a look]) or if the fix is obvious from the logs (e.g., creating a missing config file).
          *   You MUST provide the full, corrected file content in a [code] block.

      5.  **[done]**: State that the issue is resolved.

      **LOGS:**
      ${logs.join('\n')}

      **FILE STRUCTURE:**
      ${fileStructure}
    `

    if (lastAction === 'take a look' && fileContent) {
        systemPrompt += `

        **FILE CONTENT (${fileContent.filename}):**
        \`\`\`
        ${fileContent.code}
        \`\`\`

        Now that you see the file, determine the fix.
        If you need to edit it, output [fix] ${fileContent.filename} and the new code.
        `
    }

    systemPrompt += `
      **OUTPUT FORMAT:**
      Start your response with a short thought process (one sentence).
      Then, output the action in valid format on a new line.

      Example 1 (Need to check file):
      The build failed in main.ts, I need to check imports.
      [take a look] src/main.ts

      Example 2 (Fixing a file):
      I see the typo in main.ts, correcting it now.
      [fix] src/main.ts
      [code]
      import './style.css'
      console.log('Fixed')
      [/code]

      Example 3 (Moving file):
      index.html is in public folder but Vite needs it in root.
      [move] public/index.html index.html
    `

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
