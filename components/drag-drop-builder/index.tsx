"use client"

import { useState, useCallback, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { useBuilderStore, type BuilderElement, type BuilderProject, type ProjectTheme } from "@/lib/builder-store"
import { BuilderSidebar } from "./sidebar"
import { BuilderCanvas } from "./canvas"
import { PropertiesPanel } from "./properties-panel"
import { PageFlow } from "./page-flow"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  GitBranch,
  Plus,
  ChevronDown,
  Pencil,
  Trash2,
  Download,
  Eye,
  Save,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type DeviceWidth = "mobile" | "tablet" | "desktop"
type ViewMode = "builder" | "flow"

// ── Code Exporter ─────────────────────────────────────────────────────────────

function projectToViteHTML(project: BuilderProject): string {
  const theme = project.theme
  const pages = project.pageOrder.map((id) => project.pages[id])

  const renderElement = (el: BuilderElement, indent = 4): string => {
    const styleStr = Object.entries(el.style)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}`)
      .join(";")
    const styleAttr = styleStr ? ` style="${styleStr}"` : ""

    switch (el.type) {
      case "heading": {
        const tag = `h${el.props.level ?? 2}`
        return `${" ".repeat(indent)}<${tag}${styleAttr}>${el.props.text ?? "Heading"}</${tag}>`
      }
      case "paragraph":
        return `${" ".repeat(indent)}<p${styleAttr}>${el.props.text ?? ""}</p>`
      case "button":
        return `${" ".repeat(indent)}<a href="${el.props.href ?? "#"}"${styleAttr}>${el.props.text ?? "Button"}</a>`
      case "image":
        return `${" ".repeat(indent)}<img src="${el.props.src ?? ""}" alt="${el.props.alt ?? ""}"${styleAttr} />`
      case "divider":
        return `${" ".repeat(indent)}<hr${styleAttr} />`
      case "spacer":
        return `${" ".repeat(indent)}<div${styleAttr}></div>`
      case "badge":
        return `${" ".repeat(indent)}<span${styleAttr}>${el.props.text ?? ""}</span>`
      case "input":
        return `${" ".repeat(indent)}<input type="text" placeholder="${el.props.placeholder ?? ""}"${styleAttr} />`
      case "list": {
        const items = (el.props.items as string[] | undefined) ?? []
        const lis = items.map((item) => `${" ".repeat(indent + 2)}<li>${item}</li>`).join("\n")
        return `${" ".repeat(indent)}<ul${styleAttr}>\n${lis}\n${" ".repeat(indent)}</ul>`
      }
      default: {
        const children = el.children.map((c) => renderElement(c, indent + 2)).join("\n")
        return `${" ".repeat(indent)}<div${styleAttr}>${children ? `\n${children}\n${" ".repeat(indent)}` : ""}</div>`
      }
    }
  }

  const htmlPages = pages
    .map((page) => {
      const body = page.elements.map((el) => renderElement(el)).join("\n")
      return `<!-- Page: ${page.name} (${page.slug}) -->\n${body}`
    })
    .join("\n\n")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.name}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ${theme.fontFamily};
      background: ${theme.backgroundColor};
      color: ${theme.textColor};
    }
  </style>
