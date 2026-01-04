import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { FILE_STRUCTURE, getShortTermMemory } from "@/lib/ai-memory"

// API Configurations
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

// Map models to their specific endpoints and Env Vars
const MODEL_CONFIGS: Record<string, { url: string, envVar: string, provider: string }> = {
  "gemini-2.0-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-1.5-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "deepseek-v3.2-exp": { url: DEEPSEEK_API_URL, envVar: "DEEPSEEK_API", provider: "DeepSeek" }
}

const UI_UX_PROMPT = `
You are an expert Senior Frontend Engineer and UI/UX Designer specializing in **Vite, TypeScript, and Tailwind CSS**.
Your goal is to build a high-performance, production-ready website deployable to **Cloudflare Pages**.

**DESIGN SYSTEM & STYLING:**
*   **Modern Minimalist:** Clean, breathable layouts. fast, professional feel.
*   **Typography:** Sans-serif (Inter/system-ui) with clear hierarchy.
*   **Color Palette:** Professional, cohesive, accessible (WCAG AA). Dark mode first.
*   **Tailwind:** Use ONLY Tailwind utility classes. No custom CSS files unless absolutely necessary for complex animations.
*   **Responsiveness:** Mobile-first approach. Grid/Flexbox for layouts.

**TECH STACK:**
*   **Framework:** Vite (Vanilla TS or React-based if specified, but assume Vanilla TS + DOM manipulation for "simple" requests unless React is explicitly requested). *Actually, let's standardize on Vanilla TypeScript for maximum performance and simplicity in this builder unless otherwise specified.*
*   **Language:** TypeScript (Strict typing).
*   **Styling:** Tailwind CSS. **IMPORTANT:** Place all global styles in **src/style.css**. Do NOT put styles in public/.
*   **Imports:** In 'src/main.ts', you MUST import the styles using: \`import './style.css'\`.
`

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, instruction, model, projectId } = await request.json()

    // Default to Gemini 2.0 Flash
    const modelId = model || "gemini-2.0-flash"

    // Map "gemini-3-flash" or similar user requests to actual model
    let configKey = modelId
    if (modelId === "gemini-3-flash" || modelId === "gemini-3.0-flash") {
       configKey = "gemini-2.0-flash" // Map to latest available
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
    // Looking for [N] filepath : [usedfor]description[usedfor]
    // ignoring [0] (overview) and [Done]
    const taskRegex = /\[(\d+)\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g
    let match
    let currentTask = null

    // Find the first task that isn't "0" (Overview) and isn't marked as [Done]
    // We iterate through all matches
    while ((match = taskRegex.exec(instruction)) !== null) {
        if (match[1] === "0") continue;

        // Check if this specific task number is already marked done in the instruction string?
        // Actually, the calling code replaces [N] with [Done]. So if we see [N] where N is a number, it's pending.

        currentTask = {
            fullMatch: match[0],
            number: match[1],
            filename: match[2].trim(),
            usedFor: match[3]?.trim() || "Implementation"
        }
        break; // Stop at first pending task
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
    const isCSS = fileExt === 'css'

    // 2. Prepare System Prompt
    const shortTermMemory = getShortTermMemory(instruction)
    
    const systemPrompt = `
      ${UI_UX_PROMPT}

      **CURRENT TASK:**
      You are generating the file: **${currentTask.filename}**
      Purpose: **${currentTask.usedFor}**

      **PROJECT STRUCTURE (TARGET):**
      ${FILE_STRUCTURE}

      **MEMORY (CONTEXT):**
      ${shortTermMemory}

      **RULES FOR ${fileExt.toUpperCase()} GENERATION:**
      ${isHTML ? `- Use <!DOCTYPE html>. Include <script src="https://cdn.tailwindcss.com"></script>. Include <script type="module" src="/src/main.ts"></script>.` : ''}
      ${isTS ? `- Write valid TypeScript. Use 'export' for modules. Import from relative paths (e.g. './utils'). DOM manipulation must be type-safe (use 'as HTMLElement' if needed).` : ''}
      ${isJSON ? `- Return valid JSON only.` : ''}

      **SPECIFIC RULES PER FILE:**
      - **package.json**:
          - Must include "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview", "check": "tsc --noEmit" }
          - Must include dependencies: "vite", "typescript"
      - **tsconfig.json**:
          - Must include "compilerOptions": {
              "target": "ES2020",
              "lib": ["ES2020", "DOM", "DOM.Iterable"],
              "module": "ESNext",
              "moduleResolution": "Bundler",
              "strict": true,
              "skipLibCheck": true,
              "esModuleInterop": true,
              "useDefineForClassFields": true,
              "noEmit": true
          }
          - Must include "include": ["src"]
      - **vite.config.ts**:
          - Must include "build": { "outDir": "dist" }
          - Must export default defineConfig(...)
      - **.gitignore**:
          - Must include: node_modules/, dist/, *.log
      - **src/main.ts**:
          - MUST include \`import './style.css'\` at the top.
      - **src/style.css**:
          - Must be placed in **src/** (not public/).
      - **index.html**:
          - Must be in the **ROOT** directory (not public/).
          - Must include \`<script type="module" src="/src/main.ts"></script>\`.

      **OUTPUT FORMAT (STRICT):**
      You must wrap the code content in [code]...[code] blocks.
      You must add metadata markers AFTER the code block.

      Example:
      [code]
      import { setupCounter } from './counter'
      document.querySelector('#app').innerHTML = '...'
      [/code]
      [file]${currentTask.filename}[file][usedfor]${currentTask.usedFor}[usedfor]

      **IMPORTANT:**
      1. DO NOT use markdown code blocks (\`\`\`). Just use the [code] tags.
      2. Ensure the code is complete and functional.
      3. Do not include placeholders like "// rest of code". Write it all.
    `

    // 3. Call AI
    const conversationHistory = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
    }))

    const payload = {
      model: modelId === "gemini-3-flash" ? "gemini-2.0-flash" : modelId, // Ensure we send valid ID to Google
      messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: `Generate the full content for ${currentTask.filename}.` }
      ],
      temperature: 0.2 // Lower temperature for code stability
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

    // Attempt to find [code]...[/code] or [code]...[code]
    const codeRegex = /\[code\]([\s\S]*?)(\[\/code\]|\[code\])/i
    const codeMatch = responseText.match(codeRegex)

    if (codeMatch) {
        extractedCode = codeMatch[1].trim()
    } else {
        // Fallback: Try to strip markdown blocks if [code] tags failed
        const mdBlock = responseText.match(/```(?:typescript|ts|html|css|json|javascript|js)?\s*([\s\S]*?)```/)
        if (mdBlock) {
            extractedCode = mdBlock[1].trim()
        } else {
            // Fallback: Use entire response if it looks like code
            extractedCode = responseText.trim()
        }
    }

    // Clean up any remaining markers from the code content just in case
    extractedCode = extractedCode.replace(/\[file\].*?\[file\]/g, '').replace(/\[usedfor\].*?\[usedfor\]/g, '')

    // 5. Update Instruction (Mark as Done)
    const updatedInstruction = instruction.replace(`[${currentTask.number}]`, `[Done]`)

    return NextResponse.json({
        content: responseText, // Keep full response for chat history
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
