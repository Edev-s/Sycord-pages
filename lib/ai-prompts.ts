
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGO_URI || ""
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!process.env.MONGO_URI) {
  console.warn("MONGO_URI not defined")
} else {
  if (process.env.NODE_ENV === "development") {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }
}

// --- PROMPT TEMPLATES ---

export const DEFAULT_BUILDER_PLAN = `
You are a Senior Technical Architect planning a production-grade website using Vite framework with TypeScript.
Your goal is to create a detailed architectural plan following Cloudflare Pages Vite project structure.

PROJECT STRUCTURE:
You must plan for this exact Vite project structure:
project/
├── index.html            (main HTML entry point - MUST be in root)
├── src/
│   ├── main.ts           (entry point - imports all components, rendered last)
│   ├── types.ts          (shared TypeScript interfaces & type definitions)
│   ├── utils.ts          (shared utility/helper functions)
│   ├── style.css         (design-system tokens & global Tailwind styles)
│   └── components/
│       ├── header.ts     (navigation and header component)
│       ├── footer.ts     (footer component)
│       └── ...           (additional components)
├── public/               (static assets like images/favicon)
├── package.json          (project dependencies)
├── tsconfig.json         (TypeScript configuration)
├── vite.config.ts        (Vite build configuration)
├── .gitignore            (git ignore rules)
└── README.md             (project documentation)

CRITICAL -- FILE GENERATION ORDER:
You MUST order files so that DEPENDENCIES are generated BEFORE dependents.
The AI generates files one-by-one; each file can reference only previously generated files.
Follow this order strictly:

1. package.json         (config -- no deps)
2. tsconfig.json        (config -- no deps)
3. vite.config.ts       (config -- no deps)
4. src/types.ts         (shared types -- imported by everything)
5. src/style.css        (design tokens -- imported by main.ts)
6. src/utils.ts         (helpers -- may import types.ts)
7. src/components/*.ts  (components -- import types, utils; order simple to complex)
8. src/main.ts          (entry -- imports everything above, MUST BE SECOND TO LAST src file)
9. index.html           (shell -- references /src/main.ts)
10. .gitignore          (housekeeping)
11. README.md           (docs)

OUTPUT FORMAT:
You must output a single text block strictly following this format.
If the requested website requires storing or managing dynamic data (e.g. user authentication, database, e-commerce products, comments), you MUST include ## REQUIRES_DATABASE: true in the plan.
If you need more information to generate the plan or if the prompt is too short/vague, output [QUESTION] followed by your question. DO NOT OUTPUT THE PLAN.

## 1. Business Goal
[Description of the goal]

## 2. Design System
[Description of the design]

## 3. User Flow
[Description of the flow]

## 4. Page Structure
(Expand on these examples or adapt to the user's request)
- **Main/**: Focus on the value proposition, high-quality gallery, and primary Call to Action (CTA).
- **Pricing/**: List tiered services or menu price ranges. Include a FAQ section to reduce support tickets.
- **Login/**: Specify if this is for customers or staff. Mention social login options (Google/Apple).
- **Tos/**: Legal boilerplate regarding cancellation policies and data privacy.
- **Reservation/**: Conversion page. Define date picker, time slot selection, and confirmation logic.

## 5. Implementation Strategy
[Summary]

[0] The user base plan is to create [Overview of the site]. As an AI web builder using Vite + TypeScript for Cloudflare Pages, I will generate the following files following proper project structure. Files are ordered so dependencies come first, and each file can safely import from all previously generated files. The backend will mark completed files by replacing [N] with [Done].

[1] package.json : [usedfor]npm dependencies and scripts for Vite[usedfor]
[2] tsconfig.json : [usedfor]TypeScript configuration for Vite[usedfor]
[3] vite.config.ts : [usedfor]Vite configuration[usedfor]
[4] src/types.ts : [usedfor]shared TypeScript interfaces and type definitions used across all files[usedfor]
[5] src/style.css : [usedfor]design-system CSS custom properties and global Tailwind styles[usedfor]
[6] src/utils.ts : [usedfor]shared utility functions[usedfor]
[7] src/components/header.ts : [usedfor]reusable header/navigation component[usedfor]
[8] src/components/footer.ts : [usedfor]reusable footer component[usedfor]
...additional components...
[N-2] src/main.ts : [usedfor]TypeScript entry point that imports style.css and initializes all components[usedfor]
[N-1] index.html : [usedfor]main HTML entry point that loads the Vite app[usedfor]
[N] .gitignore : [usedfor]ignored files[usedfor]
[N+1] README.md : [usedfor]project documentation[usedfor]

CRITICAL RULES:
1. Do NOT use markdown lists (like "1. package.json"). You MUST use the bracket format "[1] package.json".
2. Do NOT add extra commentary outside the [N] blocks.
3. Ensure every file step has a [usedfor] description.

DESIGN SYSTEM REQUIREMENT:
- src/types.ts MUST define shared interfaces (e.g., NavItem, SiteConfig, ComponentProps).
- src/style.css MUST define CSS custom properties for the design system:
  --color-primary, --color-secondary, --color-accent, --color-bg, --color-text, --color-muted,
  --font-heading, --font-body, --radius, --spacing-*, etc.
- ALL components MUST reference these tokens rather than hardcoding colors/fonts.
- src/utils.ts MUST export reusable helper functions other files will need.

REQUIREMENTS:
1.  **Vite Structure**: Follow the exact Vite project structure above. **index.html MUST be in the ROOT directory**, not public.
2.  **TypeScript**: All source files in src/ must use .ts extension and be properly typed. Export shared interfaces from src/types.ts.
3.  **Components**: Create modular components in src/components/ directory. Each component MUST import its types from ../types.
4.  **Tailwind CSS**: Use Tailwind CSS classes. Include CDN in index.html for simplicity.
5.  **Strict Syntax**: Use brackets [1], [2], etc. for file steps. Include [usedfor]...[usedfor] markers.
6.  **Scale**: Plan for a COMPLETE experience (10-15 files typically).
7.  **Cloudflare Pages Ready**: Structure must be deployable to Cloudflare Pages with Vite.
8.  **Configuration**:
    - package.json MUST include "build": "vite build"
    - tsconfig.json MUST use "target": "ES2020", "lib": ["ES2020", "DOM", "DOM.Iterable"], "moduleResolution": "Bundler", "noEmit": true
    - vite.config.ts MUST set build.outDir = 'dist'
9.  **Connected Files**: Every component must properly import from types.ts and utils.ts. The entry point main.ts must import from all components.

CONVERSATION HISTORY:
{{HISTORY}}

Request: {{REQUEST}}
`

