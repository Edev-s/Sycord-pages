// ──────────────────────────────────────────────────────
// RAG Knowledge Base for AI Website Builder
// ──────────────────────────────────────────────────────
// Provides curated best-practice code patterns, framework
// templates, and reference implementations that get injected
// into the AI prompt as retrieval-augmented context.
// ──────────────────────────────────────────────────────

export interface KnowledgeChunk {
  id: string
  category: 'structure' | 'component' | 'style' | 'config' | 'pattern' | 'typescript' | 'accessibility'
  tags: string[]
  title: string
  content: string
  priority: number // 1 = highest
}

// ──────── Core Knowledge Chunks ────────

const KNOWLEDGE_BASE: KnowledgeChunk[] = [

  // ── TypeScript Best Practices ──
  {
    id: 'ts-strict-types',
    category: 'typescript',
    tags: ['typescript', 'types', 'interfaces', 'strict'],
    title: 'TypeScript Strict Typing Patterns',
    priority: 1,
    content: `
// ALWAYS define explicit return types and parameter types
// ALWAYS export interfaces from a shared types.ts file

// Good: shared types file (src/types.ts)
export interface SiteConfig {
  readonly title: string;
  readonly description: string;
  readonly nav: readonly NavItem[];
  readonly theme: ThemeConfig;
}

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon?: string;
  readonly children?: readonly NavItem[];
}

export interface ThemeConfig {
  readonly primaryColor: string;
  readonly fontHeading: string;
  readonly fontBody: string;
}

export interface ComponentResult {
  readonly element: HTMLElement;
  readonly destroy: () => void;
}

// Good: typed component with proper return
export function createComponent(config: SiteConfig): ComponentResult {
  const el = document.createElement('section');
  // ... build DOM
  return {
    element: el,
    destroy: () => el.remove()
  };
}

// Good: typed event handler
export function addClickHandler(
  selector: string,
  handler: (event: MouseEvent) => void
): () => void {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return () => {};
  el.addEventListener('click', handler as EventListener);
  return () => el.removeEventListener('click', handler as EventListener);
}

// Good: typed DOM query helper
export function qs<T extends HTMLElement>(selector: string, parent: ParentNode = document): T | null {
  return parent.querySelector<T>(selector);
}
export function qsa<T extends HTMLElement>(selector: string, parent: ParentNode = document): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}
`
  },

  // ── Vite + TS Entry Point Pattern ──
  {
    id: 'vite-entry-point',
    category: 'structure',
    tags: ['vite', 'main.ts', 'entry', 'initialization'],
    title: 'Vite Entry Point Pattern (src/main.ts)',
    priority: 1,
    content: `
// src/main.ts -- orchestrator pattern
// MUST import style.css first
import './style.css';

// Import ALL component initializers
import { renderHeader } from './components/header';
import { renderHero } from './components/hero';
import { renderFeatures } from './components/features';
import { renderFooter } from './components/footer';

// Import utilities
import { initSmoothScroll, initMobileMenu } from './utils';

// Import config/types
import type { SiteConfig } from './types';

const config: SiteConfig = {
  title: 'My Website',
  description: 'Built with Vite + TypeScript',
  nav: [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Contact', href: '#contact' }
  ],
  theme: {
    primaryColor: 'var(--color-primary)',
    fontHeading: 'var(--font-heading)',
    fontBody: 'var(--font-body)'
  }
};

function initApp(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('#app container not found');

  // Render in visual order
  renderHeader(app, config);
  renderHero(app, config);
  renderFeatures(app, config);
  renderFooter(app, config);

  // Initialize behaviors
  initSmoothScroll();
  initMobileMenu();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
`
  },

  // ── CSS Design System Pattern ──
  {
    id: 'css-design-system',
    category: 'style',
    tags: ['css', 'design-system', 'tokens', 'tailwind', 'style.css'],
    title: 'CSS Design System with Custom Properties',
    priority: 1,
    content: `
/* src/style.css -- design system tokens */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Color Palette */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-secondary: #8b5cf6;
  --color-accent: #06b6d4;
  --color-bg: #0f172a;
  --color-bg-alt: #1e293b;
  --color-surface: #334155;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-border: rgba(255, 255, 255, 0.1);

  /* Typography */
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing Scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  --spacing-3xl: 4rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}

/* Base Resets */
*, *::before, *::after { box-sizing: border-box; }
body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Utility Classes */
.container { max-width: 1200px; margin: 0 auto; padding: 0 var(--spacing-lg); }
.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); }
`
  },

  // ── Component Pattern (Typed + Accessible) ──
  {
    id: 'component-pattern',
    category: 'component',
    tags: ['component', 'typescript', 'dom', 'accessible', 'header'],
    title: 'Typed Component Pattern with Accessibility',
    priority: 1,
    content: `
// src/components/header.ts
import type { SiteConfig, NavItem } from '../types';

export function renderHeader(container: HTMLElement, config: SiteConfig): void {
  const header = document.createElement('header');
  header.setAttribute('role', 'banner');
  header.className = 'fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]';

  header.innerHTML = \`
    <nav class="container flex items-center justify-between h-16" role="navigation" aria-label="Main navigation">
      <a href="/" class="text-lg font-bold" style="font-family: var(--font-heading)">
        \${config.title}
      </a>

      <!-- Desktop Nav -->
      <ul class="hidden md:flex items-center gap-6" role="list">
        \${config.nav.map((item: NavItem) => \`
          <li>
            <a href="\${item.href}"
               class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
               style="transition: var(--transition-fast)">
              \${item.label}
            </a>
          </li>
        \`).join('')}
      </ul>

      <!-- Mobile Toggle -->
      <button
        class="md:hidden p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="Toggle menu"
        aria-expanded="false"
        data-mobile-toggle
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </nav>

    <!-- Mobile Menu -->
    <div class="md:hidden hidden bg-[var(--color-bg-alt)] border-b border-[var(--color-border)]" data-mobile-menu role="menu">
      <ul class="container py-4 space-y-2">
        \${config.nav.map((item: NavItem) => \`
          <li>
            <a href="\${item.href}" class="block py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]" role="menuitem">
              \${item.label}
            </a>
          </li>
        \`).join('')}
      </ul>
    </div>
  \`;

  container.prepend(header);
}
`
  },

  // ── Utility Functions Pattern ──
  {
    id: 'utils-pattern',
    category: 'pattern',
    tags: ['utils', 'helpers', 'typescript', 'dom', 'animation'],
    title: 'Typed Utility Functions',
    priority: 2,
    content: `
// src/utils.ts
import type { NavItem } from './types';

/** Type-safe DOM query */
export function qs<T extends HTMLElement>(selector: string, parent: ParentNode = document): T | null {
  return parent.querySelector<T>(selector);
}

/** Type-safe DOM query all */
export function qsa<T extends HTMLElement>(selector: string, parent: ParentNode = document): T[] {
  return Array.from(parent.querySelectorAll<T>(selector));
}

/** Debounce function with proper typing */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/** Initialize smooth scrolling for anchor links */
export function initSmoothScroll(): void {
  document.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) return;

    e.preventDefault();
    const id = anchor.getAttribute('href')?.slice(1);
    if (!id) return;

    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/** Initialize mobile menu toggle */
export function initMobileMenu(): void {
  const toggle = qs<HTMLButtonElement>('[data-mobile-toggle]');
  const menu = qs<HTMLDivElement>('[data-mobile-menu]');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });
}

/** Format date consistently */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(date));
}

/** Intersection Observer for scroll animations */
export function initScrollAnimations(selector: string = '[data-animate]'): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  qsa(selector).forEach((el) => observer.observe(el));
}
`
  },

  // ── Vite Config Best Practice ──
  {
    id: 'vite-config',
    category: 'config',
    tags: ['vite', 'config', 'build', 'cloudflare'],
    title: 'Vite Config for Cloudflare Pages',
    priority: 2,
    content: `
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
`
  },

  // ── index.html Best Practice ──
  {
    id: 'html-shell',
    category: 'structure',
    tags: ['html', 'index', 'shell', 'seo', 'meta'],
    title: 'index.html Shell with SEO and Accessibility',
    priority: 2,
    content: `
<!-- index.html -- MUST be in project root -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{{DESCRIPTION}}" />
  <meta name="theme-color" content="#0f172a" />
  <title>{{TITLE}}</title>

  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Preconnect to fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</head>
<body class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`
  },

  // ── Accessibility ──
  {
    id: 'a11y-patterns',
    category: 'accessibility',
    tags: ['accessibility', 'a11y', 'aria', 'semantic', 'wcag'],
    title: 'Accessibility Patterns',
    priority: 2,
    content: `
// Accessibility Best Practices for Generated Sites:
// 1. Use semantic HTML: <header>, <nav>, <main>, <section>, <article>, <footer>
// 2. All images need alt text: <img alt="Description of image" />
// 3. Interactive elements need focus styles:
//    class="focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
// 4. Color contrast must be WCAG AA (4.5:1 for text, 3:1 for large text)
// 5. Buttons need descriptive text or aria-label
// 6. Navigation must have aria-label="Main navigation"
// 7. Skip-to-content link: <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
// 8. Form inputs need associated <label> elements
// 9. Use role attributes where HTML5 semantics aren't sufficient
// 10. Reduced motion: @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`
  },

  // ── Animation Patterns ──
  {
    id: 'animation-patterns',
    category: 'pattern',
    tags: ['animation', 'css', 'transitions', 'scroll', 'motion'],
    title: 'CSS Animation Patterns for Web Sites',
    priority: 3,
    content: `
/* Animation utilities for style.css */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-in {
  animation: fadeInUp 0.6s ease forwards;
}
[data-animate] {
  opacity: 0;
  transform: translateY(20px);
}
[data-animate].animate-in {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

/* Stagger children */
[data-animate-stagger] > * {
  opacity: 0;
  transform: translateY(10px);
}
[data-animate-stagger].animate-in > *:nth-child(1) { transition-delay: 0ms; }
[data-animate-stagger].animate-in > *:nth-child(2) { transition-delay: 100ms; }
[data-animate-stagger].animate-in > *:nth-child(3) { transition-delay: 200ms; }
[data-animate-stagger].animate-in > *:nth-child(4) { transition-delay: 300ms; }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`
  },

  // ── Package.json Template ──
  {
    id: 'package-json',
    category: 'config',
    tags: ['package.json', 'dependencies', 'npm', 'vite'],
    title: 'package.json Template for Vite + TS',
    priority: 2,
    content: `
{
  "name": "project-name",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.4.0"
  }
}
`
  },

  // ── tsconfig Template ──
  {
    id: 'tsconfig-json',
    category: 'config',
    tags: ['tsconfig', 'typescript', 'config', 'strict'],
    title: 'tsconfig.json for Vite + Strict TS',
    priority: 2,
    content: `
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "useDefineForClassFields": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
`
  },
]

