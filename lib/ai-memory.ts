// ──────────────────────────────────────────────────────
// AI Memory & File-Context System
// ──────────────────────────────────────────────────────
// Provides rich cross-file context so the AI can generate
// connected, type-safe, properly-importing code.
// ──────────────────────────────────────────────────────

export interface GeneratedFile {
  name: string;
  code: string;
}

/** Canonical dependency-ordered structure the planner should follow. */
export const FILE_STRUCTURE = `
project/
├── index.html
├── src/
│   ├── main.ts          (entry point - imports all components)
│   ├── types.ts          (shared TypeScript interfaces & types)
│   ├── utils.ts          (shared helper functions)
│   ├── style.css         (design-system tokens & global styles)
│   └── components/
│       ├── header.ts
│       ├── footer.ts
│       └── ...
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md
`;

/**
 * PREFERRED FILE GENERATION ORDER
 * The planner must generate files in this order so each file
 * can reference the exports of all previously generated files.
 */
export const GENERATION_ORDER = [
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'src/types.ts',
  'src/style.css',
  'src/utils.ts',
  // components in simple → complex order
  'src/components/',
  'src/main.ts',
  'index.html',
  '.gitignore',
  'README.md',
];

// ──────── Legacy compat ────────

export function getShortTermMemory(instruction: string) {
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
ALREADY GENERATED FILES:
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
      // grab just the declaration line (not the body)
      exports.push(trimmed.replace(/\{.*$/, '{ ... }'));
    }
    // export const / export let / export var
    else if (/^export\s+(const|let|var)\s+/.test(trimmed)) {
      // grab up to the first = or :
      const sig = trimmed.replace(/=.*$/, '').replace(/;$/, '').trim();
      exports.push(sig);
    }
    // export function / export async function
    else if (/^export\s+(async\s+)?function\s+/.test(trimmed)) {
      // grab just signature
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

// ──────── Full File Context Builder ────────

const FULL_CONTENT_THRESHOLD = 10;

/**
 * Builds a rich context block from all previously generated files.
 *
 * Strategy:
 * - < 10 files  --> full source code of EVERY file
 * - >= 10 files --> full code of 3 most recent files + export summary of the rest
 *
 * This gives the AI model enough context to generate properly
 * importing, type-safe, design-consistent code.
 */
export function getFileContext(files: GeneratedFile[]): string {
  if (!files || files.length === 0) {
    return 'No files generated yet. You are generating the first file.';
  }

  const useFullForAll = files.length < FULL_CONTENT_THRESHOLD;

  if (useFullForAll) {
    // Full content for every file
    const blocks = files.map(
      (f) => `
--- FILE: ${f.name} ---
\`\`\`
${f.code}
\`\`\`
`
    );
    return `
PREVIOUSLY GENERATED FILES (${files.length} files -- FULL CONTENT):
${blocks.join('\n')}

IMPORTANT:
- You MUST import from these files using the exact export names shown above.
- You MUST NOT redefine types, interfaces, or constants that are already exported.
- You MUST use the same CSS class names and design tokens already established.
`;
  }

  // Hybrid: full content for 3 most recent, summary for the rest
  const recentFiles = files.slice(-3);
  const olderFiles = files.slice(0, -3);

  const summaryBlocks = olderFiles.map(
    (f) => `
--- FILE: ${f.name} (EXPORTS ONLY) ---
${extractExportSummary(f.code)}
`
  );

  const fullBlocks = recentFiles.map(
    (f) => `
--- FILE: ${f.name} (FULL) ---
\`\`\`
${f.code}
\`\`\`
`
  );

  return `
PREVIOUSLY GENERATED FILES (${files.length} total):

== EXPORT SUMMARIES (${olderFiles.length} older files) ==
${summaryBlocks.join('\n')}

== FULL CONTENT (${recentFiles.length} most recent) ==
${fullBlocks.join('\n')}

IMPORTANT:
- You MUST import from these files using the exact export names shown above.
- You MUST NOT redefine types, interfaces, or constants that are already exported.
- You MUST use the same CSS class names and design tokens already established.
`;
}
