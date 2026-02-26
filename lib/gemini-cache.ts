// ──────────────────────────────────────────────────────
// Gemini API Context Caching System
// ──────────────────────────────────────────────────────
// Implements context caching using Gemini API's native caching
// to efficiently store and retrieve project structure, dependencies,
// and component information for AI website generation.
// Based on: https://ai.google.dev/gemini-api/docs/caching
// ──────────────────────────────────────────────────────

import { GoogleGenerativeAI, CachedContent } from "@google/generative-ai"

// ─────────── Configuration ───────────

/** Cache time-to-live: 1 hour (in seconds) */
export const CACHE_TTL = 3600

/** Model to use for cached content */
export const CACHE_MODEL = "gemini-1.5-pro-002"

// ─────────── Types ───────────

export interface ProjectCacheData {
  projectId: string
  structure: string
  dependencies: string
  heroUIComponents: string
  buildInstructions: string
  timestamp: number
}

export interface CacheMetadata {
  cacheName: string
  projectId: string
  expiresAt: Date
  createdAt: Date
}

// ─────────── Cache Content Templates ───────────

/**
 * Generates the comprehensive project structure documentation
 * that will be cached for the AI to reference.
 */
function generateProjectStructureDoc(projectType: string = "multi-page"): string {
  return `
# PROJECT STRUCTURE REQUIREMENTS

## Core Architecture: Multi-Page Application (NOT Single Page App)
**CRITICAL**: You MUST generate a multi-page website structure. Single Page Applications (SPAs) are FORBIDDEN.

### Required Multi-Page Structure:
project/
├── index.html           (Homepage - main entry point)
├── about.html           (About page - separate HTML file)
├── services.html        (Services page - separate HTML file)
├── contact.html         (Contact page - separate HTML file)
├── src/
│   ├── main.ts          (Shared JavaScript entry - used by ALL pages)
│   ├── types.ts         (TypeScript type definitions)
│   ├── utils.ts         (Shared utility functions)
│   ├── style.css        (Global styles - imported by main.ts)
│   ├── pages/           (Page-specific scripts)
│   │   ├── home.ts      (Homepage-specific logic)
│   │   ├── about.ts     (About page-specific logic)
│   │   ├── services.ts  (Services page-specific logic)
│   │   └── contact.ts   (Contact page-specific logic)
│   └── components/      (Reusable components)
│       ├── header.ts    (Navigation component - used across all pages)
│       ├── footer.ts    (Footer component - used across all pages)
│       ├── hero.ts      (Hero section component)
│       └── ...          (Additional components)
├── public/              (Static assets)
│   ├── images/
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── README.md

## Multi-Page Rules:
1. **Separate HTML Files**: Create DISTINCT HTML files for each major section (index.html, about.html, services.html, contact.html, etc.)
2. **Shared Components**: Use TypeScript components that are imported and initialized on each page
3. **Navigation**: Header component must provide links to all pages (e.g., href="about.html")
4. **Consistent Styling**: All pages must import the same style.css through main.ts
5. **Page-Specific Scripts**: Each page can have its own TypeScript file in src/pages/
6. **NO Client-Side Routing**: Do NOT use React Router, Vue Router, or any SPA routing library
7. **Static File Structure**: Each page is a separate .html file that can be accessed directly

## Why Multi-Page Architecture:
- Better SEO (each page has its own URL and meta tags)
- Faster initial page load (no large bundle)
- Simpler deployment to static hosting (Cloudflare Pages)
- Better separation of concerns
- Easier to maintain and understand
`;
}

/**
 * Generates Hero UI component documentation that will be cached.
 */
