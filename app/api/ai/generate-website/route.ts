import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  FILE_STRUCTURE,
  getShortTermMemory,
  getFileContext,
  extractDesignSystem,
  type GeneratedFile,
} from "@/lib/ai-memory"
import { getSystemPrompts, getProjectPrompts } from "@/lib/ai-prompts"
import { getRelevantContext } from "@/lib/ai-rag"

// API Configurations
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

// Map models to their specific endpoints and Env Vars
const MODEL_CONFIGS: Record<string, { url: string, envVar: string, provider: string }> = {
  "gemini-2.0-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-1.5-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-1.5-pro": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-3-pro-preview": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "deepseek-v3.2-exp": { url: DEEPSEEK_API_URL, envVar: "DEEPSEEK_API", provider: "DeepSeek" }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, instruction, generatedPages, projectId } = await request.json()

    // Parse generatedPages from frontend
    const previousFiles: GeneratedFile[] = Array.isArray(generatedPages)
      ? generatedPages.map((p: { name: string; code: string }) => ({
          name: p.name,
          code: p.code,
        }))
      : []

    // FORCE USE: gemini-3-pro-preview
    const modelId = "gemini-3-pro-preview"
    const config = MODEL_CONFIGS[modelId] || MODEL_CONFIGS["gemini-1.5-pro"] // Fallback config just in case

    let apiKey = process.env[config.envVar]
    if (config.provider === "Google" && !apiKey) {
        apiKey = process.env.GOOGLE_API_KEY
    }

    if (!apiKey) {
      return NextResponse.json({ message: `AI service not configured (${config.provider})` }, { status: 500 })
    }

    // 1. Parse Instruction to find next task
    // Regex handles "[1] filename : [usedfor]...[usedfor]" format
    const taskRegex = /\[(\d+)\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g
    let match
    let currentTask = null

    while ((match = taskRegex.exec(instruction)) !== null) {
        if (match[1] === "0") continue; // Skip the [0] intro block
        currentTask = {
            fullMatch: match[0],
            number: match[1],
            filename: match[2].trim(),
            usedFor: match[3]?.trim() || "Implementation"
        }
        break;
    }

    // If no numbered task found, check if instruction is just a direct request (fallback)
    if (!currentTask && !instruction.includes("[Done]")) {
        // Maybe simplistic fallback for single-file request?
        // For now, return complete if no task pattern found
        return NextResponse.json({
            isComplete: true,
            updatedInstruction: instruction
        })
    }

    if (!currentTask) {
         return NextResponse.json({
            isComplete: true,
            updatedInstruction: instruction
        })
    }

    console.log(`[v0] Generating file: ${currentTask.filename} (Task [${currentTask.number}]) using ${modelId}`)

    // Determine file type
    const fileExt = currentTask.filename.split('.').pop() || ''
    const isTS = fileExt === 'ts' || fileExt === 'tsx'
    const isHTML = fileExt === 'html'
    const isJSON = fileExt === 'json'
    const isCSS = fileExt === 'css'

    // Fetch Prompts (Global)
    const { builderCode: promptTemplate } = await getSystemPrompts()

    // Fetch Project Specific Memory
    let projectMemory = "";
    if (projectId) {
       const memory = await getProjectPrompts(projectId);
       if (memory) {
          projectMemory = `\n\n[PROJECT MEMORY]\n${memory}\n`;
       }
    }

    // Fetch RAG Context
    const ragQuery = `${currentTask.filename} ${currentTask.usedFor} ${instruction}`
    const ragContext = await getRelevantContext(ragQuery)
    const ragSection = ragContext ? `\n\n[RETRIEVED KNOWLEDGE]\n${ragContext}\n` : ""

    // 2. Prepare System Prompt (Inject Variables)
    const fileContext = getFileContext(previousFiles)
    const designSystem = extractDesignSystem(previousFiles)
    const shortTermMemory = getShortTermMemory(instruction)
    
    let fileRules = ""
    if (isHTML) fileRules = `- Use <!DOCTYPE html>. Include <script src="https://cdn.tailwindcss.com"></script>. Include <script type="module" src="/src/main.ts"></script>.`
    if (isTS) fileRules = `- Write valid TypeScript. Use 'export' for modules. Import from relative paths (e.g. './utils'). DOM manipulation must be type-safe (use 'as HTMLElement' if needed). ALL functions must have explicit return types.`
    if (isJSON) fileRules = `- Return valid JSON only.`
    if (isCSS) fileRules = `- Write valid CSS. Define CSS custom properties in :root for design tokens. Use @tailwind directives if applicable.`

    let systemPrompt = promptTemplate
        .replace("{{FILENAME}}", currentTask.filename)
        .replace("{{USEDFOR}}", currentTask.usedFor)
        .replace("{{FILE_STRUCTURE}}", FILE_STRUCTURE)
        .replace("{{FILE_CONTEXT}}", fileContext)
        .replace("{{DESIGN_SYSTEM}}", designSystem || "No design system established yet. If generating style.css, define CSS custom properties for the project.")
        .replace("{{FILE_EXT}}", fileExt.toUpperCase())
        .replace("{{FILE_RULES}}", fileRules)
        .replace("{{MEMORY}}", shortTermMemory)
        + projectMemory
        + ragSection

    // 3. Call AI
    const conversationHistory = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
    }))

    const payload = {
      model: modelId,
      messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: `Generate the full content for ${currentTask.filename}.` }
      ],
      temperature: 0.2
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error(`${config.provider} API error: ${response.status}`, errorText)
        throw new Error(`${config.provider} API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || ""

    // 4. Robust Parsing
    let extractedCode = ""
    const codeRegex = /\[code\]([\s\S]*?)(\[\/code\]|\[code\])/i
    const codeMatch = responseText.match(codeRegex)

    if (codeMatch) {
        extractedCode = codeMatch[1].trim()
    } else {
        // Fallback to markdown code blocks
        const mdBlock = responseText.match(/```(?:typescript|ts|html|css|json|javascript|js)?\s*([\s\S]*?)```/)
        if (mdBlock) {
            extractedCode = mdBlock[1].trim()
        } else {
            extractedCode = responseText.trim()
        }
    }

    // Clean up markers if any leak into the code block
    extractedCode = extractedCode.replace(/\[file\].*?\[file\]/g, '').replace(/\[usedfor\].*?\[usedfor\]/g, '')

    // 5. Update Instruction (Mark as Done)
    const updatedInstruction = instruction.replace(`[${currentTask.number}]`, `[Done]`)

    return NextResponse.json({
        content: responseText,
        code: extractedCode,
        pageName: currentTask.filename,
        usedFor: currentTask.usedFor,
        updatedInstruction: updatedInstruction,
        isComplete: false
    })

  } catch (error: any) {
    console.error("[v0] Generation error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
