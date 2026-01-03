import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// API Configurations
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

// Map models to their specific endpoints and Env Vars
const MODEL_CONFIGS: Record<string, { url: string, envVar: string, provider: string }> = {
  "gemini-2.0-flash": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "gemini-2.5-flash-lite": { url: GOOGLE_API_URL, envVar: "GOOGLE_AI_API", provider: "Google" },
  "deepseek-v3.2-exp": { url: DEEPSEEK_API_URL, envVar: "DEEPSEEK_API", provider: "DeepSeek" }
}

// File type templates for different Vite project files
const FILE_TEMPLATES: Record<string, { extension: string, template: string }> = {
  "public/index.html": {
    extension: "html",
    template: `Complete HTML with <!DOCTYPE html>, Tailwind CDN, and script type="module" pointing to /src/main.ts`
  },
  "src/main.ts": {
    extension: "ts",
    template: `TypeScript entry point that imports and initializes components`
  },
  "src/components": {
    extension: "ts",
    template: `TypeScript component exporting a function that returns/renders HTML`
  },
  "src/utils.ts": {
    extension: "ts",
    template: `TypeScript utility functions with proper types`
  },
  "public/style.css": {
    extension: "css",
    template: `Tailwind CSS directives and custom styles`
  },
  "package.json": {
    extension: "json",
    template: `Vite project package.json with proper scripts`
  }
}

