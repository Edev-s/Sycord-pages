// ──────────────────────────────────────────────────────
// Gemini Context Cache
// ──────────────────────────────────────────────────────
// In-memory cache that stores per-project generation context
// so the AI "remembers" previously generated files across
// sequential file generation calls within a session.
// ──────────────────────────────────────────────────────

import { extractExportSummary, type GeneratedFile } from "@/lib/ai-memory"

/** Cache entry per project session */
interface CacheEntry {
  /** Compact summary of all files generated so far */
  filesSummary: string
  /** Name of the most recently generated file */
  lastFile: string
  /** Timestamp of last update */
  updatedAt: number
  /** List of file names generated in order */
  generationOrder: string[]
}

/** Cache TTL: 30 minutes */
const CACHE_TTL_MS = 30 * 60 * 1000

/** In-memory cache keyed by projectId */
const contextCache = new Map<string, CacheEntry>()

/**
 * Retrieves cached generation context for a project.
 * Returns null if no cache exists or if the cache has expired.
 */
export function getCachedContext(projectId: string): CacheEntry | null {
  const entry = contextCache.get(projectId)
  if (!entry) return null

  // Check TTL
  if (Date.now() - entry.updatedAt > CACHE_TTL_MS) {
    contextCache.delete(projectId)
    return null
  }

  return entry
}

/**
 * Updates the cache after a file is generated.
 * Stores a compact summary of the file's exports and tracks generation order.
 */
export function updateCachedContext(
  projectId: string,
  filename: string,
  code: string,
  allFiles: GeneratedFile[]
): void {
  const existing = contextCache.get(projectId)
  const generationOrder = existing?.generationOrder ?? []

  // Add to generation order if not already present
  if (!generationOrder.includes(filename)) {
    generationOrder.push(filename)
  }

  // Build compact summary of all generated files
  const allFilesWithNew = [...allFiles.filter(f => f.name !== filename), { name: filename, code }]
  const summaryParts = allFilesWithNew.map(f => {
    const exports = extractExportSummary(f.code)
    return `[${f.name}] ${exports.substring(0, 200)}`
  })

  contextCache.set(projectId, {
    filesSummary: summaryParts.join('\n'),
    lastFile: filename,
    updatedAt: Date.now(),
    generationOrder,
  })
}

/**
 * Clears cache for a project (call when generation is complete or reset).
 */
export function clearCachedContext(projectId: string): void {
  contextCache.delete(projectId)
}
