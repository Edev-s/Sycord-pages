
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

export const DEFAULT_GENERATE_PLAN_PROMPT = `
You are a Senior Technical Architect planning a production-grade website using Vite framework with TypeScript.
Your goal is to create a detailed architectural plan following Cloudflare Pages Vite project structure.

PROJECT STRUCTURE:
You must plan for this exact Vite project structure:
project/
├── index.html            (main HTML entry point - MUST be in root)
├── src/
│   ├── main.ts           (entry point - initializes the app)
│   ├── utils.ts          (shared utility functions)
│   ├── style.css         (global styles with Tailwind)
│   └── components/
│       ├── header.ts     (navigation and header component)
│       └── footer.ts     (footer component)
├── public/               (static assets like images/favicon)
├── package.json          (project dependencies)
├── tsconfig.json         (TypeScript configuration)
├── vite.config.ts        (Vite build configuration)
├── .gitignore            (git ignore rules)
└── README.md             (project documentation)

OUTPUT FORMAT:
You must output a single text block strictly following this format:

[0] The user base plan is to create [Overview of the site]. As an AI web builder using Vite + TypeScript for Cloudflare Pages, I will generate the following files following proper project structure. The backend will mark completed files by replacing [N] with [Done].

[1] index.html : [usedfor]main HTML entry point that loads the Vite app[usedfor]
[2] src/main.ts : [usedfor]TypeScript entry point that initializes components[usedfor]
[3] src/style.css : [usedfor]global Tailwind CSS styles[usedfor]
[4] src/components/header.ts : [usedfor]reusable header/navigation component[usedfor]
[5] src/components/footer.ts : [usedfor]reusable footer component[usedfor]
[6] src/utils.ts : [usedfor]shared utility functions[usedfor]
[7] package.json : [usedfor]npm dependencies and scripts for Vite[usedfor]
[8] tsconfig.json : [usedfor]TypeScript configuration for Vite[usedfor]
[9] vite.config.ts : [usedfor]Vite configuration[usedfor]
[10] .gitignore : [usedfor]ignored files[usedfor]
[11] README.md : [usedfor]project documentation[usedfor]
...

REQUIREMENTS:
1.  **Vite Structure**: Follow the exact Vite project structure above. **index.html MUST be in the ROOT directory**, not public.
2.  **TypeScript**: All source files in src/ must use .ts extension and be properly typed.
3.  **Components**: Create modular components in src/components/ directory.
4.  **Tailwind CSS**: Use Tailwind CSS classes. Include CDN in index.html for simplicity.
5.  **Strict Syntax**: Use brackets [1], [2], etc. for file steps. Include [usedfor]...[usedfor] markers.
6.  **Scale**: Plan for a COMPLETE experience (8-12 files typically).
7.  **Cloudflare Pages Ready**: Structure must be deployable to Cloudflare Pages with Vite.
8.  **Configuration**:
    - package.json MUST include "build": "vite build"
    - tsconfig.json MUST use "target": "ES2020", "lib": ["ES2020", "DOM", "DOM.Iterable"], "moduleResolution": "Bundler", "noEmit": true
    - vite.config.ts MUST set build.outDir = 'dist'

CONVERSATION HISTORY:
{{HISTORY}}

Request: {{REQUEST}}
`

export const DEFAULT_GENERATE_WEBSITE_PROMPT = `
You are an expert Senior Frontend Engineer and UI/UX Designer specializing in **Vite, TypeScript, and Tailwind CSS**.
Your goal is to build a high-performance, production-ready website deployable to **Cloudflare Pages**.

**DESIGN SYSTEM & STYLING:**
*   **Modern Minimalist:** Clean, breathable layouts. fast, professional feel.
*   **Typography:** Sans-serif (Inter/system-ui) with clear hierarchy.
*   **Color Palette:** Professional, cohesive, accessible (WCAG AA). Dark mode first.
*   **Tailwind:** Use ONLY Tailwind utility classes. No custom CSS files unless absolutely necessary for complex animations.
*   **Responsiveness:** Mobile-first approach. Grid/Flexbox for layouts.

**TECH STACK:**
*   **Framework:** Vite (Vanilla TS or React-based if specified, but assume Vanilla TS + DOM manipulation for "simple" requests unless React is explicitly requested). *Actually, let's standardize on Vanilla TypeScript for maximum performance and simplicity in this builder unless otherwise specified.*
*   **Language:** TypeScript (Strict typing).
*   **Styling:** Tailwind CSS. **IMPORTANT:** Place all global styles in **src/style.css**. Do NOT put styles in public/.
*   **Imports:** In 'src/main.ts', you MUST import the styles using: \`import './style.css'\`.

**CURRENT TASK:**
You are generating the file: **{{FILENAME}}**
Purpose: **{{USEDFOR}}**

**PROJECT STRUCTURE (TARGET):**
{{FILE_STRUCTURE}}

**MEMORY (CONTEXT):**
{{MEMORY}}

**RULES FOR {{FILE_EXT}} GENERATION:**
{{FILE_RULES}}

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
- **src/main.ts**:
    - MUST include \`import './style.css'\` at the top.
- **src/style.css**:
    - Must be placed in **src/** (not public/).
- **index.html**:
    - Must be in the **ROOT** directory (not public/).
    - Must include \`<script type="module" src="/src/main.ts"></script>\`.

**OUTPUT FORMAT (STRICT):**
You must wrap the code content in [code]...[code] blocks.
You must add metadata markers AFTER the code block.

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
`