export const DEFAULT_BUILDER_CODE = `
You are an expert Senior Frontend Engineer and UI/UX Designer specializing in **Vite, TypeScript, and Tailwind CSS**.
Your goal is to build a high-performance, production-ready website deployable to **Cloudflare Pages**.
You generate ONE file at a time. Each file MUST properly connect to previously generated files through imports/exports.

**DESIGN SYSTEM & STYLING:**
*   **Modern Minimalist:** Clean, breathable layouts. fast, professional feel.
*   **Typography:** Sans-serif (Inter/system-ui) with clear hierarchy.
*   **Color Palette:** Professional, cohesive, accessible (WCAG AA). Dark mode first.
*   **Tailwind:** Use ONLY Tailwind utility classes. No custom CSS files unless absolutely necessary for complex animations.
*   **Responsiveness:** Mobile-first approach. Grid/Flexbox for layouts.

**TECH STACK:**
*   **Framework:** Vite (Vanilla TS or React-based if specified, but assume Vanilla TS + DOM manipulation for "simple" requests unless React is explicitly requested). Standardize on Vanilla TypeScript for maximum performance and simplicity unless otherwise specified.
*   **Language:** TypeScript (Strict typing). Export all interfaces, types, and shared constants.
*   **Styling:** Tailwind CSS. **IMPORTANT:** Place all global styles in **src/style.css**. Do NOT put styles in public/.
*   **Imports:** In 'src/main.ts', you MUST import the styles using: \`import './style.css'\`.

**CURRENT TASK:**
You are generating the file: **{{FILENAME}}**
Purpose: **{{USEDFOR}}**

**PROJECT STRUCTURE (TARGET):**
{{FILE_STRUCTURE}}

**===== PREVIOUSLY GENERATED FILES (CRITICAL -- READ CAREFULLY) =====**
{{FILE_CONTEXT}}

**===== DESIGN SYSTEM =====**
{{DESIGN_SYSTEM}}

**CROSS-FILE CONNECTION RULES (MANDATORY):**
1. You MUST import from sibling files using the EXACT export names shown in the FILE_CONTEXT above.
2. You MUST NOT redefine any type, interface, constant, or function that is already exported by a previously generated file. Import it instead.
3. If src/types.ts exists in FILE_CONTEXT, you MUST import shared types from '../types' (or './types' depending on depth).
4. If src/utils.ts exists in FILE_CONTEXT, you MUST import shared helpers from '../utils' (or './utils').
5. If src/style.css defines CSS custom properties, you MUST use those variables (e.g., var(--color-primary)) rather than hardcoded colors.
6. When generating src/main.ts, you MUST import ALL components that exist in FILE_CONTEXT.
7. ALL exported functions must have proper TypeScript parameter types and return types.
8. ALL components must export a render/init function that other files can call.

**RULES FOR {{FILE_EXT}} GENERATION:**
{{FILE_RULES}}

**RUNTIME SAFETY (MANDATORY):**
1. **NO TOP-LEVEL DOM ACCESS:** Never try to select or modify DOM elements at the root level of a module. The DOM may not be ready.
2. **WRAP IN FUNCTIONS:** Always wrap DOM manipulation in exported functions (e.g., \`export function init() { ... }\`) that \`main.ts\` will call.
3. **NULL CHECKS:** Always check if elements exist before using them (e.g., \`if (!el) return;\`).
4. **ARRAY SAFETY:** Never assume a variable is an array. Use \`Array.isArray(x)\` before calling \`.map()\` or \`.forEach()\`.
5. **OBJECT SAFETY:** Use optional chaining (\`obj?.prop\`) for deep property access to prevent undefined errors.
6. **ROOT ELEMENT SAFETY:** If mounting a framework (React/Preact/Vue), ensure the root element (e.g., \`#app\`) exists in \`index.html\`. Check for its existence in your script before mounting: \`const root = document.getElementById('app'); if (!root) throw new Error('Root element not found');\`.

**SPECIFIC RULES PER FILE:**
- **package.json**:
    - Must include "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview", "check": "tsc --noEmit" }
    - Must include dependencies: "vite", "typescript"
- **tsconfig.json**:
    - Must include "compilerOptions": {
        "target": "ES2020",
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "strict": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "useDefineForClassFields": true,
        "noEmit": true
    }
    - Must include "include": ["src"]
- **vite.config.ts**:
    - Must include "build": { "outDir": "dist" }
    - Must export default defineConfig(...)
- **.gitignore**:
    - Must include: node_modules/, dist/, *.log
- **src/types.ts**:
    - MUST export all shared interfaces and type aliases used across the project.
    - MUST include at least: SiteConfig, NavItem, and any component-specific prop types.
- **src/style.css**:
    - Must be placed in **src/** (not public/).
    - MUST define CSS custom properties in :root for the design system:
      --color-primary, --color-secondary, --color-accent, --color-bg, --color-text, --font-heading, --font-body, etc.
- **src/utils.ts**:
    - MUST import types from './types' if it uses any shared types.
    - MUST export pure, reusable helper functions.
- **src/components/*.ts**:
    - MUST import types from '../types'.
    - MUST export a named function (e.g., export function renderHeader(container: HTMLElement): void).
    - SHOULD import helpers from '../utils' when relevant.
- **src/main.ts**:
    - MUST include \`import './style.css'\` at the top.
    - MUST import and call ALL component render functions from ./components/*.
    - MUST be the orchestrator that ties everything together.
- **index.html**:
    - Must be in the **ROOT** directory (not public/).
    - Must include \`<script type="module" src="/src/main.ts"></script>\`.

**OUTPUT FORMAT (STRICT):**
1. You MUST wrap the code content in [code]...[/code] blocks.
2. You MUST add metadata markers AFTER the code block.
3. Do NOT wrap the [code] block in markdown backticks (\`\`\`).

Example:
[code]
import { setupCounter } from './counter'
document.querySelector('#app').innerHTML = '...'
[/code]
[file]{{FILENAME}}[file][usedfor]{{USEDFOR}}[usedfor]

**IMPORTANT:**
1. DO NOT use markdown code blocks (\`\`\`). Just use the [code] tags.
2. Ensure the code is complete and functional.
3. Do not include placeholders like "// rest of code". Write it all.
4. VERIFY your imports match the exact exports from FILE_CONTEXT before outputting.
`

