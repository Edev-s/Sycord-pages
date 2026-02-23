// ──────────────────────────────────────────────────────
// AI RAG (Retrieval-Augmented Generation) Memory System
// ──────────────────────────────────────────────────────
// Retrieves all previously generated files for a project
// from MongoDB so the AI has full cross-file context.
// If retrieval fails, code generation is aborted.
// ──────────────────────────────────────────────────────

import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { GeneratedFile } from "@/lib/ai-memory"

/** Debug prefix for all RAG logs */
const RAG_LOG_PREFIX = "[RAG]"

export interface RAGRetrievalResult {
  success: boolean
  files: GeneratedFile[]
  error?: string
  debugInfo: {
    projectId: string
    filesRetrieved: number
    retrievalTimeMs: number
    hasIndexHtml: boolean
  }
}

/**
 * Retrieves all previously generated files for a project from MongoDB.
 * This is the RAG (Retrieval-Augmented Generation) memory system that
 * ensures every code-generation call has full context of existing files.
 *
 * @param projectId - The MongoDB project ID
 * @returns RAGRetrievalResult with files or error info
 */
export async function retrieveProjectFiles(projectId: string): Promise<RAGRetrievalResult> {
  const startTime = Date.now()

  console.log(`${RAG_LOG_PREFIX} Starting memory retrieval for project: ${projectId}`)

  try {
    const mongo = await clientPromise
    const db = mongo.db()

    const user = await db.collection("users").findOne(
      { "projects._id": new ObjectId(projectId) },
      { projection: { "projects.$": 1 } }
    )

    if (!user || !user.projects || user.projects.length === 0) {
      const retrievalTimeMs = Date.now() - startTime
      console.warn(`${RAG_LOG_PREFIX} No project found for ID: ${projectId} (${retrievalTimeMs}ms)`)
      return {
        success: true,
        files: [],
        debugInfo: {
          projectId,
          filesRetrieved: 0,
          retrievalTimeMs,
          hasIndexHtml: false,
        },
      }
    }

    const project = user.projects[0]
    const pages = project.pages || []

    const files: GeneratedFile[] = pages.map((page: { name: string; content: string }) => ({
      name: page.name,
      code: page.content,
    }))

    const hasIndexHtml = files.some((f) => f.name === "index.html")
    const retrievalTimeMs = Date.now() - startTime

    console.log(`${RAG_LOG_PREFIX} Retrieved ${files.length} files in ${retrievalTimeMs}ms`)
    console.log(`${RAG_LOG_PREFIX} Files: [${files.map((f) => f.name).join(", ")}]`)
    console.log(`${RAG_LOG_PREFIX} Has index.html: ${hasIndexHtml}`)

    return {
      success: true,
      files,
      debugInfo: {
        projectId,
        filesRetrieved: files.length,
        retrievalTimeMs,
        hasIndexHtml,
      },
    }
  } catch (error: any) {
    const retrievalTimeMs = Date.now() - startTime
    console.error(
      `${RAG_LOG_PREFIX} FAILED - Memory retrieval error for project ${projectId} (${retrievalTimeMs}ms):`,
      error.message
    )

    return {
      success: false,
      files: [],
      error: error.message,
      debugInfo: {
        projectId,
        filesRetrieved: 0,
        retrievalTimeMs,
        hasIndexHtml: false,
      },
    }
  }
}

/**
 * Merges files from RAG retrieval (MongoDB) with files from the frontend request.
 * Frontend files take priority as they may contain more recent edits.
 * Ensures index.html is always first in the merged context since it
 * defines dependencies and structure.
 */
export function mergeFileSources(
  ragFiles: GeneratedFile[],
  frontendFiles: GeneratedFile[]
): GeneratedFile[] {
  const fileMap = new Map<string, GeneratedFile>()

  // RAG files first (baseline from DB)
  for (const file of ragFiles) {
    fileMap.set(file.name, file)
  }

  // Frontend files overwrite (more recent / in-session edits)
  for (const file of frontendFiles) {
    fileMap.set(file.name, file)
  }

  const merged = Array.from(fileMap.values())

  // Sort: index.html first (main entry point that imports dependencies)
  merged.sort((a, b) => {
    if (a.name === "index.html") return -1
    if (b.name === "index.html") return 1
    return 0
  })

  console.log(
    `${RAG_LOG_PREFIX} Merged ${ragFiles.length} DB files + ${frontendFiles.length} frontend files = ${merged.length} total`
  )

  return merged
}
