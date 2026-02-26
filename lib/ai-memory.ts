// ──────────────────────────────────────────────────────
// AI File-Context System (Simplified)
// ──────────────────────────────────────────────────────
// Provides basic file context for AI generation.
// Main architectural guidance now comes from Gemini API cache.
// ──────────────────────────────────────────────────────

// ─────────── Configuration Constants ───────────

/** Number of recent files to include with full content */
export const RECENT_FILES_COUNT = 5;

// ─────────── Types & Interfaces ───────────

export interface GeneratedFile {
  name: string;
  code: string;
}

export interface ContextOptions {
  /** Whether to use smart context selection based on current task */
  useSmartContext?: boolean;
  /** Current task/filename being generated (used for relevance scoring) */
  currentTask?: string;
}

// ─────────── Project Structure Constants ───────────

/** 
 * Basic file structure reference (detailed structure is in Gemini cache)
 * This is kept for backward compatibility.
 */
export const FILE_STRUCTURE = `
Multi-Page Project Structure (NOT Single Page App):
- Multiple HTML files (index.html, about.html, services.html, contact.html, etc.)
- Shared src/ directory with TypeScript modules
- Each page imports the same main.ts for shared components
- See cached context for detailed structure
`;

// ─────────── Instruction Parsing ───────────

/**
 * Parses the instruction string to extract information about completed files.
 * Used for basic context when full file content is not available.
 */
export function getCompletedFilesList(instruction: string): string {
  const completedTasks: { filename: string; description: string }[] = [];
  const taskRegex = /\[Done\]\s*([^\s:]+)\s*:\s*(?:\[usedfor\](.*?)\[usedfor\])?/g;
  let match;
  while ((match = taskRegex.exec(instruction)) !== null) {
    completedTasks.push({
      filename: match[1].trim(),
      description: match[2]?.trim() || 'No description provided',
    });
  }
  if (completedTasks.length === 0) return 'No files generated yet.';
  return `
Already Generated Files:
${completedTasks.map((t) => `- ${t.filename}: ${t.description}`).join('\n')}
`;
}

// ──────── Export Summary Extraction ────────

/**
 * Extracts a compact summary of public API surface from source code.
 * Returns exported interfaces, types, consts, functions and class signatures.
 */
export function extractExportSummary(code: string): string {
  const lines = code.split('\n');
  const exports: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // export interface / export type / export enum
    if (/^export\s+(interface|type|enum)\s+/.test(trimmed)) {
      exports.push(trimmed.replace(/\{.*$/, '{ ... }'));
    }
    // export const / export let / export var
    else if (/^export\s+(const|let|var)\s+/.test(trimmed)) {
      const sig = trimmed.replace(/=.*$/, '').replace(/;$/, '').trim();
      exports.push(sig);
    }
    // export function / export async function
    else if (/^export\s+(async\s+)?function\s+/.test(trimmed)) {
      const sig = trimmed.replace(/\{.*$/, '').trim();
      exports.push(sig);
    }
    // export class
    else if (/^export\s+(abstract\s+)?class\s+/.test(trimmed)) {
      exports.push(trimmed.replace(/\{.*$/, '{ ... }'));
    }
    // export default
    else if (/^export\s+default\s+/.test(trimmed)) {
      exports.push(trimmed.replace(/\{.*$/, '').replace(/;$/, '').trim());
    }
    // CSS custom properties (--var: value)
    else if (/^\s*--[\w-]+\s*:/.test(trimmed)) {
      exports.push(trimmed);
    }
  }

  return exports.length > 0
    ? exports.join('\n')
    : '// No public exports detected';
}

// ──────── File Block Formatters ────────

/**
 * Formats a file with its full content for context.
 */
function formatFullFileBlock(file: GeneratedFile, includeLangHint = false): string {
  const langHint = includeLangHint ? file.name.split('.').pop() || '' : '';
  return `
--- FILE: ${file.name} (FULL) ---
\`\`\`${langHint}
${file.code}
\`\`\`
`;
}

/**
 * Formats a file with only its export summary for context.
 */
function formatSummaryFileBlock(file: GeneratedFile): string {
  return `
--- FILE: ${file.name} (EXPORTS ONLY) ---
${extractExportSummary(file.code)}
`;
}

/**
 * Standard context footer with import/reuse instructions.
 */
const CONTEXT_FOOTER = `
IMPORTANT:
- Import from these files using the exact export names shown above.
- Do NOT redefine types, interfaces, or constants that are already exported.
- Reuse CSS class names and design tokens already established.
- All pages must be separate HTML files (NOT a Single Page App).
`;

// ──────── Design System Extraction ────────

/**
 * Finds CSS custom properties and key Tailwind/utility patterns
 * from a style.css file to pass as design-system context.
 */
export function extractDesignSystem(files: GeneratedFile[]): string {
  const styleFile = files.find(
    (f) => f.name.endsWith('style.css') || f.name.endsWith('globals.css')
  );
  if (!styleFile) return '';

  const vars: string[] = [];
  const lines = styleFile.code.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^--[\w-]+\s*:/.test(trimmed)) {
      vars.push(trimmed);
    }
    // @font-face declarations
    if (/font-family\s*:/.test(trimmed)) {
      vars.push(trimmed);
    }
  }

  if (vars.length === 0) return '';

  return `
DESIGN SYSTEM (from style.css):
\`\`\`css
${vars.join('\n')}
\`\`\`
You MUST reuse these exact tokens for colors, fonts, and spacing.
Do NOT invent new values -- reference these CSS custom properties.
`;
}

// ──────── Simple File Context Builder ────────

/**
 * Builds a basic context block from previously generated files.
 * Provides recent files with full content for the AI to reference.
 * Main architectural guidance comes from Gemini cache.
 */
export function getFileContext(files: GeneratedFile[]): string {
  if (!files || files.length === 0) {
    return 'No files generated yet. Reference the cached project structure.';
  }

  // Show recent files with full content
  const recentFiles = files.slice(-RECENT_FILES_COUNT);
  const blocks = recentFiles.map((f) => formatFullFileBlock(f));

  return `
RECENTLY GENERATED FILES (${recentFiles.length} files):
${blocks.join('\n')}
${CONTEXT_FOOTER}`;
}

/**
 * Simplified context function that returns recent file context.
 * Kept for backward compatibility.
 */
export function getSmartContext(files: GeneratedFile[], currentTask: string): string {
  return getFileContext(files);
}
