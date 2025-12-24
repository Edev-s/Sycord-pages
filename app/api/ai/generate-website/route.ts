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
    // Looking for [N] filename : description
    // ignoring [0] (overview) and [Done]
    const taskRegex = /\[(\d+)\]\s*([\w\-\.]+)\s*:/g
    let match
    let currentTask = null
    let taskNumber = null

    // We loop to find the first one that hasn't been replaced by "Done" logic (which would presumably change the marker)
    // Actually the logic is: find the first [N].
    // If the instruction string has [Done] replacing [N], then the regex won't match [N].
    // So the first match of `[\d+]` is our next task. (Assuming [0] is the overview, we might skip it if needed, but user said [0] is base plan. The file tasks start at [1]?)
    // User said: "[0] The user base plan... [1] name.html"
    // So we skip [0].

    while ((match = taskRegex.exec(instruction)) !== null) {
        if (match[1] === "0") continue; // Skip overview
        currentTask = {
            fullMatch: match[0],
            number: match[1],
            filename: match[2].trim(),
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

    // 2. Prepare System Prompt
    const systemPrompt = `
      ${UI_UX_PROMPT}

      CRITICAL: You MUST generate valid, complete HTML/CSS/JS code for the requested file.

      CURRENT FILE: ${currentTask.filename}
      CONTEXT: ${currentTask.description}

      CONSISTENCY & CONNECTION RULES:
      1.  **Unified Design**: You are building a *single* cohesive website.
      2.  **Inherit Layout**: If 'index.html' or other files exist in the history, you MUST use the EXACT SAME Navigation Bar, Footer, Layout Structure, Fonts, and Color Palette. Do not reinvent the style.
      3.  **Functional Links**: Ensure navigation links point correctly to the other files in the plan (e.g., <a href="index.html">Home</a>).
      4.  **Shared Resources**: Use the same CDN links (Tailwind, FontAwesome, etc.) as previous files.

      MARKER INSTRUCTIONS:
      Wrap code EXACTLY like this with NO backticks:
      [1]
      ... content ...
      [1<${currentTask.filename}>]

      REQUIREMENTS:
      1. **Tailwind CSS**: You MUST use Tailwind CSS (https://tailwindcss.com/) for ALL styling. Do not use custom CSS classes unless absolutely necessary.
      2. **Functional Code**: CRITICAL: Do NOT generate functions that are empty or 'pass'. Every button and input MUST have working JavaScript logic (e.g., localStorage persistence, DOM manipulation, navigation). Do NOT use alerts for 'feature coming soon'. Build it or don't include it.
      3. **No Bloat**: Do NOT include 'Demo' sections, 'Lorem Ipsum', or placeholders that don't function. Only generate code that is relevant to the user's specific request.
      4. **Language**: The user prefers TypeScript. Generates files with `.ts` extension for logic. Use proper interfaces and types. If generating an HTML file, link to the `.ts` files.
      5. **Production Ready**: Code must be ready to deploy.
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
          { role: "user", content: `Generate code for ${currentTask.filename} based on the plan.` }
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

    // 4. Extract Code
    let extractedCode = null
    const markerRegex = /\[1\]([\s\S]*?)\[1<(.+?)>\]/
    const markerMatch = responseText.match(markerRegex)

    if (markerMatch) {
        extractedCode = markerMatch[1].trim()
    } else {
        // Fallback checks
        if (responseText.includes("<!DOCTYPE html") || responseText.includes("<html")) {
            extractedCode = responseText
        }
    }

    // 5. Update Instruction
    // Replace `[N]` with `[Done]`
    // The user prompt said "backend will help to identify... by replacing the number mark [1] with a [Done] mark"
    // So `[1] index.html` becomes `[Done] index.html`
    const updatedInstruction = instruction.replace(`[${currentTask.number}]`, `[Done]`)

    return NextResponse.json({
        content: responseText,
        code: extractedCode,
        pageName: currentTask.filename,
        updatedInstruction: updatedInstruction,
        isComplete: false
    })

  } catch (error: any) {
    console.error("[v0] Generation error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
