import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  FILE_STRUCTURE,
  getCompletedFilesList,
  getFileContext,
  getSmartContext,
  extractDesignSystem,
  type GeneratedFile,
} from "@/lib/ai-memory"
import { getSystemPrompts, getProjectPrompts } from "@/lib/ai-prompts"
import { getOrCreateProjectCache } from "@/lib/gemini-cache"

// API Configurations
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

// Map models to their specific endpoints and Env Vars
const MODEL_CONFIGS: Record<string, { url: string, envVar: string, provider: string, useCache?: boolean }> = {
  "gemini-2.0-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google", useCache: false },
  "gemini-1.5-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google", useCache: true },
  "gemini-1.5-pro": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google", useCache: true },
  "gemini-1.5-pro-002": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google", useCache: true },
  "deepseek-v3.2-exp": { url: DEEPSEEK_API_URL, envVar: "DEEPSEEK_API", provider: "DeepSeek", useCache: false }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, instruction, model, generatedPages, projectId } = await request.json()

    // Parse generatedPages from frontend (array of { name, code })
    const previousFiles: GeneratedFile[] = Array.isArray(generatedPages)
      ? generatedPages.map((p: { name: string; code: string }) => ({
          name: p.name,
          code: p.code,
        }))
      : []

    // Default to Gemini 2.0 Flash
    const modelId = model || "gemini-2.0-flash"

    // Map "gemini-3-flash" or similar user requests to actual model
    let configKey = modelId
    if (modelId === "gemini-3-flash" || modelId === "gemini-3.0-flash") {
       configKey = "gemini-2.0-flash"
    }
    if (modelId === "gemini-3-pro" || modelId === "gemini-3.0-pro") {
       configKey = "gemini-1.5-pro"
    }

    const config = MODEL_CONFIGS[configKey] || MODEL_CONFIGS["gemini-2.0-flash"]

    let apiKey = process.env[config.envVar]
    if (config.provider === "Google" && !apiKey) {
        apiKey = process.env.GOOGLE_API_KEY
    }

    if (!apiKey) {
      return NextResponse.json({ message: `AI service not configured (${config.provider})` }, { status: 500 })
    }

    // 1. Parse Instruction to find next task
    // Improved regex to be more permissive about the format
    // Matches: [1] file.ts, [1] file.ts : [usedfor]..., [1] file.ts - [usedfor]...
    const taskRegex = /\[(\d+)\]\s*([^\s:\]]+)(?:\s*[:\-]?\s*(?:\[usedfor\](.*?)\[usedfor\])?)?/g
    let match
    let currentTask = null

    while ((match = taskRegex.exec(instruction)) !== null) {
        if (match[1] === "0") continue;
        currentTask = {
            fullMatch: match[0],
            number: match[1],
            filename: match[2].trim(),
            usedFor: match[3]?.trim() || "Implementation"
        }
        break;
    }

    if (!currentTask) {
        return NextResponse.json({
            isComplete: true,
            updatedInstruction: instruction
        })
    }

    console.log(`[v0] Generating file: ${currentTask.filename} (Task [${currentTask.number}])`)

    // Determine file type
    const fileExt = currentTask.filename.split('.').pop() || ''
    const isTS = fileExt === 'ts' || fileExt === 'tsx'
    const isHTML = fileExt === 'html'
    const isJSON = fileExt === 'json'

    // Fetch Prompts (Global)
    const { builderCode: promptTemplate } = await getSystemPrompts()
    let projectMemory = "";
    if (projectId) {
       const memory = await getProjectPrompts(projectId);
       if (memory) {
          projectMemory = `\n\n[PROJECT MEMORY]\n${memory}\n`;
       }
    }

    // 2. Prepare System Prompt (Inject Variables)
    // Use simplified file context (complex RAG logic removed)
    const fileContext = getFileContext(previousFiles)
    const designSystem = extractDesignSystem(previousFiles)
    // Keep for backward compatibility
    const completedFilesList = getCompletedFilesList(instruction)
    
    let fileRules = ""
    if (isHTML) fileRules = `- Use <!DOCTYPE html>. Include <script src="https://cdn.tailwindcss.com"></script>. Include <script type="module" src="/src/main.ts"></script>. This must be a SEPARATE HTML page (part of multi-page site, NOT SPA).`
    if (isTS) fileRules = `- Write valid TypeScript. Use 'export' for modules. Import from relative paths (e.g. './utils'). DOM manipulation must be type-safe (use 'as HTMLElement' if needed). ALL functions must have explicit return types. IMPORTANT: Do NOT access DOM elements at the top level. Wrap all DOM access in exported functions (e.g. init() or render()).`
    if (isJSON) fileRules = `- Return valid JSON only.`
    if (fileExt === 'css') fileRules = `- Write valid CSS. Define CSS custom properties in :root for design tokens. Use @tailwind directives if applicable.`

    let systemPrompt = promptTemplate
        .replace("{{FILENAME}}", currentTask.filename)
        .replace("{{USEDFOR}}", currentTask.usedFor)
        .replace("{{FILE_STRUCTURE}}", FILE_STRUCTURE)
        .replace("{{FILE_CONTEXT}}", fileContext)
        .replace("{{DESIGN_SYSTEM}}", designSystem || "No design system established yet. If generating style.css, define CSS custom properties for the project.")
        .replace("{{FILE_EXT}}", fileExt.toUpperCase())
        .replace("{{FILE_RULES}}", fileRules)
        // Legacy fallback
        .replace("{{MEMORY}}", completedFilesList) + projectMemory

    // 3. Call AI - Use cache-enabled model for Gemini 1.5
    const useGeminiCache = config.useCache && projectId
    
    if (useGeminiCache) {
      console.log(`[v0] Using Gemini cached context for project ${projectId}`)
      try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const cachedContent = await getOrCreateProjectCache(apiKey, projectId, "multi-page")
        const model = genAI.getGenerativeModelFromCachedContent(cachedContent, {
          model: modelId
        })
        
        const conversationHistory = messages.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
        }))
        
        // Build the prompt for the cached model
        const promptParts = [
          systemPrompt,
          ...conversationHistory.map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`),
          `Generate the full content for ${currentTask.filename}.`
        ].join('\n\n')
        
        const result = await model.generateContent(promptParts)
        const response = await result.response
        const responseText = response.text()
        
        // Continue with parsing (same as before)
        let extractedCode = ""
        const codeRegex = /\[code\]([\s\S]*?)(\[\/code\]|\[code\])/i
        const codeMatch = responseText.match(codeRegex)

        if (codeMatch) {
            extractedCode = codeMatch[1].trim()
        } else {
            const mdBlock = responseText.match(/```(?:typescript|ts|html|css|json|javascript|js)?\s*([\s\S]*?)```/)
            if (mdBlock) {
                extractedCode = mdBlock[1].trim()
            } else {
                 // Fallback: simple heuristic to find code start
                 const content = responseText.trim()
                 const firstCodeIndex = content.search(/(?:^import|^export|^<|^\{|^\/\*)/m)
                 if (firstCodeIndex !== -1 && firstCodeIndex < 50) {
                     extractedCode = content.substring(firstCodeIndex)
                 } else {
                     extractedCode = content
                 }
            }
        }

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
      } catch (cacheError) {
        console.error("[v0] Cache error, falling back to regular API:", cacheError)
        // Fall through to regular API call
      }
    }
    
    // Regular API call (no cache or fallback)
    const conversationHistory = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
    }))

    const payload = {
      model: modelId === "gemini-3-flash" ? "gemini-2.0-flash" : modelId,
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

    if (!response.ok) throw new Error(`${config.provider} API error: ${response.status}`)
    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || ""

    // 4. Robust Parsing
    let extractedCode = ""
    const codeRegex = /\[code\]([\s\S]*?)(\[\/code\]|\[code\])/i
    const codeMatch = responseText.match(codeRegex)

    if (codeMatch) {
        extractedCode = codeMatch[1].trim()
    } else {
        const mdBlock = responseText.match(/```(?:typescript|ts|html|css|json|javascript|js)?\s*([\s\S]*?)```/)
        if (mdBlock) {
            extractedCode = mdBlock[1].trim()
        } else {
             // Fallback: simple heuristic to find code start
             const content = responseText.trim()
             const firstCodeIndex = content.search(/(?:^import|^export|^<|^\{|^\/\*)/m)
             if (firstCodeIndex !== -1 && firstCodeIndex < 50) { // Only if found near start
                 extractedCode = content.substring(firstCodeIndex)
             } else {
                 extractedCode = content
             }
        }
    }

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
