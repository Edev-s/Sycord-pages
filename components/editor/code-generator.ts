import type { EditorElement, EditorPage, EditorProject } from "./editor-types"

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function styleToCSS(style: Record<string, string | undefined>): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      const cssKey = k.replace(/([A-Z])/g, "-$1").toLowerCase()
      return `${cssKey}: ${v}`
    })
    .join("; ")
}

function getPageHref(page: EditorPage | undefined): string {
  if (!page) return "#"
  return page.slug === "index" ? "/" : `/${page.slug}.html`
}

function renderElement(el: EditorElement, pages: EditorPage[]): string {
  const style = styleToCSS(el.style as Record<string, string | undefined>)

  switch (el.type) {
    case "heading": {
      const level = el.props.level || "2"
      return `<h${level} style="${style}">${escapeHtml(el.content)}</h${level}>`
    }
    case "text":
      return `<p style="${style}">${escapeHtml(el.content)}</p>`
    case "button": {
      const linkedPage = el.linkTo ? pages.find((p) => p.id === el.linkTo) : undefined
      const href = getPageHref(linkedPage)
      if (linkedPage) {
        return `<a href="${href}" style="text-decoration: none;"><button style="${style}; cursor: pointer;">${escapeHtml(el.content)}</button></a>`
      }
      return `<button style="${style}; cursor: pointer;">${escapeHtml(el.content)}</button>`
    }
    case "image":
      return `<img src="${escapeHtml(el.props.src || "")}" alt="${escapeHtml(el.props.alt || "")}" style="${style}" />`
    case "divider":
      return `<hr style="${style}" />`
    case "spacer":
      return `<div style="${style}"></div>`
    case "container":
      return `<div style="${style}">${(el.children || []).map((c) => renderElement(c, pages)).join("\n")}</div>`
    case "columns": {
      const cols = parseInt(el.props.columns || "2", 10)
      const childItems = el.children || []
      let html = `<div style="${style}">`
      for (let i = 0; i < cols; i++) {
        html += `<div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">`
        if (childItems[i]) {
          html += renderElement(childItems[i], pages)
        }
        html += `</div>`
      }
      html += `</div>`
      return html
    }
    case "link": {
      const href = el.props.href || "#"
      return `<a href="${escapeHtml(href)}" style="${style}">${escapeHtml(el.content)}</a>`
    }
    case "list": {
      const items = el.content.split("\n").filter(Boolean)
      const ordered = el.props.ordered === "true"
      const tag = ordered ? "ol" : "ul"
      return `<${tag} style="${style}">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</${tag}>`
    }
    case "video": {
      if (el.props.type === "embed" && el.props.src) {
        return `<iframe src="${escapeHtml(el.props.src)}" style="${style}; aspect-ratio: 16/9; border: none;" allowfullscreen></iframe>`
      }
      return `<video src="${escapeHtml(el.props.src || "")}" style="${style}" controls></video>`
    }
    case "navbar": {
      return `<nav style="${style}">
  <span style="font-weight: 700; font-size: 18px; color: #fff;">${escapeHtml(el.content)}</span>
  <div style="display: flex; gap: 16px;">
    ${pages.filter((p) => !p.isHome).map((p) => `<a href="${getPageHref(p)}" style="color: #ccc; text-decoration: none;">${escapeHtml(p.name)}</a>`).join("\n    ")}
  </div>
</nav>`
    }
    case "input":
      return `<input type="${escapeHtml(el.props.inputType || "text")}" placeholder="${escapeHtml(el.props.placeholder || "")}" style="${style}" />`
    case "form":
      return `<form style="${style}" onsubmit="event.preventDefault();">${(el.children || []).map((c) => renderElement(c, pages)).join("\n")}<button type="submit" style="padding: 10px 24px; background: #8b5cf6; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Submit</button></form>`
    default:
      return `<div style="${style}">${escapeHtml(el.content)}</div>`
  }
}

function generatePageHTML(
  page: EditorPage,
  project: EditorProject,
): string {
  const { globalStyles, pages } = project
  const bodyContent = page.elements.map((el) => renderElement(el, pages)).join("\n    ")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${globalStyles.fontFamily}, system-ui, sans-serif;
      background-color: ${globalStyles.backgroundColor};
      color: ${globalStyles.textColor};
      min-height: 100vh;
    }
    a { transition: opacity 0.2s; }
    a:hover { opacity: 0.8; }
    button { transition: opacity 0.2s; }
    button:hover { opacity: 0.9; }
    img { max-width: 100%; height: auto; }
    @media (max-width: 768px) {
      body { padding: 8px; }
    }
  </style>
</head>
<body>
  <div id="app" style="max-width: 1200px; margin: 0 auto; padding: 16px;">
    ${bodyContent}
  </div>
</body>
</html>`
}

export interface GeneratedFile {
  name: string
  content: string
  path: string
}

export function generateViteProject(project: EditorProject): GeneratedFile[] {
  const files: GeneratedFile[] = []

  files.push({
    name: "package.json",
    path: "package.json",
    content: JSON.stringify(
      {
        name: "my-site",
        private: true,
        version: "1.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
        },
        devDependencies: {
          typescript: "^5.3.0",
          vite: "^5.4.0",
        },
      },
      null,
      2,
    ),
  })

  files.push({
    name: "tsconfig.json",
    path: "tsconfig.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          module: "ESNext",
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          isolatedModules: true,
          moduleDetection: "force",
          noEmit: true,
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ["src"],
      },
      null,
      2,
    ),
  })

  files.push({
    name: "vite.config.ts",
    path: "vite.config.ts",
    content: `import { defineConfig } from 'vite'\n\nexport default defineConfig({})\n`,
  })

  files.push({
    name: ".gitignore",
    path: ".gitignore",
    content: "node_modules\ndist\n.env\n",
  })

  const homePage = project.pages.find((p) => p.isHome) || project.pages[0]

  files.push({
    name: "index.html",
    path: "index.html",
    content: generatePageHTML(homePage, project),
  })

  for (const page of project.pages) {
    if (page.isHome) continue
    files.push({
      name: `${page.slug}.html`,
      path: `${page.slug}.html`,
      content: generatePageHTML(page, project),
    })
  }

  files.push({
    name: "main.ts",
    path: "src/main.ts",
    content: `// Site entry point\nconsole.log('Site loaded');\n`,
  })

  files.push({
    name: "style.css",
    path: "src/style.css",
    content: `:root {\n  --primary: ${project.globalStyles.primaryColor};\n  --bg: ${project.globalStyles.backgroundColor};\n  --text: ${project.globalStyles.textColor};\n}\n`,
  })

  return files
}
