import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { FILE_STRUCTURE, getShortTermMemory, extractFileMetadata, isValidCode } from "@/lib/ai-memory"

// API Configurations
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

// Map models to their specific endpoints and Env Vars
const MODEL_CONFIGS: Record<string, { url: string, envVar: string, provider: string }> = {
  "gemini-3-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-2.0-flash-001": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
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
*   **Framework:** Vite (Vanilla TypeScript for maximum performance).
*   **Language:** TypeScript (Strict typing).
*   **Styling:** Tailwind CSS (via CDN in HTML, or in style.css).

**CRITICAL RULES:**
1.  Output ONLY valid code - no instructions, explanations, or comments outside the code.
2.  Do NOT include [file], [usedfor], or any bracket markers inside the actual code content.
3.  Metadata markers should appear ONLY after the [/code] closing tag.
4.  Never write "Step 1:", "TODO:", or instructional text as code content.
`

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, instruction, model } = await request.json()

    // Default to Gemini 3 Flash if not specified
    const modelId = model || "gemini-3-flash"
    const config = MODEL_CONFIGS[modelId] || MODEL_CONFIGS["gemini-3-flash"]

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
    while ((match = taskRegex.exec(instruction)) !== null) {
        if (match[1] === "0") continue

        currentTask = {
            fullMatch: match[0],
            number: match[1],
            filename: match[2].trim(),
            usedFor: match[3]?.trim() || "Implementation"
        }
        break // Stop at first pending task
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

    // 2. Prepare System Prompt with improved memory context
    const shortTermMemory = getShortTermMemory(instruction)
    
    const systemPrompt = `
      ${UI_UX_PROMPT}

      **CURRENT TASK:**
      You are generating the file: **${currentTask.filename}**
      Purpose: **${currentTask.usedFor}**

      **PROJECT STRUCTURE (TARGET):**
      ${FILE_STRUCTURE}

      **MEMORY (Previously generated files):**
      ${shortTermMemory}

      **RULES FOR ${fileExt.toUpperCase()} GENERATION:**
      ${isHTML ? `
      - Use <!DOCTYPE html> declaration
      - Include <script src="https://cdn.tailwindcss.com"></script> in head
      - Include <script type="module" src="/src/main.ts"></script> before </body>
      - Use semantic HTML5 elements
      ` : ''}
      ${isTS ? `
      - Write valid TypeScript with proper type annotations
      - Use 'export' for module exports
      - Import from relative paths (e.g. './utils', './components/header')
      - DOM queries must use type assertions (e.g. document.getElementById('app') as HTMLElement)
      ` : ''}
      ${isJSON ? `
      - Return valid JSON only
      - For package.json include: name, version, scripts (dev, build, preview), dependencies, devDependencies
      - Include vite and typescript as devDependencies
      ` : ''}
      ${isCSS ? `
      - Use Tailwind CSS utilities with @apply directive
      - Include global reset styles
      - Define CSS custom properties for theming
      ` : ''}

      **OUTPUT FORMAT (STRICT):**
      Wrap code in [code]...[/code] tags. Add metadata AFTER the closing tag.
      
      CORRECT FORMAT:
      [code]
      // actual code content here
      // NO metadata markers inside the code
      [/code]
      [file]${currentTask.filename}[file][usedfor]${currentTask.usedFor}[usedfor]

      **FORBIDDEN:**
      - Do NOT put [file], [usedfor], or any bracket markers inside the code content
      - Do NOT include markdown code blocks (\`\`\`)
      - Do NOT include instructional text like "Step 1:", "TODO:", etc.
      - Do NOT include explanatory comments that aren't part of actual code
    `

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
          { role: "user", content: `Generate the complete, production-ready content for ${currentTask.filename}. Output only the code wrapped in [code] tags.` }
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

    // 4. Robust Parsing with validation
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

    // Clean up: remove any metadata markers that might have leaked into code
    const cleanedResult = extractFileMetadata(extractedCode)
    extractedCode = cleanedResult.code

    // Validate code content
    if (!isValidCode(extractedCode)) {
        console.warn(`[v0] Warning: Generated content for ${currentTask.filename} may contain instructions instead of code`)
        // Still proceed but log warning
    }

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