const UI_UX_PROMPT = `
Set prompt : Here is a clean, text-only, large styling prompt with no formatting, no emojis, no markdown, ready to copy and paste anywhere.

You are a senior UI/UX designer and front-end stylist. Your task is to design the complete visual style and user experience of a modern web application.

The interface must feel fast, clean, professional, and intuitive. The design should be minimalist, avoiding clutter while maintaining strong visual hierarchy and clarity. Accessibility and readability are top priorities.

Use a modern sans-serif font with a clear typographic hierarchy. Page titles should be prominent, section headers clearly separated, body text comfortable to read, and small helper text still legible. Use font weight and spacing to create hierarchy rather than excessive color variation. Limit font families to a maximum of two. Use a monospace font only for code, logs, or technical data.

Define a structured color system. Choose a primary color for main actions and highlights, a secondary color for accents, and a neutral grayscale palette for backgrounds, borders, and text. Include clear success, warning, error, and informational colors. Avoid pure black and pure white; use softened tones. The color system must be compatible with dark mode, even if dark mode is not enabled.

Layout must be responsive and mobile-first. Use a grid-based structure with consistent padding and margins. Content should be centered within a maximum width on large screens. Separate sections using spacing instead of heavy borders. Use cards to group related content. Headers may remain sticky while scrolling.

Navigation should be simple and intuitive. Clearly indicate the active page. On desktop, use a horizontal navigation bar. On mobile, use a hamburger menu or bottom navigation. Avoid unnecessary menu items. Support breadcrumbs for deeper navigation levels.

Buttons must have clear variants: primary, secondary, outline, and danger. All buttons must include hover, active, disabled, and loading states. Corners should be slightly rounded. Buttons should support icons alongside text. Hover effects should be subtle and responsive.

Forms and inputs must be easy to use and accessible. Inputs should be large enough for touch interaction. Labels must always be visible and not rely solely on placeholders. Focus states must be clearly visible. Display inline validation messages with helpful guidance. Error states should be clear and non-ambiguous. Support password visibility toggles and autofill behavior.

Cards and containers should use subtle elevation through soft shadows or light borders. Corner radius should be consistent throughout the application. Interactive cards should include hover feedback. Padding should scale appropriately across screen sizes.

Modals and popups must be centered with background dimming. Provide a clear close action and support closing with the Escape key. Avoid blocking modals unless necessary. Animations should be smooth and quick. Modal content must never exceed viewport height.

Tables and lists should be clean and readable. Use subtle row dividers or alternating backgrounds. Table headers should remain visible when scrolling long content. Tables must adapt to smaller screens by collapsing or stacking content. Row hover states should be visible when interactive.

Icons must be consistent in style and size. Use icons to reinforce meaning, not as decoration. SVG icons are preferred. Images should be optimized, responsive, and purposeful.

Animations and interactions should feel natural and fast. Use short transitions with smooth easing. No animation should exceed 300 milliseconds. Provide visual feedback for hover, click, success, error, and loading states. Prefer skeleton loaders over spinners when possible.

All states must be clearly handled. Provide loading states for asynchronous actions. Empty states should include helpful explanations or next steps. Error states must explain what went wrong and how the user can resolve it. Success feedback should be visible but non-disruptive.

The application must work flawlessly on mobile, tablet, and desktop devices. All interactive elements must be touch-friendly. Avoid horizontal scrolling. Typography and spacing should adapt smoothly to screen size.

Overall, the interface should feel reliable, calm, and professional. It should support long usage sessions without fatigue, feel performant even under load, and scale visually as the application grows.
`

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, instruction, model } = await request.json()

    // Default to Google if not specified
    const modelId = model || "gemini-2.5-flash-lite"
    const config = MODEL_CONFIGS[modelId] || MODEL_CONFIGS["gemini-2.5-flash-lite"]

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
    // Using non-greedy matching to handle content with brackets
    const taskRegex = /\[(\d+)\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g
    let match
    let currentTask = null

    while ((match = taskRegex.exec(instruction)) !== null) {
        if (match[1] === "0") continue; // Skip overview
        currentTask = {
            fullMatch: match[0],
            number: match[1],
            filename: match[2].trim(),
            usedFor: match[3]?.trim() || instruction.substring(match.index + match[0].length).split('\n')[0].trim(),
            description: instruction.substring(match.index + match[0].length).split('\n')[0]
        }
        break; // Stop at first valid file task
    }

    if (!currentTask) {
        // No more tasks
        return NextResponse.json({
            isComplete: true,
            updatedInstruction: instruction
        })
    }

    console.log(`[v0] Generating file: ${currentTask.filename} (Task [${currentTask.number}])`)
    console.log(`[v0] File purpose: ${currentTask.usedFor}`)

    // Determine file type and appropriate generation instructions
    const fileExt = currentTask.filename.split('.').pop() || ''
    const isTypeScript = fileExt === 'ts'
    const isHTML = fileExt === 'html'
    const isCSS = fileExt === 'css'
    const isJSON = fileExt === 'json'
    const isMD = fileExt === 'md'

    // 2. Prepare System Prompt based on file type
    let fileSpecificInstructions = ''
    
    if (isHTML) {
      fileSpecificInstructions = `
      Generate a complete HTML file with:
      - <!DOCTYPE html>, <html>, <head>, <body> tags
      - Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
      - For Vite projects, include: <script type="module" src="/src/main.ts"></script>
      - Use semantic HTML5 elements
      - Make it responsive and accessible
      `
    } else if (isTypeScript) {
      fileSpecificInstructions = `
      Generate TypeScript code with:
      - Proper type annotations for all functions and variables
      - Export functions/classes that need to be imported elsewhere
      - Use modern ES6+ syntax
      - If this is a component, export a render function that returns HTML string or manipulates DOM
      - Include JSDoc comments for complex functions
      - Use Tailwind CSS classes in any HTML strings
      `
    } else if (isCSS) {
      fileSpecificInstructions = `
      Generate CSS with:
      - @tailwind directives if using Tailwind: @tailwind base; @tailwind components; @tailwind utilities;
      - Custom utility classes using Tailwind's @apply if needed
      - CSS variables for theming
      - Mobile-first responsive styles
      `
    } else if (isJSON) {
      fileSpecificInstructions = `
      Generate valid JSON. For package.json include:
      - "name", "version", "type": "module"
      - "scripts" with "dev": "vite", "build": "vite build", "preview": "vite preview"
      - "devDependencies" with "vite": "^5.0.0", "typescript": "^5.0.0"
      `
    } else if (isMD) {
      fileSpecificInstructions = `
      Generate Markdown documentation with:
      - Project title and description
      - Installation instructions
      - Usage examples
      - File structure overview
      `
    }

    const systemPrompt = `
      ${UI_UX_PROMPT}

      CRITICAL: You are generating files for a Vite + TypeScript project deployable to Cloudflare Pages.

      CURRENT FILE: ${currentTask.filename}
      FILE PURPOSE: ${currentTask.usedFor}
      FILE TYPE: ${fileExt.toUpperCase()}

      ${fileSpecificInstructions}

      CONSISTENCY & CONNECTION RULES:
      1.  **Unified Design**: You are building a *single* cohesive website.
      2.  **Inherit Layout**: Match the style, colors, and design patterns from other files in the plan.
      3.  **Proper Imports**: TypeScript files should import from proper relative paths.
      4.  **Shared Resources**: Use consistent Tailwind classes across all files.

      MARKER INSTRUCTIONS:
      Wrap your code EXACTLY like this with NO backticks or markdown code blocks:
      [code]
      ... your complete code here ...
      [code][file]${currentTask.filename}[file][usedfor]${currentTask.usedFor}[usedfor]

      REQUIREMENTS:
      1. **Tailwind CSS**: Use Tailwind CSS utility classes. For HTML files, include CDN. For CSS files, use @tailwind directives.
      2. **Functional Code**: Every function must have working logic. No empty stubs or placeholders.
      3. **TypeScript**: Use proper types. Export what needs to be imported elsewhere.
      4. **Production Ready**: Code must work without build errors.
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
          { role: "user", content: `Generate code for ${currentTask.filename} based on the plan. This file is for: ${currentTask.usedFor}` }
      ],
      temperature: 0.7
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

    // 4. Extract Code using new marker format
    let extractedCode = null
    let extractedFile = currentTask.filename
    let extractedUsedFor = currentTask.usedFor

    // Try new format first: [code]...[code][file]...[file][usedfor]...[usedfor]
    // Using non-greedy (.*?) matching for content that may contain brackets
    const newMarkerRegex = /\[code\]([\s\S]*?)\[code\](?:\[file\](.*?)\[file\])?(?:\[usedfor\](.*?)\[usedfor\])?/
    const newMarkerMatch = responseText.match(newMarkerRegex)

    if (newMarkerMatch) {
        let rawCode = newMarkerMatch[1].trim()
        
        // Remove markdown code blocks if present
        const markdownBlockRegex = /```(?:typescript|ts|js|jsx|tsx|html|css|json|md)?\s*([\s\S]*?)```/
        const codeBlockMatch = rawCode.match(markdownBlockRegex)

        if (codeBlockMatch) {
            extractedCode = codeBlockMatch[1].trim()
        } else {
            extractedCode = rawCode
        }

        if (newMarkerMatch[2]) extractedFile = newMarkerMatch[2].trim()
        if (newMarkerMatch[3]) extractedUsedFor = newMarkerMatch[3].trim()
    } else {
        // Fallback to old format: [1]...[1<filename>]
        const oldMarkerRegex = /\[1\]([\s\S]*?)\[1<(.+?)>\]/
        const oldMarkerMatch = responseText.match(oldMarkerRegex)

        if (oldMarkerMatch) {
            let rawCode = oldMarkerMatch[1].trim()

            const markdownBlockRegex = /```(?:typescript|ts|js|jsx|tsx|html|css|json|md)?\s*([\s\S]*?)```/
            const codeBlockMatch = rawCode.match(markdownBlockRegex)

            if (codeBlockMatch) {
                extractedCode = codeBlockMatch[1].trim()
            } else {
                extractedCode = rawCode
            }
        } else {
            // Last resort fallback - look for recognizable code patterns
            if (responseText.includes("<!DOCTYPE html") || responseText.includes("<html")) {
                extractedCode = responseText
            } else if (responseText.includes("export ") || responseText.includes("function ") || responseText.includes("const ")) {
                // Extract TypeScript/JavaScript
                const cleanedCode = responseText.replace(/```(?:typescript|ts|js|jsx|tsx)?\s*/g, '').replace(/```/g, '').trim()
                extractedCode = cleanedCode
            }
        }
    }

    // 5. Update Instruction - Replace [N] with [Done]
    const updatedInstruction = instruction.replace(`[${currentTask.number}]`, `[Done]`)

    return NextResponse.json({
        content: responseText,
        code: extractedCode,
        pageName: extractedFile,
        usedFor: extractedUsedFor,
        updatedInstruction: updatedInstruction,
        isComplete: false
    })

  } catch (error: any) {
    console.error("[v0] Generation error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