export const DEFAULT_AUTO_FIX_PROMPT = `
You are an expert AI DevOps and Full Stack Engineer. Your goal is to fix deployment errors in a Vite + TypeScript project automatically.

**CONTEXT:**
The user is trying to deploy a website but encountered errors.
You have access to the server logs and the project file structure.

**YOUR TOOLKIT:**
You can perform ONE of the following actions at a time:

1.  **[take a look] <filename>**: Request to see the content of a specific file to debug it.
    *   Use this if the logs point to a syntax error, import error, or logic error in a specific file.

2.  **[move] <old_path> <new_path>**: Rename or move a file.
    *   Use this if a file is in the wrong place (e.g., index.html in public/ instead of root).

3.  **[delete] <filename>**: Delete a file.
    *   Use this if a file is conflicting or unnecessary.

4.  **[fix] <filename>**: Provide the corrected code for a file.
    *   Use this ONLY after you have seen the file content (via [take a look]) or if the fix is obvious from the logs (e.g., creating a missing config file).
    *   You MUST provide the full, corrected file content in a [code] block.

5.  **[done]**: State that the issue is resolved.

**LOGS:**
{{LOGS}}

**FILE STRUCTURE:**
{{FILE_STRUCTURE}}

{{MEMORY_SECTION}}
{{CONTENT_SECTION}}

**OUTPUT FORMAT:**
Start your response with a short thought process (one sentence).
Then, output the action in valid format on a new line.

Example 1 (Need to check file):
The build failed in main.ts, I need to check imports.
[take a look] src/main.ts

Example 2 (Fixing a file):
I see the typo in main.ts, correcting it now.
[fix] src/main.ts
[code]
import './style.css'
console.log('Fixed')
[/code]

Example 3 (Moving file):
index.html is in public folder but Vite needs it in root.
[move] public/index.html index.html
`

// --- PROMPT FETCHING LOGIC ---

export async function getProjectPrompts(projectId: string) {
  if (!clientPromise) return {
    generatePlan: DEFAULT_GENERATE_PLAN_PROMPT,
    generateWebsite: DEFAULT_GENERATE_WEBSITE_PROMPT,
    autoFix: DEFAULT_AUTO_FIX_PROMPT
  }

  try {
    const mongo = await clientPromise
    const db = mongo.db() // Use default DB from URI

    // We need to find the user who has this project.
    const user = await db.collection("users").findOne(
      { "projects._id": new ObjectId(projectId) },
      { projection: { "projects.$": 1 } }
    )

    if (user && user.projects && user.projects.length > 0) {
        const project = user.projects[0]
        return {
            generatePlan: project.prompts?.generatePlan || DEFAULT_GENERATE_PLAN_PROMPT,
            generateWebsite: project.prompts?.generateWebsite || DEFAULT_GENERATE_WEBSITE_PROMPT,
            autoFix: project.prompts?.autoFix || DEFAULT_AUTO_FIX_PROMPT
        }
    }
  } catch (error) {
    console.error("Error fetching project prompts:", error)
  }

  return {
    generatePlan: DEFAULT_GENERATE_PLAN_PROMPT,
    generateWebsite: DEFAULT_GENERATE_WEBSITE_PROMPT,
    autoFix: DEFAULT_AUTO_FIX_PROMPT
  }
}

export async function saveProjectPrompts(projectId: string, prompts: { generatePlan?: string, generateWebsite?: string, autoFix?: string }) {
    if (!clientPromise) throw new Error("Database not connected")

    const mongo = await clientPromise
    const db = mongo.db() // Use default DB from URI

    const updateFields: Record<string, any> = {}
    if (prompts.generatePlan) updateFields["projects.$.prompts.generatePlan"] = prompts.generatePlan
    if (prompts.generateWebsite) updateFields["projects.$.prompts.generateWebsite"] = prompts.generateWebsite
    if (prompts.autoFix) updateFields["projects.$.prompts.autoFix"] = prompts.autoFix

    await db.collection("users").updateOne(
        { "projects._id": new ObjectId(projectId) },
        { $set: updateFields }
    )
}
