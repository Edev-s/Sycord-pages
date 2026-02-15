// ──────────────────────────────────────────────────────
// Gemini API Integration
// ──────────────────────────────────────────────────────
// Centralized Gemini client for all AI routes.
// Uses the latest gemini-2.5-pro for high-quality code generation
// and gemini-2.0-flash for fast operations (planning, auto-fix).
// ──────────────────────────────────────────────────────

import { GoogleGenerativeAI, type GenerateContentResult } from "@google/generative-ai"

// ── Model Configuration ──

export const GEMINI_MODELS = {
  /** High-quality code generation -- best reasoning & code quality */
  PRO: "gemini-2.5-pro-preview-06-05",
  /** Fast operations -- planning, auto-fix diagnosis, quick tasks */
  FLASH: "gemini-2.0-flash",
} as const

export type GeminiModelKey = keyof typeof GEMINI_MODELS

// ── Frontend model list (used by the builder UI) ──
export interface ModelOption {
  id: string
  name: string
  provider: string
  description: string
  geminiModel: string
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Best quality, slower",
    geminiModel: GEMINI_MODELS.PRO,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    description: "Fast, good quality",
    geminiModel: GEMINI_MODELS.FLASH,
  },
]

// ── API Client ──

function getApiKey(): string {
  const key = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
  if (!key) throw new Error("GOOGLE_AI_API or GOOGLE_API_KEY environment variable is not set")
  return key
}

function createClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(getApiKey())
}

/**
 * Resolve a frontend model ID to the actual Gemini model identifier.
 */
export function resolveModelId(frontendModelId: string): string {
  const found = AVAILABLE_MODELS.find(m => m.id === frontendModelId)
  if (found) return found.geminiModel

  // Direct mapping for legacy model IDs
  if (frontendModelId.includes("2.5") || frontendModelId.includes("pro")) {
    return GEMINI_MODELS.PRO
  }
  if (frontendModelId.includes("flash") || frontendModelId.includes("2.0")) {
    return GEMINI_MODELS.FLASH
  }

  // Default to Pro for best quality
  return GEMINI_MODELS.PRO
}

// ── Generation Functions ──

export interface GeminiGenerateOptions {
  /** The system prompt / instruction */
  systemPrompt: string
  /** User-facing conversation messages */
  messages?: Array<{ role: string; content: string }>
  /** Final user message to send */
  userMessage?: string
  /** Model to use (frontend ID or direct model string) */
  model?: string
  /** Temperature (0-2, default 0.2 for code) */
  temperature?: number
  /** Max output tokens */
  maxTokens?: number
}

/**
 * Generate content using the Gemini SDK directly.
 * This is the primary generation function for all AI routes.
 */
export async function generateWithGemini(options: GeminiGenerateOptions): Promise<string> {
  const {
    systemPrompt,
    messages = [],
    userMessage,
    model = GEMINI_MODELS.PRO,
    temperature = 0.15,
    maxTokens = 65536,
  } = options

  const resolvedModel = resolveModelId(model)
  const client = createClient()

  const genModel = client.getGenerativeModel({
    model: resolvedModel,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
    systemInstruction: systemPrompt,
  })

  // Build conversation parts
  const parts: string[] = []

  // Add conversation history
  for (const msg of messages) {
    parts.push(`${msg.role.toUpperCase()}: ${msg.content}`)
  }

  // Add final user message
  if (userMessage) {
    parts.push(userMessage)
  }

  const prompt = parts.join("\n\n")

  const result: GenerateContentResult = await genModel.generateContent(prompt)
  const response = result.response
  return response.text()
}

/**
 * Generate with the PRO model specifically (for code generation).
 * Uses lower temperature for more deterministic code output.
 */
export async function generateCode(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
  frontendModelId?: string
): Promise<string> {
  return generateWithGemini({
    systemPrompt,
    messages,
    userMessage,
    model: frontendModelId || GEMINI_MODELS.PRO,
    temperature: 0.1,
    maxTokens: 65536,
  })
}

/**
 * Generate with the FLASH model (for planning and quick tasks).
 * Uses slightly higher temperature for creative planning.
 */
export async function generatePlan(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  return generateWithGemini({
    systemPrompt,
    userMessage,
    model: GEMINI_MODELS.FLASH,
    temperature: 0.3,
    maxTokens: 16384,
  })
}

/**
 * Generate with FLASH for auto-fix diagnosis (fast turnaround).
 */
export async function generateFix(
  systemPrompt: string
): Promise<string> {
  return generateWithGemini({
    systemPrompt,
    model: GEMINI_MODELS.FLASH,
    temperature: 0.1,
    maxTokens: 32768,
  })
}
