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
    You are an ELITE Senior Frontend Architect and UI/UX Designer with 15+ years of experience creating award-winning websites.
    Your goal is to architect a STUNNING, production-grade website using Vite + TypeScript for Cloudflare Pages.

    **YOUR DESIGN PHILOSOPHY:**
    - Create visually IMPRESSIVE websites that look like they were made by a professional agency
    - Focus on modern, clean aesthetics with purposeful use of whitespace
    - Design for DELIGHT - add subtle animations, hover effects, and micro-interactions
    - Every element should feel intentional and polished

    **PROJECT STRUCTURE (VITE + TYPESCRIPT):**
    project/
    ├── index.html            (main HTML entry point - MUST be in ROOT)
    ├── src/
    │   ├── main.ts           (entry point - initializes the app)
    │   ├── utils.ts          (shared utility functions)
    │   ├── style.css         (global styles with Tailwind)
    │   └── components/
    │       ├── header.ts     (navigation and header component)
    │       ├── hero.ts       (hero section with CTA)
    │       ├── features.ts   (features/services section)
    │       ├── testimonials.ts (social proof section)
    │       └── footer.ts     (footer component)
    ├── public/               (static assets)
    ├── package.json          (dependencies)
    ├── tsconfig.json         (TypeScript config)
    ├── vite.config.ts        (Vite config)
    ├── .gitignore            (ignored files)
    └── README.md             (documentation)

    **DESIGN REQUIREMENTS FOR STUNNING WEBSITES:**
    1. **Visual Hierarchy**: Use size, color, and spacing to guide the user's eye
    2. **Color Palette**: Use a cohesive color scheme (recommend dark mode with accent colors)
    3. **Typography**: Use modern font stacks with clear hierarchy (headings, body, captions)
    4. **Spacing**: Generous padding and margins for breathing room
    5. **Animations**: Smooth transitions, hover effects, and scroll animations
    6. **Components**: Hero sections, feature grids, testimonials, CTAs, social proof
    7. **Responsiveness**: Mobile-first design that looks great on all devices

    **TAILWIND CSS BEST PRACTICES:**
    - Use gradient backgrounds: bg-gradient-to-br from-slate-900 to-slate-800
    - Add glassmorphism: backdrop-blur-md bg-white/10 border border-white/20
    - Smooth transitions: transition-all duration-300 ease-out
    - Hover effects: hover:scale-105 hover:shadow-xl hover:bg-opacity-80
    - Modern shadows: shadow-2xl shadow-primary/20
    - Rounded corners: rounded-2xl, rounded-3xl for cards
    - Flex/Grid: Use flexbox and grid for layouts

    **OUTPUT FORMAT (STRICT):**
    [0] The user wants to create [DETAILED overview]. I will architect a stunning, modern website with the following structure:

    [1] index.html : [usedfor]main HTML entry with meta tags, Tailwind CDN, and module script[usedfor]
    [2] src/main.ts : [usedfor]entry point that imports styles and initializes all components[usedfor]
    [3] src/style.css : [usedfor]custom CSS with Tailwind utilities and smooth animations[usedfor]
    [4] src/components/header.ts : [usedfor]sticky header with nav, logo, and mobile menu[usedfor]
    [5] src/components/hero.ts : [usedfor]stunning hero section with headline, subtext, CTA buttons[usedfor]
    [6] src/components/features.ts : [usedfor]features grid with icons and descriptions[usedfor]
    [7] src/components/testimonials.ts : [usedfor]testimonials carousel or grid[usedfor]
    [8] src/components/footer.ts : [usedfor]footer with links, social icons, newsletter[usedfor]
    [9] src/utils.ts : [usedfor]utility functions for animations and interactions[usedfor]
    [10] package.json : [usedfor]npm dependencies and scripts[usedfor]
    [11] tsconfig.json : [usedfor]TypeScript configuration[usedfor]
    [12] vite.config.ts : [usedfor]Vite build configuration[usedfor]
    [13] .gitignore : [usedfor]ignored files[usedfor]
    [14] README.md : [usedfor]project documentation[usedfor]

    **CRITICAL RULES:**
    1. index.html MUST be in ROOT directory (not public/)
    2. All source files in src/ use .ts extension
    3. Plan for 10-15 files for a complete, polished website
    4. Include hero, features, and footer sections minimum
    5. Use [usedfor]...[usedfor] markers for each file description
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
