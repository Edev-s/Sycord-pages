"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Menu,
  Save,
  Rocket,
  Loader2,
  Eye,
  Code,
  Undo2,
  Redo2,
  Smartphone,
  Monitor,
  X,
  Download,
  FileText,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

import type {
  EditorElement,
  EditorPage,
  EditorProject,
} from "@/components/editor/editor-types"
import { generateId, createDefaultElement } from "@/components/editor/editor-types"
import EditorCanvas from "@/components/editor/EditorCanvas"
import ElementToolbar from "@/components/editor/ElementToolbar"
import ElementProperties from "@/components/editor/ElementProperties"
import PageManager from "@/components/editor/PageManager"
import { generateViteProject, type GeneratedFile } from "@/components/editor/code-generator"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])
  return isMobile
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const isMobile = useIsMobile()
  const projectId = params.id as string

  // Editor state
  const [project, setProject] = useState<EditorProject>({
    pages: [
      {
        id: generateId(),
        name: "Home",
        slug: "index",
        elements: [],
        isHome: true,
      },
    ],
    activePageId: "",
    globalStyles: {
      fontFamily: "Inter",
      primaryColor: "#8b5cf6",
      backgroundColor: "#18191B",
      textColor: "#ffffff",
    },
  })

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [projectName, setProjectName] = useState("My Project")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("desktop")
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // History for undo/redo
  const [history, setHistory] = useState<EditorProject[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Initialize active page
  useEffect(() => {
    if (project.pages.length > 0 && !project.activePageId) {
      setProject((prev) => ({ ...prev, activePageId: prev.pages[0].id }))
    }
  }, [project.pages, project.activePageId])

  // Load project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setProjectName(data.name || "My Project")

          // Load saved editor state if available
          if (data.editorState) {
            setProject(data.editorState)
          }
        }
      } catch {
        // Use defaults
      }
    }
    if (projectId) fetchProject()
  }, [projectId])

  const activePage = project.pages.find((p) => p.id === project.activePageId) || project.pages[0]

  const selectedElement = activePage
    ? activePage.elements.find((el) => el.id === selectedElementId) || null
    : null

  // Push to history
  const pushHistory = useCallback(
    (newProject: EditorProject) => {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newProject)
      if (newHistory.length > 50) newHistory.shift()
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [history, historyIndex],
  )

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setProject(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setProject(history[historyIndex + 1])
    }
  }

  // Update project helper
  const updateProject = useCallback(
    (updater: (prev: EditorProject) => EditorProject) => {
      setProject((prev) => {
        const next = updater(prev)
        pushHistory(next)
        return next
      })
    },
    [pushHistory],
  )

  const updateActivePage = useCallback(
    (pageUpdater: (page: EditorPage) => EditorPage) => {
      updateProject((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? pageUpdater(p) : p,
        ),
      }))
    },
    [updateProject],
  )

  // Element operations
  const handleAddElement = (element: EditorElement) => {
    updateActivePage((page) => ({
      ...page,
      elements: [...page.elements, element],
    }))
    setSelectedElementId(element.id)
  }

  const handleUpdateElement = (id: string, updates: Partial<EditorElement>) => {
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el,
      ),
    }))
  }

  const handleDeleteElement = (id: string) => {
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.filter((el) => el.id !== id),
    }))
    if (selectedElementId === id) setSelectedElementId(null)
  }

  const handleDuplicateElement = (id: string) => {
    updateActivePage((page) => {
      const idx = page.elements.findIndex((el) => el.id === id)
      if (idx === -1) return page
      const original = page.elements[idx]
      const duplicate: EditorElement = {
        ...JSON.parse(JSON.stringify(original)),
        id: generateId(),
      }
      const newElements = [...page.elements]
      newElements.splice(idx + 1, 0, duplicate)
      return { ...page, elements: newElements }
    })
  }

  // Page operations
  const handleAddPage = () => {
    const newPage: EditorPage = {
      id: generateId(),
      name: `Page ${project.pages.length + 1}`,
      slug: `page-${project.pages.length + 1}`,
      elements: [],
    }
    updateProject((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
      activePageId: newPage.id,
    }))
  }

  const handleDeletePage = (id: string) => {
    if (project.pages.length <= 1) return
    const page = project.pages.find((p) => p.id === id)
    if (page?.isHome) return

    updateProject((prev) => {
      const remaining = prev.pages.filter((p) => p.id !== id)
      return {
        ...prev,
        pages: remaining,
        activePageId:
          prev.activePageId === id ? remaining[0].id : prev.activePageId,
      }
    })
  }

  const handleRenamePage = (id: string, name: string) => {
    updateProject((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id === id
          ? { ...p, name, slug: p.isHome ? "index" : name.toLowerCase().replace(/\s+/g, "-") }
          : p,
      ),
    }))
  }

  const handleSelectPage = (id: string) => {
    setProject((prev) => ({ ...prev, activePageId: id }))
    setSelectedElementId(null)
  }

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleDragStart = (_event: DragStartEvent) => {
    setIsDragging(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false)
    const { active, over } = event
    if (!over || active.id === over.id) return

    updateActivePage((page) => {
      const oldIndex = page.elements.findIndex((el) => el.id === active.id)
      const newIndex = page.elements.findIndex((el) => el.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return page
      return { ...page, elements: arrayMove(page.elements, oldIndex, newIndex) }
    })
  }

  // Save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editorState: project,
        }),
      })
      if (res.ok) {
        toast.success("Project saved")
      } else {
        toast.error("Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  // Deploy
  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      const files = generateViteProject(project)
      const pagesPayload = files.map((f) => ({
        name: f.path,
        code: f.content,
      }))

      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectName,
          pages: pagesPayload,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success("Deployed successfully!", {
          description: data.url || "Your site is live",
        })
      } else {
        toast.error("Deployment failed")
      }
    } catch {
      toast.error("Deployment failed")
    } finally {
      setIsDeploying(false)
    }
  }

  // Preview HTML generation
  const getPreviewHtml = () => {
    const files = generateViteProject(project)
    const indexFile = files.find((f) => f.name === "index.html")
    return indexFile?.content || ""
  }

  // Code export
  const getCodeFiles = (): GeneratedFile[] => {
    return generateViteProject(project)
  }

  const userInitial = session?.user?.name?.[0]?.toUpperCase() || "U"

  return (
    <div className="h-screen flex flex-col bg-[#111] text-white overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-white/10 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isMobile) {
                setShowMobileMenu(!showMobileMenu)
              } else {
                router.push(`/dashboard/sites/${projectId}`)
              }
            }}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/5"
          >
            {isMobile ? <Menu className="size-5" /> : <ArrowLeft className="size-5" />}
          </button>
          <span className="text-sm font-medium text-white/80 truncate max-w-[200px]">
            {projectName}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Undo / Redo - desktop only */}
          <div className="hidden md:flex items-center gap-0.5 mr-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/5"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 rounded-lg hover:bg-white/5"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => { setShowPreview(!showPreview); setShowCode(false) }}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              showPreview
                ? "bg-violet-600/20 text-violet-400"
                : "text-white/40 hover:text-white hover:bg-white/5",
            )}
          >
            <Eye className="size-4" />
          </button>

          {/* Code view toggle */}
          <button
            onClick={() => { setShowCode(!showCode); setShowPreview(false) }}
            className={cn(
              "hidden md:flex p-1.5 rounded-lg transition-colors",
              showCode
                ? "bg-violet-600/20 text-violet-400"
                : "text-white/40 hover:text-white hover:bg-white/5",
            )}
          >
            <Code className="size-4" />
          </button>

          {/* Device toggle (in preview mode) */}
          {showPreview && (
            <div className="hidden md:flex items-center gap-0.5 mx-1 bg-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "p-1.5 rounded-md",
                  previewDevice === "desktop"
                    ? "bg-white/10 text-white"
                    : "text-white/40",
                )}
              >
                <Monitor className="size-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "p-1.5 rounded-md",
                  previewDevice === "mobile"
                    ? "bg-white/10 text-white"
                    : "text-white/40",
                )}
              >
                <Smartphone className="size-4" />
              </button>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Deploy */}
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeploying ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
            <span className="hidden sm:inline">Deploy</span>
          </button>

          {/* Avatar */}
          <Avatar className="size-7 ml-1">
            <AvatarFallback className="bg-violet-600 text-white text-xs">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {showMobileMenu && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowMobileMenu(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-[#1a1a1a] border-r border-white/10 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">Menu</span>
              <button onClick={() => setShowMobileMenu(false)} className="p-1 text-white/40">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { router.push(`/dashboard/sites/${projectId}`); setShowMobileMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <ArrowLeft className="size-4" />
                Back to Site
              </button>
              <button
                onClick={() => { undo(); setShowMobileMenu(false) }}
                disabled={historyIndex <= 0}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30"
              >
                <Undo2 className="size-4" />
                Undo
              </button>
              <button
                onClick={() => { redo(); setShowMobileMenu(false) }}
                disabled={historyIndex >= history.length - 1}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30"
              >
                <Redo2 className="size-4" />
                Redo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page tabs - mobile only */}
      {isMobile && !showPreview && !showCode && (
        <div className="bg-[#1a1a1a] border-b border-white/10">
          <PageManager
            pages={project.pages}
            activePageId={project.activePageId}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onRenamePage={handleRenamePage}
            isMobile={true}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page sidebar - desktop */}
        {!isMobile && !showPreview && !showCode && (
          <PageManager
            pages={project.pages}
            activePageId={project.activePageId}
            onSelectPage={handleSelectPage}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onRenamePage={handleRenamePage}
            isMobile={false}
          />
        )}

        {/* Canvas or Preview or Code */}
        {showPreview ? (
          <div className="flex-1 flex items-center justify-center bg-[#111] p-4">
            <div
              className={cn(
                "bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300",
                previewDevice === "mobile"
                  ? "w-[375px] h-[667px]"
                  : "w-full max-w-5xl h-full",
              )}
            >
              <iframe
                srcDoc={getPreviewHtml()}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        ) : showCode ? (
          <div className="flex-1 overflow-y-auto bg-[#0d0d0d] p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/60">
                  Generated Code (Vite + TypeScript)
                </h3>
                <button
                  onClick={() => {
                    const files = getCodeFiles()
                    const content = files.map((f) => `// === ${f.path} ===\n${f.content}`).join("\n\n")
                    navigator.clipboard.writeText(content)
                    toast.success("Code copied to clipboard")
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/60 rounded-lg"
                >
                  <Download className="size-3" />
                  Copy All
                </button>
              </div>
              {getCodeFiles().map((file) => (
                <div key={file.path} className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/10">
                    <FileText className="size-3.5 text-white/40" />
                    <span className="text-xs font-mono text-white/60">{file.path}</span>
                  </div>
                  <pre className="p-4 text-xs text-white/70 overflow-x-auto font-mono leading-relaxed">
                    {file.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activePage?.elements.map((el) => el.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <EditorCanvas
                page={activePage || { id: "", name: "", slug: "", elements: [] }}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
              />
            </SortableContext>
          </DndContext>
        )}

        {/* Properties panel - desktop */}
        {!isMobile && selectedElement && !showPreview && !showCode && (
          <ElementProperties
            element={selectedElement}
            pages={project.pages}
            onUpdate={handleUpdateElement}
            onDelete={handleDeleteElement}
            onDuplicate={handleDuplicateElement}
            onClose={() => setSelectedElementId(null)}
            isMobile={false}
          />
        )}

        {/* Element toolbar - desktop */}
        {!isMobile && !showPreview && !showCode && (
          <ElementToolbar
            onAddElement={handleAddElement}
            isDragging={isDragging}
          />
        )}
      </div>

      {/* Bottom toolbar - mobile */}
      {isMobile && !showPreview && !showCode && (
        <ElementToolbar
          onAddElement={handleAddElement}
          isDragging={isDragging}
        />
      )}

      {/* Properties popup - mobile */}
      {isMobile && selectedElement && !showPreview && !showCode && (
        <ElementProperties
          element={selectedElement}
          pages={project.pages}
          onUpdate={handleUpdateElement}
          onDelete={handleDeleteElement}
          onDuplicate={handleDuplicateElement}
          onClose={() => setSelectedElementId(null)}
          isMobile={true}
        />
      )}
    </div>
  )
}
