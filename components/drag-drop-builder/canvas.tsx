"use client"

import { useDroppable, useDndMonitor } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useBuilderStore, generateId, type BuilderElement } from "@/lib/builder-store"
import { ElementRenderer } from "./element-renderer"
import { cn } from "@/lib/utils"
import type { PaletteItem } from "./sidebar"

interface BuilderCanvasProps {
  deviceWidth: "mobile" | "tablet" | "desktop"
}

const DEVICE_WIDTHS: Record<string, string> = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
}

export function BuilderCanvas({ deviceWidth }: BuilderCanvasProps) {
  const { project, currentPageId, selectElement, addElement, reorderElements } =
    useBuilderStore()

  const currentPage = project.pages[currentPageId]
  const elements = currentPage?.elements ?? []

  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-root",
    data: { isCanvas: true },
  })

  useDndMonitor({
    onDragEnd(event) {
      const { active, over } = event
      if (!over || !currentPage) return

      // ── From palette: create a new element ────────────────────────────────
      if (active.data.current?.fromPalette) {
        const paletteData = active.data.current as {
          elementType: PaletteItem["type"]
          defaultProps: PaletteItem["defaultProps"]
          defaultStyle: PaletteItem["defaultStyle"]
        }

        const newElement: BuilderElement = {
          id: generateId(),
          type: paletteData.elementType,
          props: { ...paletteData.defaultProps },
          style: { ...paletteData.defaultStyle },
          children: [],
        }

        addElement(currentPageId, newElement)
        return
      }

      // ── Sortable reorder on the same canvas ───────────────────────────────
      const activeId = String(active.id)
      const overId = String(over.id)

      if (activeId === overId || overId === "canvas-root") return

      const fromIndex = elements.findIndex((el) => el.id === activeId)
      const toIndex = elements.findIndex((el) => el.id === overId)

      if (fromIndex !== -1 && toIndex !== -1) {
        reorderElements(currentPageId, fromIndex, toIndex)
      }
    },
  })

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No page selected
      </div>
    )
  }

  const canvasStyle: React.CSSProperties = {
    maxWidth: DEVICE_WIDTHS[deviceWidth],
    margin: "0 auto",
    minHeight: "600px",
    background: project.theme.backgroundColor,
    fontFamily: project.theme.fontFamily,
  }

  return (
    <div
      className="flex-1 overflow-auto bg-muted/30 p-6"
      onClick={() => selectElement(null)}
    >
      <div
        ref={setNodeRef}
        style={canvasStyle}
        className={cn(
          "w-full shadow-xl rounded-md border border-border transition-all relative",
          isOver && elements.length === 0 && "ring-2 ring-indigo-400 ring-dashed",
        )}
      >
        {elements.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center min-h-[600px] text-center p-12 transition-colors",
              isOver ? "bg-indigo-50 dark:bg-indigo-950/20" : "bg-transparent",
            )}
          >
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 border-2 border-dashed border-border">
              <span className="text-2xl">🎨</span>
            </div>
            <p className="text-base font-medium text-foreground mb-1">Start building your page</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Drag elements from the left panel and drop them here to build your website
            </p>
          </div>
        ) : (
          <SortableContext
            items={elements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            {elements.map((element) => (
              <ElementRenderer key={element.id} element={element} pageId={currentPageId} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}
