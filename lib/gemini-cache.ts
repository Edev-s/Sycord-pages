// ──────────────────────────────────────────────────────
// Gemini Content Cache — Long-Term Memory via Google AI
// ──────────────────────────────────────────────────────
// Uses Gemini's context caching API to store the large
// system prompt so it doesn't need to be re-processed
// on every request. This reduces latency and token cost.
// ──────────────────────────────────────────────────────

import { GoogleAICacheManager } from "@google/generative-ai/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { CachedContent } from "@google/generative-ai"

const CACHE_LOG_PREFIX = "[GEMINI-CACHE]"
const CACHE_DISPLAY_NAME = "sycord-builder-system-prompt"
const CACHE_TTL_SECONDS = 3600 // 1 hour TTL — auto-renewed on use
const CACHE_MODEL = "models/gemini-2.0-flash-001"

// In-memory reference to the active cache (avoids re-fetching on every request)
let activeCacheName: string | null = null
let activeCacheExpiry: number = 0

/**
 * Gets or creates a Gemini content cache for the builder system prompt.
 * The cache stores the large static system prompt so Gemini can reference
 * it without re-processing tokens on every API call.
 *
 * Returns the CachedContent object or null if caching is unavailable.
 */
export async function getOrCreateSystemPromptCache(
  systemPrompt: string
): Promise<CachedContent | null> {
  const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.warn(`${CACHE_LOG_PREFIX} No Google API key — skipping cache`)
    return null
  }

  try {
    const cacheManager = new GoogleAICacheManager(apiKey)

    // Check if we have a valid in-memory reference
    if (activeCacheName && Date.now() < activeCacheExpiry) {
      try {
        const existing = await cacheManager.get(activeCacheName)
        console.log(`${CACHE_LOG_PREFIX} Reusing existing cache: ${activeCacheName}`)
        return existing
      } catch {
        // Cache expired or was deleted — fall through to create new
        console.log(`${CACHE_LOG_PREFIX} Cached reference stale, creating new cache`)
        activeCacheName = null
      }
    }

    // Search for existing cache by display name
    const listResult = await cacheManager.list()
    const existingCache = listResult.cachedContents?.find(
      (c) => c.displayName === CACHE_DISPLAY_NAME
    )

    if (existingCache?.name) {
      activeCacheName = existingCache.name
      activeCacheExpiry = Date.now() + (CACHE_TTL_SECONDS * 1000) / 2 // refresh at half TTL
      console.log(`${CACHE_LOG_PREFIX} Found existing cache: ${existingCache.name}`)

      // Extend TTL on reuse
      try {
        await cacheManager.update(existingCache.name, {
          cachedContent: { ttlSeconds: CACHE_TTL_SECONDS },
        })
      } catch {
        // TTL update failed — non-critical
      }

      return existingCache
    }

    // Create new cache with the system prompt
    console.log(`${CACHE_LOG_PREFIX} Creating new content cache (TTL: ${CACHE_TTL_SECONDS}s)`)
    const newCache = await cacheManager.create({
      model: CACHE_MODEL,
      displayName: CACHE_DISPLAY_NAME,
      systemInstruction: systemPrompt,
      contents: [],
      ttlSeconds: CACHE_TTL_SECONDS,
    })

    activeCacheName = newCache.name ?? null
    activeCacheExpiry = Date.now() + (CACHE_TTL_SECONDS * 1000) / 2
    console.log(`${CACHE_LOG_PREFIX} Cache created: ${newCache.name}`)
    return newCache
  } catch (error: any) {
    console.error(`${CACHE_LOG_PREFIX} Cache operation failed:`, error.message)
    // Non-fatal — generation continues without cache
    return null
  }
}

/**
 * Generates content using a cached system prompt (if available).
 * Falls back to standard generation if cache is unavailable.
 *
 * @param systemPrompt - The full system prompt text
 * @param userMessages - The conversation messages to send
 * @param modelId - The model to use (e.g. "gemini-2.0-flash")
 * @returns The generated text response, or null on failure
 */
export async function generateWithCache(
  systemPrompt: string,
  userMessages: Array<{ role: string; content: string }>,
  modelId: string
): Promise<{ text: string; usedCache: boolean } | null> {
  const apiKey = process.env.GOOGLE_AI_API || process.env.GOOGLE_API_KEY
  if (!apiKey) return null

  const genAI = new GoogleGenerativeAI(apiKey)

  // Try to use cached content
  const cache = await getOrCreateSystemPromptCache(systemPrompt)

  if (cache) {
    try {
      const model = genAI.getGenerativeModelFromCachedContent(cache)

      // Build chat parts from messages
      const parts = userMessages.map((m) => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: m.content }],
      }))

      // Use the last message as the new input, rest as history
      const history = parts.slice(0, -1)
      const lastMessage = parts[parts.length - 1]

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(lastMessage?.parts?.[0]?.text || "Generate the file.")
      const text = result.response.text()

      console.log(`${CACHE_LOG_PREFIX} Generation complete using cached context`)
      return { text, usedCache: true }
    } catch (error: any) {
      console.warn(`${CACHE_LOG_PREFIX} Cached generation failed, falling back:`, error.message)
      // Fall through to non-cached generation
    }
  }

  // Fallback: standard generation without cache
  return null
}
