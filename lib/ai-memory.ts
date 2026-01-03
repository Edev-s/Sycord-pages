export const FILE_STRUCTURE = `
project/
├── src/
│   ├── main.ts           (entry point - initializes the app)
│   ├── utils.ts          (shared utility functions)
│   └── components/
│       ├── header.ts     (navigation and header component)
│       └── footer.ts     (footer component)
├── public/
│   ├── index.html        (main HTML entry point)
│   └── style.css         (global styles with Tailwind)
├── package.json          (project dependencies)
├── vite.config.ts        (Vite configuration)
└── README.md             (project documentation)
`;

export interface FileMemory {
  filename: string
  description: string
  status: 'pending' | 'generating' | 'done'
  timestamp?: number
}

/**
 * Parse instruction string to extract completed and pending files
 * Uses [Done] for completed and [N] for pending tasks
 */
export function getShortTermMemory(instruction: string): string {
  const completedTasks: FileMemory[] = []
  const pendingTasks: FileMemory[] = []
  
  // Match completed tasks [Done]
  const doneRegex = /\[Done\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g
  let match
  while ((match = doneRegex.exec(instruction)) !== null) {
      completedTasks.push({
          filename: match[1].trim(),
          description: match[2]?.trim() || "No description provided",
          status: 'done'
      })
  }

  // Match pending tasks [N] where N is a number > 0
  const pendingRegex = /\[(\d+)\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g
  while ((match = pendingRegex.exec(instruction)) !== null) {
      if (match[1] !== "0") { // Skip overview item
          pendingTasks.push({
              filename: match[2].trim(),
              description: match[3]?.trim() || "Implementation pending",
              status: 'pending'
          })
      }
  }

  if (completedTasks.length === 0 && pendingTasks.length === 0) {
    return "No files in memory. Starting fresh build."
  }

  let memoryContext = ""
  
  if (completedTasks.length > 0) {
    memoryContext += `
COMPLETED FILES (${completedTasks.length}):
${completedTasks.map(t => `✓ [file]${t.filename}[file] [usedfor]${t.description}[usedfor]`).join('\n')}
`
  }

  if (pendingTasks.length > 0) {
    memoryContext += `
PENDING FILES (${pendingTasks.length}):
${pendingTasks.map(t => `○ [file]${t.filename}[file] [usedfor]${t.description}[usedfor]`).join('\n')}
`
  }

  return memoryContext
}

/**
 * Extract file metadata from AI response
 * Returns cleaned code without metadata markers
 */
export function extractFileMetadata(content: string): {
  code: string
  filename?: string
  usedFor?: string
} {
  let code = content
  let filename: string | undefined
  let usedFor: string | undefined

  // Extract filename from [file]...[file] markers
  const fileMatch = content.match(/\[file\](.*?)\[file\]/i)
  if (fileMatch) {
    filename = fileMatch[1].trim()
  }

  // Extract usedFor from [usedfor]...[usedfor] markers
  const usedForMatch = content.match(/\[usedfor\](.*?)\[usedfor\]/i)
  if (usedForMatch) {
    usedFor = usedForMatch[1].trim()
  }

  // Clean code: remove all metadata markers
  code = code
    .replace(/\[file\].*?\[file\]/gi, '')
    .replace(/\[usedfor\].*?\[usedfor\]/gi, '')
    .replace(/\[code\]/gi, '')
    .replace(/\[\/code\]/gi, '')
    .trim()

  return { code, filename, usedFor }
}

/**
 * Validate that content is actual code and not instructions
 */
export function isValidCode(content: string): boolean {
  // Check for common instruction patterns that shouldn't be in code
  const instructionPatterns = [
    /^(TASK|TODO|INSTRUCTIONS?):/im,
    /^(Step \d+|Phase \d+):/im,
    /^(Requirements|Guidelines):/im,
    /^\d+\.\s+(Create|Generate|Build|Make)/im,
    /^(Here is|I will|Let me|I'll)/im,  // Common AI response prefixes
    /^(Sure|Certainly|Of course)[,!]/im,
    /^(The following|Below is)/im
  ]

  for (const pattern of instructionPatterns) {
    if (pattern.test(content)) {
      return false
    }
  }

  // Check for common code patterns
  const codePatterns = [
    /^(import|export|const|let|var|function|class|interface|type)\s/m,
    /^<!DOCTYPE/i,
    /^<(html|head|body|div|script)/im,
    /^\{[\s\S]*\}$/,  // JSON-like content
    /^\/\*[\s\S]*\*\//m  // Multi-line comments
  ]

  for (const pattern of codePatterns) {
    if (pattern.test(content)) {
      return true
    }
  }

  // If we're not sure, accept it (AI might generate valid code we don't recognize)
  return true
}