</head>
<body>
${htmlPages}
</body>
</html>`
}

// ── Add Page Dialog ────────────────────────────────────────────────────────────

function AddPageDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addPage } = useBuilderStore()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  const handleNameChange = (v: string) => {
    setName(v)
    setSlug("/" + v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    addPage(name.trim(), slug || `/${name.toLowerCase().replace(/\s+/g, "-")}`)
    setName("")
    setSlug("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Page</DialogTitle>
          <DialogDescription>Create a new page in your website project.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Page Name</Label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="About Us"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>URL Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="/about-us"
              className="font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim()}>
              Add Page
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Export Dialog ──────────────────────────────────────────────────────────────

function ExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project } = useBuilderStore()
  const html = projectToViteHTML(project)

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Download the generated HTML for your Vite + TypeScript project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
            {html}
          </pre>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Theme Panel ───────────────────────────────────────────────────────────────

function ThemePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project, updateTheme } = useBuilderStore()
  const theme = project.theme

  const update = (key: keyof ProjectTheme, value: string) => updateTheme({ [key]: value })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Theme Settings</DialogTitle>
          <DialogDescription>Customize colors and typography for your project.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {(
            [
              { key: "primaryColor", label: "Primary Color", type: "color" },
              { key: "secondaryColor", label: "Secondary Color", type: "color" },
              { key: "backgroundColor", label: "Background", type: "color" },
              { key: "textColor", label: "Text Color", type: "color" },
            ] as { key: keyof ProjectTheme; label: string; type: string }[]
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label className="text-sm">{label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(theme[key] as string) ?? "#000000"}
                  onChange={(e) => update(key, e.target.value)}
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <Input
                  value={(theme[key] as string) ?? ""}
                  onChange={(e) => update(key, e.target.value)}
                  className="h-8 w-28 text-xs font-mono"
                />
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-sm">Font Family</Label>
            <Input
              value={theme.fontFamily}
              onChange={(e) => update("fontFamily", e.target.value)}
              placeholder="Inter, sans-serif"
              className="text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Border Radius</Label>
            <Input
              value={theme.borderRadius}
              onChange={(e) => update("borderRadius", e.target.value)}
              placeholder="0.5rem"
              className="text-sm font-mono"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main DragDropBuilder ───────────────────────────────────────────────────────

interface DragDropBuilderProps {
  projectId: string
  projectName: string
  initialProject?: BuilderProject
  onSave?: (project: BuilderProject) => Promise<void>
}

export default function DragDropBuilder({
  projectId,
  projectName,
  initialProject,
  onSave,
}: DragDropBuilderProps) {
  const {
    project,
    currentPageId,
    selectedElementId,
    setCurrentPage,
    deletePage,
    undo,
    redo,
    historyIndex,
    history,
    loadProject,
    resetProject,
    setDragging,
  } = useBuilderStore()

  // Initialize project
  // Only reset/load once when projectId changes. loadProject and resetProject are
  // stable Zustand actions; initialProject and projectName are effectively constants
  // per render cycle so excluding them avoids unnecessary re-initialisations.
  useEffect(() => {
    if (initialProject) {
      loadProject(initialProject)
    } else {
      resetProject(projectId, projectName)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Panels
  const [showSidebar, setShowSidebar] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [deviceWidth, setDeviceWidth] = useState<DeviceWidth>("desktop")
  const [viewMode, setViewMode] = useState<ViewMode>("builder")
  const [addPageOpen, setAddPageOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // DnD sensors — support both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveDragId(String(event.active.id))
      setDragging(true)
    },
    [setDragging],
  )

  const handleDragEnd = useCallback(
    (_event: DragEndEvent) => {
      setActiveDragId(null)
      setDragging(false)
    },
    [setDragging],
  )

  const handleSave = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(project)
    } finally {
      setIsSaving(false)
    }
  }

  const currentPage = project.pages[currentPageId]
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-border flex items-center px-3 gap-2 shrink-0 bg-background z-30">
        {/* Left group */}
        <div className="flex items-center gap-2 mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSidebar((s) => !s)}
            title={showSidebar ? "Hide elements" : "Show elements"}
          >
            {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>

          <div className="h-5 w-px bg-border" />

          {/* Page selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 max-w-[160px]">
                <span className="truncate text-sm font-medium">{currentPage?.name ?? "Select Page"}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {project.pageOrder.map((pageId) => {
                const page = project.pages[pageId]
                return (
                  <DropdownMenuItem
                    key={pageId}
                    onClick={() => setCurrentPage(pageId)}
                    className={cn(
                      "gap-2",
                      pageId === currentPageId && "bg-accent font-medium",
                    )}
                  >
                    <span className="flex-1 truncate">{page.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{page.slug}</span>
                    {project.pageOrder.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deletePage(pageId)
                        }}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete page"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAddPageOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center group — view & device toggles */}
        <div className="flex items-center gap-1.5 mr-auto">
          {/* View mode */}
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <button
              onClick={() => setViewMode("builder")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all",
                viewMode === "builder"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Pencil className="h-3 w-3" />
              Builder
            </button>
            <button
              onClick={() => setViewMode("flow")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all",
                viewMode === "flow"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GitBranch className="h-3 w-3" />
              Flow
            </button>
          </div>

          {/* Device width (only in builder mode) */}
          {viewMode === "builder" && (
            <div className="flex items-center bg-muted rounded-md p-0.5">
              {(
                [
                  { id: "desktop", icon: Monitor },
                  { id: "tablet", icon: Tablet },
                  { id: "mobile", icon: Smartphone },
                ] as { id: DeviceWidth; icon: typeof Monitor }[]
              ).map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setDeviceWidth(id)}
                  title={id}
                  className={cn(
                    "p-1.5 rounded transition-all",
                    deviceWidth === id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right group */}
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={undo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={redo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>

          <div className="h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setThemeOpen(true)}
            title="Theme settings"
          >
            <Eye className="h-3.5 w-3.5" />
            Theme
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setExportOpen(true)}
            title="Export project"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          {onSave && (
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}

          <div className="h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowProperties((s) => !s)}
            title={showProperties ? "Hide properties" : "Show properties"}
          >
            {showProperties ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      {viewMode === "builder" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 overflow-hidden">
            {showSidebar && <BuilderSidebar />}
            <BuilderCanvas deviceWidth={deviceWidth} />
            {showProperties && selectedElementId && <PropertiesPanel />}
          </div>

          <DragOverlay>
            {activeDragId ? (
              <div className="bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl opacity-90 pointer-events-none">
                Moving element...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 overflow-hidden">
          <PageFlow />
        </div>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <AddPageDialog open={addPageOpen} onClose={() => setAddPageOpen(false)} />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  )
}
