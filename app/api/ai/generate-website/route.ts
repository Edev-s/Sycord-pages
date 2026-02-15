import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  FILE_STRUCTURE,
  getFileContext,
  extractDesignSystem,
  type GeneratedFile,
} from "@/lib/ai-memory"
import { getSystemPrompts } from "@/lib/ai-prompts"
import { generateCode, resolveModelId } from "@/lib/gemini"
import { getRAGContext } from "@/lib/rag-knowledge"

// ──────────────────────────────────────────────────────
// POST /api/ai/generate-website
// ──────────────────────────────────────────────────────
// Generates a single file at a time using Gemini 2.5 Pro
// with RAG-augmented context from the knowledge base and
// full cross-file awareness from previously generated code.
// ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, instruction, model, generatedPages, userPrompt } = await request.json()

    // ── Parse previously generated files for cross-file context ──
    const previousFiles: GeneratedFile[] = Array.isArray(generatedPages)
      ? generatedPages.map((p: { name: string; code: string }) => ({
          name: p.name,
          code: p.code,
        }))
      : []

    // ── Find the next file to generate from the instruction ──
    const taskRegex = /\[(\d+)\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g
    let match
    let currentTask: { fullMatch: string; number: string; filename: string; usedFor: string } | null = null

    while ((match = taskRegex.exec(instruction)) !== null) {
      if (match[1] === "0") continue
      currentTask = {
        fullMatch: match[0],
        number: match[1],
        filename: match[2].trim(),
        usedFor: match[3]?.trim() || "Implementation",
      }
      break
    }

    // All files generated
    if (!currentTask) {
      return NextResponse.json({
        isComplete: true,
        updatedInstruction: instruction,
      })
    }

    console.log(`[AI] Generating: ${currentTask.filename} [${currentTask.number}] with model: ${model || 'gemini-2.5-pro'}`)

    // ── Determine file type for type-specific rules ──
    const fileExt = currentTask.filename.split(".").pop() || ""
    const isTS = fileExt === "ts" || fileExt === "tsx"
    const isHTML = fileExt === "html"
    const isJSON = fileExt === "json"
    const isCSS = fileExt === "css"

    let fileRules = ""
    if (isHTML) {
      fileRules = [
        "- Use <!DOCTYPE html> with lang attribute.",
        '- Include <script src="https://cdn.tailwindcss.com"></script>.',
        '- Include <script type="module" src="/src/main.ts"></script>.',
        "- Add proper <meta> tags for SEO and viewport.",
        "- Use semantic HTML elements.",
      ].join("\n")
    } else if (isTS) {
      fileRules = [
        "- Write valid, strict TypeScript with explicit return types on ALL functions.",
        "- Use 'export' for all public APIs.",
        "- Import from relative paths (e.g., './utils', '../types').",
        "- DOM manipulation must be type-safe (use querySelector<HTMLElement> generics).",
        "- Define proper interfaces for all function parameters.",
        "- Use 'as const' for literal arrays and objects where appropriate.",
      ].join("\n")
    } else if (isJSON) {
      fileRules = "- Return valid JSON only. No comments, no trailing commas."
    } else if (isCSS) {
      fileRules = [
        "- Define CSS custom properties in :root for design tokens.",
        "- Include @tailwind base; @tailwind components; @tailwind utilities; directives.",
        "- Add animation keyframes for scroll-reveal effects.",
        "- Include a .container utility class.",
        "- Add :focus-visible styles for accessibility.",
      ].join("\n")
    } else {
      fileRules = "- Follow standard formatting for this file type."
    }

    // ── Build rich context layers ──
    const fileContext = getFileContext(previousFiles)
    const designSystem = extractDesignSystem(previousFiles)
    const ragContext = getRAGContext(
      currentTask.filename,
      currentTask.usedFor,
      userPrompt || messages?.[0]?.content || "",
      4
    )

    // ── Fetch the system prompt template ──
    const { builderCode: promptTemplate } = await getSystemPrompts()

    // ── Inject all variables into the prompt ──
    const systemPrompt = promptTemplate
      .replace("{{FILENAME}}", currentTask.filename)
      .replace("{{USEDFOR}}", currentTask.usedFor)
      .replace("{{FILE_STRUCTURE}}", FILE_STRUCTURE)
      .replace("{{FILE_CONTEXT}}", fileContext)
      .replace(
        "{{DESIGN_SYSTEM}}",
        designSystem || "No design system yet. If generating style.css, define CSS custom properties."
      )
      .replace("{{FILE_EXT}}", fileExt.toUpperCase())
      .replace("{{FILE_RULES}}", fileRules)
      // Append RAG context after the main prompt
      + "\n\n" + ragContext

    // ── Build conversation history ──
    const conversationHistory = (messages || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }))

    // ── Call Gemini ──
    const responseText = await generateCode(
      systemPrompt,
      conversationHistory,
      `Generate the full, complete content for the file: ${currentTask.filename}. Purpose: ${currentTask.usedFor}. Output ONLY the code wrapped in [code]...[code] tags followed by [file] and [usedfor] metadata markers.`,
      model || "gemini-2.5-pro"
    )

    // ── Robust code extraction ──
    let extractedCode = ""

    // Try [code]...[code] format first
    const codeRegex = /\[code\]([\s\S]*?)(\[\/code\]|\[code\])/i
    const codeMatch = responseText.match(codeRegex)

    if (codeMatch) {
      extractedCode = codeMatch[1].trim()
    } else {
      // Fallback: markdown code blocks
      const mdBlock = responseText.match(
        /```(?:typescript|ts|html|css|json|javascript|js|gitignore|markdown|md)?\s*([\s\S]*?)```/
      )
      if (mdBlock) {
        extractedCode = mdBlock[1].trim()
      } else {
        // Last resort: use the full response, cleaned
        extractedCode = responseText.trim()
      }
    }

    // Clean metadata markers from code
    extractedCode = extractedCode
      .replace(/\[file\].*?\[file\]/g, "")
      .replace(/\[usedfor\].*?\[usedfor\]/g, "")
      .trim()

    // ── Mark task as done in instruction ──
    const updatedInstruction = instruction.replace(`[${currentTask.number}]`, "[Done]")

    return NextResponse.json({
      content: responseText,
      code: extractedCode,
      pageName: currentTask.filename,
      usedFor: currentTask.usedFor,
      updatedInstruction,
      isComplete: false,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Generation failed"
    console.error("[AI] Generation error:", message)
    return NextResponse.json({ message }, { status: 500 })
  }
}
