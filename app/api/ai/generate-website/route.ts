import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  FILE_STRUCTURE,
  getShortTermMemory,
  getFileContext,
  getSmartContext,
  extractDesignSystem,
  type GeneratedFile,
} from "@/lib/ai-memory"
import { getSystemPrompts, getProjectPrompts } from "@/lib/ai-prompts"
import { retrieveProjectFiles, mergeFileSources } from "@/lib/ai-rag"

// API Configurations
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

// Map models to their specific endpoints and Env Vars
const MODEL_CONFIGS: Record<string, { url: string, envVar: string, provider: string }> = {
  "gemini-2.0-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-1.5-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-1.5-pro": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "deepseek-v3.2-exp": { url: DEEPSEEK_API_URL, envVar: "DEEPSEEK_API", provider: "DeepSeek" }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, instruction, model, generatedPages, projectId } = await request.json()

    // Parse generatedPages from frontend (array of { name, code })
    const frontendFiles: GeneratedFile[] = Array.isArray(generatedPages)
      ? generatedPages.map((p: { name: string; code: string }) => ({
          name: p.name,
          code: p.code,
        }))
      : []

    // ── RAG Memory Retrieval ──────────────────────────────
    // Pull all previously generated files from MongoDB.
    // This ensures the AI always has full cross-file context,
    // even if the frontend state was lost or incomplete.
    // If retrieval fails, abort code generation.
    let previousFiles: GeneratedFile[] = frontendFiles

    if (projectId) {
      console.log("[RAG] Initiating memory retrieval before code generation...")
      const ragResult = await retrieveProjectFiles(projectId)

      if (!ragResult.success) {
        console.error("[RAG] ABORT - Memory retrieval failed:", ragResult.error)
        console.error("[RAG] Debug info:", JSON.stringify(ragResult.debugInfo))
        return NextResponse.json(
          {
            message: "Code generation aborted: failed to retrieve previously generated files from memory.",
            ragError: ragResult.error,
            ragDebug: ragResult.debugInfo,
          },
          { status: 500 }
        )
      }

      // Merge RAG files with frontend files (frontend takes priority for recent edits)
      previousFiles = mergeFileSources(ragResult.files, frontendFiles)

      console.log(`[RAG] Context ready: ${previousFiles.length} files available for generation`)
      console.log(`[RAG] Debug: retrieved=${ragResult.debugInfo.filesRetrieved}, hasIndex=${ragResult.debugInfo.hasIndexHtml}, time=${ragResult.debugInfo.retrievalTimeMs}ms`)
    } else {
      console.warn("[RAG] No projectId provided - skipping memory retrieval, using frontend files only")
    }

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
    // Use Smart Context (RAG) to select most relevant file context
    const fileContext = getSmartContext(previousFiles, currentTask.filename)
    const designSystem = extractDesignSystem(previousFiles)
    // Keep legacy memory as fallback / additional signal
    const shortTermMemory = getShortTermMemory(instruction)
    
    let fileRules = ""
    if (isHTML) fileRules = `- Use <!DOCTYPE html>. Include <script src="https://cdn.tailwindcss.com"></script> in <head>. Include <script type="module" src="/src/main.ts"></script> before </body>. Include <div id="app"></div> in <body> as the mount point. Keep HTML minimal — components render dynamic content. Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> for responsive viewport.`
    if (isTS && currentTask.filename === 'src/main.ts') {
      fileRules = `- This is the APPLICATION ENTRY POINT. Import './style.css' first. Import the render/init function from EVERY component file. Use DOMContentLoaded listener. Target document.getElementById('app'). Call each component render function in order. If you miss any component import, the site breaks.`
    } else if (isTS && currentTask.filename.includes('components/')) {
      fileRules = `- Write valid TypeScript. Use 'export' for modules. Import from relative paths (e.g. '../utils', '../types'). DOM manipulation must be type-safe. ALL functions must have explicit return types. Do NOT access DOM at top level — wrap in exported functions. Export a render function taking container: HTMLElement. Use Tailwind responsive classes: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, p-4 md:p-6 lg:p-8, text-sm md:text-base lg:text-lg. EVERY <button> MUST have addEventListener('click', handler). EVERY <a> link MUST have href or click handler. Navigation components MUST include mobile hamburger menu toggle (md:hidden button + hidden md:flex nav).`
    } else if (isTS) {
      fileRules = `- Write valid TypeScript. Use 'export' for modules. Import from relative paths (e.g. './utils'). DOM manipulation must be type-safe (use 'as HTMLElement' if needed). ALL functions must have explicit return types. IMPORTANT: Do NOT access DOM elements at the top level. Wrap all DOM access in exported functions (e.g. init() or render()). Each component MUST export a render function that takes a container: HTMLElement parameter.`
    }
    if (isJSON) fileRules = `- Return valid JSON only.`
    if (fileExt === 'css') fileRules = `- Write valid CSS. Define CSS custom properties in :root for design tokens. Use @tailwind directives if applicable.`

    // Build special orchestration hint for critical connector files
    let orchestrationHint = ""
    if (currentTask.filename === 'src/main.ts') {
      const componentFiles = previousFiles
        .filter(f => f.name.includes('components/') && f.name.endsWith('.ts'))
        .map(f => f.name)
      orchestrationHint = `\n\n**CRITICAL — YOU ARE GENERATING THE APPLICATION ENTRY POINT (main.ts):**
You MUST import and initialize EVERY component. The components to import are: [${componentFiles.join(', ')}].
Pattern:
\`\`\`
import './style.css'
import { renderHeader } from './components/header'
import { renderFooter } from './components/footer'
// ... import ALL components
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app')
  if (!app) return
  // call each component's render/init function
})
\`\`\`
If you skip any component import, the site will be broken.\n`
    }
    if (currentTask.filename === 'index.html') {
      orchestrationHint = `\n\n**CRITICAL — YOU ARE GENERATING THE HTML SHELL (index.html):**
This file MUST include:
1. \`<script type="module" src="/src/main.ts"></script>\` — this loads the entire app
2. A \`<div id="app"></div>\` container where components render
3. \`<script src="https://cdn.tailwindcss.com"></script>\` for Tailwind
Keep this file MINIMAL. All dynamic content is rendered by TypeScript components via main.ts.\n`
    }

    let systemPrompt = promptTemplate
        .replace(/\{\{FILENAME\}\}/g, currentTask.filename)
        .replace(/\{\{USEDFOR\}\}/g, currentTask.usedFor)
        .replace("{{FILE_STRUCTURE}}", FILE_STRUCTURE)
        .replace("{{FILE_CONTEXT}}", fileContext)
        .replace("{{DESIGN_SYSTEM}}", designSystem || "No design system established yet. If generating style.css, define CSS custom properties for the project.")
        .replace("{{FILE_EXT}}", fileExt.toUpperCase())
        .replace("{{FILE_RULES}}", fileRules)
        // Legacy fallback -- if the prompt still has {{MEMORY}}, fill it
        .replace("{{MEMORY}}", shortTermMemory) + orchestrationHint + projectMemory

    // 3. Call AI
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