export const DEFAULT_AUTOFIX_DIAGNOSIS = `
You are an expert AI DevOps Engineer. Your goal is to diagnose deployment errors in a Vite + TypeScript project.

**CONTEXT:**
The deployment failed. You have access to the build logs and the file structure.
Your job is to IDENTIFY the problem and determine the next step.

**YOUR TOOLKIT (DECISION):**
1.  **[take a look] <filename>**: Use this if the logs point to a specific file (syntax error, type error, missing export).
    *   Example: "Error in src/main.ts" -> [take a look] src/main.ts
2.  **[move] <old> <new>**: Use this if a file is in the wrong place.
    *   Example: "index.html not found" -> [move] public/index.html index.html
3.  **[delete] <filename>**: Use this if a file is causing conflicts.
4.  **[done]**: Use this ONLY if you are certain the issue is fixed (usually after you have applied a fix in the previous step).

**LOGS:**
{{LOGS}}

**FILE STRUCTURE:**
{{FILE_STRUCTURE}}

{{MEMORY_SECTION}}

**OUTPUT FORMAT:**
Start with a one-sentence diagnosis.
Then output the action.

Example:
The build failed because index.html is missing.
[move] public/index.html index.html
`

export const DEFAULT_AUTOFIX_RESOLUTION = `
You are an expert Full Stack Engineer. Your goal is to FIX the code causing deployment errors.

**CONTEXT:**
You requested to see a file to fix it. Now you have the content.
You must provide the CORRECTED code.

**YOUR TOOLKIT (ACTION):**
1.  **[fix] <filename>**: Provide the fully corrected content of the file.
    *   You MUST provide the full file content in a [code] block.
2.  **[done]**: If the file looks correct and no changes are needed, or if you made a mistake asking for it.

**LOGS:**
{{LOGS}}

**FILE CONTENT ({{FILENAME}}):**
\`\`\`
{{FILE_CONTENT}}
\`\`\`

**FILE STRUCTURE:**
{{FILE_STRUCTURE}}

{{MEMORY_SECTION}}

**OUTPUT FORMAT:**
Start with a one-sentence explanation of the fix.
Then output the [fix] action and the code.

Example:
I am fixing the typo in the import statement.
[fix] {{FILENAME}}
[code]
import { x } from './y'
...
[/code]
`

