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
import { generateWithCache } from "@/lib/gemini-cache"

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
    if (isHTML) fileRules = `- Use <!DOCTYPE html>. Include <div id="root"></div> in <body>. Include <script type="module" src="/src/main.tsx"></script> before </body>. Do NOT include Tailwind CDN — Tailwind is processed via PostCSS. Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> for responsive viewport. Keep HTML minimal — React renders all content.`
    if (isTS && currentTask.filename === 'src/main.tsx') {
      fileRules = `- This is the REACT ENTRY POINT. Import './style.css' first. Import React, ReactDOM, and App. Render App into #root with ReactDOM.createRoot.`
    } else if (isTS && currentTask.filename === 'src/App.tsx') {
      fileRules = `- This is the ROOT COMPONENT. Import HeroUIProvider from @heroui/react. Wrap entire app in <HeroUIProvider>. Import and render ALL components from ./components/. Manage current section state with useState. Use dark mode: <main className="dark text-foreground bg-background">.`
    } else if (isTS && currentTask.filename.includes('components/')) {
      fileRules = `- Write React functional component (.tsx). MUST import and use HeroUI components from @heroui/react for ALL UI (Button, Card, Input, Navbar, etc.). NEVER use plain HTML <button>, <input>, <nav>. Use framer-motion for entrance animations: <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>. Use Tailwind responsive classes: grid-cols-1 md:grid-cols-2 lg:grid-cols-3. EVERY HeroUI Button MUST have onPress handler. Header MUST use HeroUI Navbar with NavbarMenuToggle for mobile.`
    } else if (isTS) {
      fileRules = `- Write valid TypeScript. Use 'export' for modules. Import from relative paths. ALL functions must have explicit return types.`
    }
    if (isJSON) fileRules = `- Return valid JSON only. package.json MUST include @heroui/react, framer-motion, react, react-dom in dependencies.`
    if (fileExt === 'css') fileRules = `- Write valid CSS. Start with @tailwind base; @tailwind components; @tailwind utilities; directives. Include html { scroll-behavior: smooth; }. Can include additional global styles.`
    if (fileExt === 'js' && currentTask.filename.includes('tailwind.config')) {
      fileRules = `- MUST import { heroui } from "@heroui/react". MUST include content paths for HeroUI theme: "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}". MUST include heroui() in plugins array. Use darkMode: "class".`
    }
    if (fileExt === 'js' && currentTask.filename.includes('postcss.config')) {
      fileRules = `- Export PostCSS config with tailwindcss and autoprefixer plugins.`
    }

    // Build special orchestration hint for critical connector files
    let orchestrationHint = ""
    if (currentTask.filename === 'src/main.tsx') {
      orchestrationHint = `\n\n**CRITICAL — YOU ARE GENERATING THE REACT ENTRY POINT (main.tsx):**
Pattern:
\`\`\`
import './style.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
\`\`\`\n`
    }
    if (currentTask.filename === 'src/App.tsx') {
      const componentFiles = previousFiles
        .filter(f => f.name.includes('components/') && (f.name.endsWith('.tsx') || f.name.endsWith('.ts')))
        .map(f => f.name)
      orchestrationHint = `\n\n**CRITICAL — YOU ARE GENERATING THE ROOT COMPONENT (App.tsx):**
You MUST import and render EVERY component. Components: [${componentFiles.join(', ')}].
MUST wrap in HeroUIProvider. MUST use dark mode. Pattern:
\`\`\`
import { HeroUIProvider } from "@heroui/react"
import Header from './components/Header'
// import ALL components
export default function App() {
  return (
    <HeroUIProvider>
      <main className="dark text-foreground bg-background min-h-screen">
        <Header />
        {/* all section components */}
      </main>
    </HeroUIProvider>
  )
}
\`\`\`\n`
    }
    if (currentTask.filename === 'index.html') {
      orchestrationHint = `\n\n**CRITICAL — YOU ARE GENERATING THE HTML SHELL (index.html):**
This file MUST include:
1. \`<script type="module" src="/src/main.tsx"></script>\` — this loads the React app
2. A \`<div id="root"></div>\` container where React mounts
Do NOT include Tailwind CDN. Tailwind is processed via PostCSS + tailwind.config.js.
Keep this file MINIMAL.\n`
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

    let responseText = ""

    // Try Gemini content cache for Google models (reduces latency and token cost)
    if (config.provider === "Google") {
      const cacheMessages = [
        ...conversationHistory,
        { role: "user", content: `Generate the full content for ${currentTask.filename}.` }
      ]
      const cachedResult = await generateWithCache(systemPrompt, cacheMessages, modelId)
      if (cachedResult) {
        responseText = cachedResult.text
        console.log(`[v0] Generation via Gemini cache (usedCache=${cachedResult.usedCache})`)
      }
    }

    // Fallback: standard OpenAI-compatible API call (or if cache miss)
    if (!responseText) {
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
      responseText = data.choices?.[0]?.message?.content || ""
    }

    // 4. Robust Parsing
    let extractedCode = ""
    const codeRegex = /\[code\]([\s\S]*?)(\[\/code\]|\[code\])/i
    const codeMatch = responseText.match(codeRegex)

    if (codeMatch) {
        extractedCode = codeMatch[1].trim()
    } else {
        const mdBlock = responseText.match(/```(?:typescript|tsx|ts|html|css|json|javascript|js|jsx)?\s*([\s\S]*?)```/)
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
