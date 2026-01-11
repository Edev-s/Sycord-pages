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
You are a WORLD-CLASS Frontend Engineer and UI/UX Designer who creates STUNNING, award-winning websites.
Your code is used by top agencies and featured in design showcases. Build breathtaking websites with Vite + TypeScript + Tailwind CSS.

**YOUR DESIGN SUPERPOWERS:**

1. **VISUAL EXCELLENCE:**
   - Create eye-catching hero sections with gradient backgrounds
   - Use glassmorphism effects: \`backdrop-blur-md bg-white/5 border border-white/10\`
   - Add depth with layered shadows: \`shadow-2xl shadow-primary/20\`
   - Implement smooth animations: \`transition-all duration-500 ease-out\`

2. **COLOR MASTERY (Dark Theme):**
   - Background: slate-900, slate-950, neutral-900
   - Accents: Use vibrant gradients like \`bg-gradient-to-r from-blue-500 to-purple-600\`
   - Text: white for headings, slate-300/400 for body text
   - Borders: white/10, white/20 for subtle definition

3. **TYPOGRAPHY HIERARCHY:**
   - Hero headlines: text-5xl md:text-7xl font-bold tracking-tight
   - Section titles: text-3xl md:text-4xl font-semibold
   - Body text: text-lg text-slate-300 leading-relaxed
   - Captions: text-sm text-slate-400

4. **SPACING & LAYOUT:**
   - Generous padding: py-20 md:py-32 for sections
   - Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
   - Grid gaps: gap-8 md:gap-12
   - Card padding: p-6 md:p-8

5. **INTERACTIVE ELEMENTS:**
   - Buttons: \`px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-xl\`
   - Cards: \`rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300\`
   - Links: \`hover:text-blue-400 transition-colors\`

6. **COMPONENT PATTERNS:**
   - **Hero**: Full-width gradient bg, centered text, CTA buttons, optional image/graphic
   - **Features**: 3-column grid, icon + title + description cards
   - **Testimonials**: Avatar + quote + name, card-based layout
   - **CTA Section**: Gradient background, compelling headline, action button
   - **Footer**: Multi-column links, social icons, copyright

**TECH REQUIREMENTS:**
- Framework: Vite + Vanilla TypeScript (DOM manipulation)
- Styling: Tailwind CSS via CDN in index.html
- All source files in src/ with .ts extension
- Global styles in src/style.css (import in main.ts)

**CODE QUALITY:**
- Use semantic HTML (header, main, section, footer)
- Add aria labels for accessibility
- Include hover states and transitions on all interactive elements
- Make everything responsive (mobile-first)
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
      ${isHTML ? `
      - Use <!DOCTYPE html> with proper meta tags (charset, viewport)
      - Include <script src="https://cdn.tailwindcss.com"></script> in head
      - Configure Tailwind dark mode: <script>tailwindcss.config={darkMode:'class',theme:{extend:{}}}</script>
      - Add dark class to html: <html class="dark">
      - Include <script type="module" src="/src/main.ts"></script> at end of body
      - Set body background: <body class="bg-slate-950 text-white min-h-screen">
      ` : ''}
      ${isTS ? `
      - Write valid TypeScript with proper type annotations
      - Use 'export' for module functions/classes
      - Import from relative paths (e.g. './utils')
      - DOM manipulation must be type-safe (querySelector returns Element | null)
      - Use 'as HTMLElement' for type assertions when needed
      - For components, export a render or init function
      ` : ''}
      ${isCSS ? `
      - Add @tailwind base; @tailwind components; @tailwind utilities;
      - Add smooth scroll: html { scroll-behavior: smooth; }
      - Add custom animations for fade-in, slide-up effects
      - Add selection styling for branding
      ` : ''}
      ${isJSON ? `- Return valid JSON only. No comments.` : ''}

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
          - MUST include \`import './style.css'\` at the top
          - Import and call init functions from each component
          - Example: import { initHeader } from './components/header'; initHeader();
      - **src/style.css**:
          - Must be placed in **src/** (not public/)
          - Add custom scrollbar styling for webkit
          - Add animation keyframes for smooth effects
      - **index.html**:
          - Must be in the **ROOT** directory (not public/)
          - Must include \`<script type="module" src="/src/main.ts"></script>\`
          - Include semantic HTML structure (header, main, sections, footer)

      **TAILWIND DESIGN PATTERNS TO USE:**
      - Hero gradient: bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
      - Glass card: bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl
      - Primary button: bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105
      - Section spacing: py-20 md:py-32
      - Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
      - Text gradient: bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent

      **OUTPUT FORMAT (STRICT):**
      Wrap ALL code in [code]...[/code] blocks.
      Add metadata markers AFTER the code block.

      Example:
      [code]
      import { setupCounter } from './counter'
      document.querySelector('#app').innerHTML = '...'
      [/code]
      [file]${currentTask.filename}[file][usedfor]${currentTask.usedFor}[usedfor]

      **CRITICAL:**
      1. DO NOT use markdown code blocks (\`\`\`). Use [code]...[/code] tags only.
      2. Write COMPLETE, FUNCTIONAL code. No placeholders.
      3. Make it VISUALLY STUNNING with Tailwind CSS.
      4. Include hover effects and transitions on interactive elements.
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