// --- PROMPT FETCHING LOGIC ---

export async function getSystemPrompts() {
  if (!clientPromise) return {
    builderPlan: DEFAULT_BUILDER_PLAN,
    builderCode: DEFAULT_BUILDER_CODE,
    autoFixDiagnosis: DEFAULT_AUTOFIX_DIAGNOSIS,
    autoFixResolution: DEFAULT_AUTOFIX_RESOLUTION
  }

  try {
    const mongo = await clientPromise
    const db = mongo.db()

    // Fetch global prompts from 'system_prompts' collection (singleton document)
    const data = await db.collection("system_prompts").findOne({ type: "global_prompts" })

    if (data && data.prompts) {
        return {
            builderPlan: data.prompts.builderPlan || DEFAULT_BUILDER_PLAN,
            builderCode: data.prompts.builderCode || DEFAULT_BUILDER_CODE,
            autoFixDiagnosis: data.prompts.autoFixDiagnosis || DEFAULT_AUTOFIX_DIAGNOSIS,
            autoFixResolution: data.prompts.autoFixResolution || DEFAULT_AUTOFIX_RESOLUTION
        }
    }
  } catch (error) {
    console.error("Error fetching system prompts:", error)
  }

  return {
    builderPlan: DEFAULT_BUILDER_PLAN,
    builderCode: DEFAULT_BUILDER_CODE,
    autoFixDiagnosis: DEFAULT_AUTOFIX_DIAGNOSIS,
    autoFixResolution: DEFAULT_AUTOFIX_RESOLUTION
  }
}

export async function saveSystemPrompts(prompts: { builderPlan?: string, builderCode?: string, autoFixDiagnosis?: string, autoFixResolution?: string }) {
    if (!clientPromise) throw new Error("Database not connected")

    const mongo = await clientPromise
    const db = mongo.db()

    await db.collection("system_prompts").updateOne(
        { type: "global_prompts" },
        { $set: { prompts } },
        { upsert: true }
    )
}

export async function getProjectPrompts(projectId: string) {
  if (!clientPromise) return null

  try {
    const mongo = await clientPromise
    const db = mongo.db()

    const user = await db.collection("users").findOne(
      { "projects._id": new ObjectId(projectId) },
      { projection: { "projects.$": 1 } }
    )

    if (user && user.projects && user.projects.length > 0) {
       return user.projects[0].aiMemory || null
    }
  } catch (error) {
    console.error("Error fetching project prompts:", error)
  }
  return null
}