function generateHeroUIDoc(): string {
  return `
# HERO UI COMPONENT INTEGRATION

## MANDATORY: Hero UI Components Must Be Used
Every website you generate MUST integrate Hero UI design components for a modern, professional appearance.

## Core Hero UI Components to Use:

### 1. Hero Section (Required on Homepage)
\`\`\`typescript
// Hero component with gradient background, heading, subheading, and CTA buttons
export function renderHero(container: HTMLElement): void {
  container.innerHTML = \`
    <section class="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Welcome to Your Website
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Build amazing experiences with modern design
          </p>
          <div class="flex gap-4 justify-center flex-wrap">
            <button class="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition">
              Get Started
            </button>
            <button class="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  \`;
}
\`\`\`

### 2. Card Components (For Features, Services, etc.)
\`\`\`typescript
export function renderFeatureCards(container: HTMLElement, features: Feature[]): void {
  const cardsHTML = features.map(feature => \`
    <div class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100">
      <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
        <svg class="w-8 h-8 text-white"><!-- Icon --></svg>
      </div>
      <h3 class="text-2xl font-bold mb-4 text-gray-900">\${feature.title}</h3>
      <p class="text-gray-600 leading-relaxed">\${feature.description}</p>
    </div>
  \`).join('');
  
  container.innerHTML = \`
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      \${cardsHTML}
    </div>
  \`;
}
\`\`\`

### 3. Navigation Header (Required on All Pages)
\`\`\`typescript
export function renderHeader(container: HTMLElement): void {
  container.innerHTML = \`
    <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <a href="index.html" class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Brand
          </a>
          <ul class="hidden md:flex space-x-8">
            <li><a href="index.html" class="text-gray-700 hover:text-blue-600 transition font-medium">Home</a></li>
            <li><a href="about.html" class="text-gray-700 hover:text-blue-600 transition font-medium">About</a></li>
            <li><a href="services.html" class="text-gray-700 hover:text-blue-600 transition font-medium">Services</a></li>
            <li><a href="contact.html" class="text-gray-700 hover:text-blue-600 transition font-medium">Contact</a></li>
          </ul>
          <button class="md:hidden">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </nav>
    </header>
  \`;
}
\`\`\`

### 4. Footer (Required on All Pages)
\`\`\`typescript
export function renderFooter(container: HTMLElement): void {
  container.innerHTML = \`
    <footer class="bg-gray-900 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-xl font-bold mb-4">Brand</h3>
            <p class="text-gray-400">Building amazing experiences</p>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Quick Links</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="index.html" class="hover:text-white transition">Home</a></li>
              <li><a href="about.html" class="hover:text-white transition">About</a></li>
              <li><a href="services.html" class="hover:text-white transition">Services</a></li>
              <li><a href="contact.html" class="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Brand. All rights reserved.</p>
        </div>
      </div>
    </footer>
  \`;
}
\`\`\`

## Design Principles:
1. **Modern Gradients**: Use gradient backgrounds (from-color via-color to-color)
2. **Smooth Animations**: Add hover effects and transitions
3. **Glassmorphism**: Use backdrop-blur and semi-transparent backgrounds
4. **Rounded Corners**: Use rounded-xl, rounded-2xl for modern look
5. **Shadows**: Use shadow-lg, shadow-2xl for depth
6. **Responsive**: Always use mobile-first responsive classes (sm:, md:, lg:)

## IMPORTANT:
- EVERY page must have a Header and Footer component
- Homepage MUST have a Hero section
- Use card-based layouts for features, services, team members, etc.
- Always include hover effects and transitions
- Use Tailwind CSS utility classes exclusively
`;
}

/**
 * Generates dependency documentation including required packages.
 */
function generateDependencyDoc(): string {
  return `
# PROJECT DEPENDENCIES & CONFIGURATION

## Required NPM Dependencies:

### Core Framework:
- **vite** (^6.0.0): Build tool and dev server
- **typescript** (^5.0.0): TypeScript compiler

### Optional Libraries (based on requirements):
- **@heroicons/tailwind** (if using icons)
- **swiper** (for carousels/sliders)
- **aos** (for scroll animations)

## Configuration Files:

### package.json:
Must include these exact scripts:
\`\`\`json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit"
  },
  "dependencies": {
    "vite": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
\`\`\`

### tsconfig.json:
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "useDefineForClassFields": true,
    "noEmit": true
  },
  "include": ["src"]
}
\`\`\`

### vite.config.ts:
\`\`\`typescript
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        services: 'services.html',
        contact: 'contact.html'
      }
    }
  }
})
\`\`\`

## Build Instructions:
1. Install dependencies: \`npm install\`
2. Start dev server: \`npm run dev\`
3. Build for production: \`npm run build\`
4. Preview build: \`npm run preview\`

## Cloudflare Pages Configuration:
- **Build command**: \`npm run build\`
- **Build output directory**: \`dist\`
- **Root directory**: \`/\`
- **Node version**: 18 or higher
`;
}

// ─────────── Cache Management Functions ───────────

/**
 * Creates a new cached content for a project using Gemini REST API.
 * This cache will be used by the AI during generation to understand
 * the project structure, dependencies, and requirements.
 */
