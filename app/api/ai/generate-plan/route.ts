import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const PLAN_MODEL = "gemini-2.0-flash"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages } = await request.json()

    // Use GOOGLE_AI_API by default, fallback to GOOGLE_API_KEY
    const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error("[v0] GOOGLE_AI_API (or GOOGLE_API_KEY) not configured")
      return NextResponse.json({ message: "AI service not configured (Google)" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: PLAN_MODEL,
    })

    const lastUserMessage = messages[messages.length - 1]

    // Construct prompt for Vite + TypeScript project structure
    const systemContext = `
    You are a Senior Technical Architect planning a production-grade website using Vite framework with TypeScript.
    Your goal is to create a detailed architectural plan following Cloudflare Pages Vite project structure.

    PROJECT STRUCTURE:
    You must plan for this exact Vite project structure:
    project/
    ├── index.html            (main HTML entry point - Vite requires this at root)
    ├── src/
    │   ├── main.ts           (entry point - initializes the app)
    │   ├── utils.ts          (shared utility functions)
    │   └── components/
    │       ├── header.ts     (navigation and header component)
    │       └── footer.ts     (footer component)
    ├── public/
    │   └── style.css         (global styles with Tailwind)
    ├── package.json          (project dependencies)
    ├── vite.config.ts        (Vite configuration for build)
    └── README.md             (project documentation)

    OUTPUT FORMAT:
    You must output a single text block strictly following this format:

    [0] The user wants to create [Brief overview]. As an AI web builder using Vite + TypeScript for Cloudflare Pages, I will generate files following proper project structure. The backend will mark completed files by replacing [N] with [Done].

    [1] index.html : [usedfor]main HTML entry point that loads the Vite app (must be at root for Vite)[usedfor]
    [2] src/main.ts : [usedfor]TypeScript entry point that initializes components[usedfor]
    [3] src/components/header.ts : [usedfor]reusable header/navigation component[usedfor]
    [4] src/components/footer.ts : [usedfor]reusable footer component[usedfor]
    [5] src/utils.ts : [usedfor]shared utility functions[usedfor]
    [6] public/style.css : [usedfor]global Tailwind CSS styles[usedfor]
    [7] package.json : [usedfor]npm dependencies and scripts for Vite[usedfor]
    [8] vite.config.ts : [usedfor]Vite build configuration[usedfor]
    [9] README.md : [usedfor]project documentation[usedfor]
    ...

    REQUIREMENTS:
    1.  **Vite Structure**: Follow the exact Vite project structure above. index.html MUST be at project root (not in public/).
    2.  **TypeScript**: All source files in src/ must use .ts extension and be properly typed.
    3.  **Components**: Create modular components in src/components/ directory.
    4.  **Tailwind CSS**: Use Tailwind CSS classes. Include CDN in index.html for simplicity.
    5.  **Strict Syntax**: Use brackets [1], [2], etc. for file steps. Include [usedfor]...[usedfor] markers.
    6.  **Scale**: Plan for a COMPLETE experience (6-12 files typically).
    7.  **Cloudflare Pages Ready**: Structure must be deployable to Cloudflare Pages with Vite.
    8.  **Config Files**: Always include package.json and vite.config.ts for proper build setup.
    9.  **main.ts Location**: Entry point must be at src/main.ts (not src/types/ or other locations).
    `

    // Combine history for context
    const historyText = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
    const finalPrompt = `${systemContext}\n\nCONVERSATION HISTORY:\n${historyText}\n\nRequest: ${lastUserMessage.content}`

    console.log(`[v0] Generating plan with Google model: ${PLAN_MODEL}`)

    const result = await model.generateContent(finalPrompt)
    const response = await result.response
    const responseText = response.text()

    // Return the raw instruction text
    return NextResponse.json({
      instruction: responseText,
    })
  } catch (error: any) {
    console.error("[v0] Plan generation error:", error)
    return NextResponse.json({ message: error.message || "Failed to generate plan" }, { status: 500 })
  }
}