// ──────── RAG Retrieval Engine ────────

/**
 * Simple keyword-based retrieval that scores chunks against a query.
 * Returns top-K most relevant knowledge chunks.
 */
function scoreChunk(chunk: KnowledgeChunk, queryTokens: string[]): number {
  let score = 0
  const contentLower = (chunk.content + ' ' + chunk.title + ' ' + chunk.tags.join(' ')).toLowerCase()

  for (const token of queryTokens) {
    // Tag exact match is strongest signal
    if (chunk.tags.some(t => t === token)) score += 5
    // Title contains token
    if (chunk.title.toLowerCase().includes(token)) score += 3
    // Content contains token
    if (contentLower.includes(token)) score += 1
  }

  // Boost by priority (lower priority number = higher boost)
  score += (4 - chunk.priority)

  return score
}

/**
 * Retrieve the most relevant knowledge chunks for a given file generation context.
 *
 * @param filename - The file being generated (e.g., "src/components/header.ts")
 * @param usedFor  - The purpose description
 * @param userPrompt - Original user request
 * @param topK - Maximum number of chunks to return
 */
export function retrieveKnowledge(
  filename: string,
  usedFor: string,
  userPrompt: string,
  topK: number = 4
): KnowledgeChunk[] {
  // Build query tokens from all context
  const raw = `${filename} ${usedFor} ${userPrompt}`.toLowerCase()
  const queryTokens = raw
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2)

  // Add inferred tags based on filename
  if (filename.includes('main.ts')) queryTokens.push('entry', 'main', 'initialization')
  if (filename.includes('types.ts')) queryTokens.push('typescript', 'types', 'interfaces')
  if (filename.includes('style.css')) queryTokens.push('css', 'design-system', 'tokens', 'style')
  if (filename.includes('utils.ts')) queryTokens.push('utils', 'helpers')
  if (filename.includes('components/')) queryTokens.push('component', 'dom', 'accessible')
  if (filename.includes('index.html')) queryTokens.push('html', 'shell', 'seo')
  if (filename.includes('package.json')) queryTokens.push('package.json', 'dependencies')
  if (filename.includes('tsconfig')) queryTokens.push('tsconfig', 'typescript', 'config')
  if (filename.includes('vite.config')) queryTokens.push('vite', 'config', 'build')
  if (filename.includes('.gitignore')) queryTokens.push('gitignore')

  // Score all chunks
  const scored = KNOWLEDGE_BASE.map(chunk => ({
    chunk,
    score: scoreChunk(chunk, queryTokens),
  }))

  // Sort by score descending, take top K
  scored.sort((a, b) => b.score - a.score)

  return scored
    .slice(0, topK)
    .filter(s => s.score > 0)
    .map(s => s.chunk)
}

/**
 * Format retrieved knowledge chunks into a prompt-ready string.
 */
export function formatKnowledgeForPrompt(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return ''

  const sections = chunks.map((chunk, i) => `
--- REFERENCE ${i + 1}: ${chunk.title} (${chunk.category}) ---
${chunk.content}
`)

  return `
===== RAG: BEST-PRACTICE REFERENCES =====
The following are curated code patterns and best practices.
You MUST follow these patterns when generating code.
Adapt them to the specific project requirements.

${sections.join('\n')}
===== END RAG REFERENCES =====
`
}

/**
 * Full RAG pipeline: retrieve + format for a given file context.
 */
export function getRAGContext(
  filename: string,
  usedFor: string,
  userPrompt: string,
  topK: number = 4
): string {
  const chunks = retrieveKnowledge(filename, usedFor, userPrompt, topK)
  return formatKnowledgeForPrompt(chunks)
}