export async function createProjectCache(
  apiKey: string,
  projectId: string,
  projectType: string = "multi-page"
): Promise<CachedContent> {
  // Combine all documentation into a single cached content
  const systemInstructions = `
You are an expert web developer building multi-page websites with Vite and TypeScript.
The following documentation describes the EXACT structure and requirements you must follow.
This content is cached for efficient access - always reference it when generating code.

${generateProjectStructureDoc(projectType)}

${generateHeroUIDoc()}

${generateDependencyDoc()}

## CRITICAL RULES (ALWAYS ENFORCE):
1. **NEVER generate Single Page Applications (SPAs)**
2. **ALWAYS create separate HTML files for different pages**
3. **ALWAYS integrate Hero UI components with modern design**
4. **ALWAYS use the multi-page structure specified above**
5. **ALWAYS include Header and Footer on every page**
6. **ALWAYS use Tailwind CSS utility classes**
7. **ALWAYS follow the exact file generation order**
8. **ALWAYS reference this cached documentation for structure**
`;

  // Create cache using REST API
  const cachePayload = {
    model: `models/${CACHE_MODEL}`,
    displayName: `project-${projectId}-cache`,
    systemInstruction: {
      parts: [{ text: systemInstructions }]
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "I understand the project structure and requirements. I will follow all rules and always create multi-page websites with Hero UI components."
          }
        ]
      },
      {
        role: "model",
        parts: [
          {
            text: "Confirmed. I will generate multi-page websites following the exact structure specified, always integrating Hero UI components, and never creating Single Page Applications."
          }
        ]
      }
    ],
    ttl: `${CACHE_TTL}s`
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cachePayload),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create cache: ${response.status} ${error}`)
  }

  const cachedContent = await response.json()
  console.log(`[Cache] Created cache for project ${projectId}: ${cachedContent.name}`)
  
  return cachedContent
}

/**
 * Retrieves an existing cached content by name.
 */
export async function getCachedContent(
  apiKey: string,
  cacheName: string
): Promise<CachedContent | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${cacheName}?key=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to get cache: ${response.status}`)
    }

    const cachedContent = await response.json()
    return cachedContent
  } catch (error) {
    console.error(`[Cache] Failed to retrieve cache ${cacheName}:`, error)
    return null
  }
}

/**
 * Lists all cached contents.
 */
export async function listCachedContents(apiKey: string): Promise<CachedContent[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list caches: ${response.status}`)
    }

    const data = await response.json()
    return data.cachedContents || []
  } catch (error) {
    console.error(`[Cache] Failed to list caches:`, error)
    return []
  }
}

/**
 * Deletes a cached content.
 */
export async function deleteCachedContent(
  apiKey: string,
  cacheName: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${cacheName}?key=${apiKey}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to delete cache: ${response.status}`)
    }

    console.log(`[Cache] Deleted cache ${cacheName}`)
    return true
  } catch (error) {
    console.error(`[Cache] Failed to delete cache ${cacheName}:`, error)
    return false
  }
}

/**
 * Updates an existing cache or creates a new one if it doesn't exist or is expired.
 */
export async function getOrCreateProjectCache(
  apiKey: string,
  projectId: string,
  projectType: string = "multi-page"
): Promise<CachedContent> {
  // Try to find existing cache by listing all caches and matching displayName
  const allCaches = await listCachedContents(apiKey)
  const existingCache = allCaches.find(c => c.displayName === `project-${projectId}-cache`)
  
  if (existingCache && existingCache.name) {
    // Check if cache is still valid (not expired)
    const expiresAt = new Date(existingCache.expireTime || '')
    const now = new Date()
    
    if (expiresAt > now) {
      console.log(`[Cache] Using existing cache for project ${projectId}`)
      return existingCache
    } else {
      console.log(`[Cache] Cache expired for project ${projectId}, creating new one`)
      // Delete expired cache
      await deleteCachedContent(apiKey, existingCache.name)
    }
  }
  
  // Create new cache
  return await createProjectCache(apiKey, projectId, projectType)
}

/**
 * Creates a generative model that uses cached content.
 * This is a helper function to use with getGenerativeModelFromCachedContent.
 */
export async function getModelWithCache(
  apiKey: string,
  projectId: string,
  modelName: string = "gemini-1.5-pro-002"
): Promise<any> {
  const genAI = new GoogleGenerativeAI(apiKey)
  
  // Get or create cache for this project
  const cachedContent = await getOrCreateProjectCache(apiKey, projectId)
  
  // Create model from cached content
  const model = genAI.getGenerativeModelFromCachedContent(cachedContent, {
    model: modelName
  })
  
  return model
}
