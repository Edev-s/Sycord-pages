"use client"

import React, { useCallback } from "react"
import { useBuilderStore, type BuilderElement } from "@/lib/builder-store"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Trash2, GripVertical } from "lucide-react"

interface ElementRendererProps {
  element: BuilderElement
  pageId: string
  depth?: number
}

function ElementContent({ element }: { element: BuilderElement }) {
  switch (element.type) {
    case "heading": {
      const level = element.props.level ?? 1
      const style = element.style as React.CSSProperties
      const text = element.props.text ?? "Heading"
      if (level === 1) return <h1 style={style}>{text}</h1>
      if (level === 2) return <h2 style={style}>{text}</h2>
      if (level === 3) return <h3 style={style}>{text}</h3>
      if (level === 4) return <h4 style={style}>{text}</h4>
      if (level === 5) return <h5 style={style}>{text}</h5>
      return <h6 style={style}>{text}</h6>
    }

    case "paragraph":
      return <p style={element.style as React.CSSProperties}>{element.props.text ?? "Paragraph text"}</p>

    case "button":
      return (
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            ...(element.style as React.CSSProperties),
          }}
          className="cursor-pointer transition-opacity hover:opacity-90 focus:outline-none"
        >
          {element.props.text ?? "Button"}
        </button>
      )

    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.props.src ?? "/placeholder.svg"}
          alt={element.props.alt ?? "Image"}
          style={{ width: "100%", height: "auto", display: "block", ...(element.style as React.CSSProperties) }}
        />
      )

    case "divider":
      return (
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #e5e7eb",
            margin: "16px 0",
            ...(element.style as React.CSSProperties),
          }}
        />
      )

    case "spacer":
      return (
        <div
          style={{ height: element.style.height ?? "32px", ...(element.style as React.CSSProperties) }}
          className="bg-transparent"
        />
      )

    case "badge":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 10px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "600",
            ...(element.style as React.CSSProperties),
          }}
        >
          {element.props.text ?? "Badge"}
        </span>
      )

    case "list":
      return (
        <ul style={element.style as React.CSSProperties} className="list-disc list-inside space-y-1">
          {(element.props.items ?? ["Item 1", "Item 2", "Item 3"]).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case "input":
      return (
        <input
          type="text"
          placeholder={element.props.placeholder ?? "Enter text..."}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
            ...(element.style as React.CSSProperties),
          }}
          readOnly
        />
      )

    case "video":
      return (
        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            overflow: "hidden",
            ...(element.style as React.CSSProperties),
          }}
        >
          <span style={{ color: "#fff", fontSize: "14px", opacity: 0.7 }}>▶ Video</span>
        </div>
      )

    case "navbar":
      return (
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            backgroundColor: "#1f2937",
            color: "#ffffff",
            ...(element.style as React.CSSProperties),
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "18px" }}>{element.props.text ?? "Brand"}</span>
          <div style={{ display: "flex", gap: "24px", fontSize: "14px" }}>
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        </nav>
      )

    case "hero":
      return (
        <div
          style={{
            padding: "80px 24px",
            backgroundColor: "#6366f1",
            color: "#ffffff",
            textAlign: "center",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            ...(element.style as React.CSSProperties),
          }}
        >
          <h1 style={{ fontSize: "48px", fontWeight: 800, margin: "0 0 16px 0" }}>
            {element.props.text ?? "Hero Title"}
          </h1>
          <p style={{ fontSize: "18px", opacity: 0.85, margin: "0 0 32px 0", maxWidth: "600px" }}>
            Your compelling subtitle goes here.
          </p>
          <button
            style={{
              padding: "14px 32px",
              backgroundColor: "#ffffff",
              color: "#6366f1",
              borderRadius: "8px",
              fontWeight: 600,
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Get Started
          </button>
        </div>
      )

    case "footer":
      return (
        <footer
          style={{
            padding: "32px 24px",
            backgroundColor: "#1f2937",
            color: "#9ca3af",
            textAlign: "center",
            fontSize: "14px",
            ...(element.style as React.CSSProperties),
          }}
        >
          {element.props.text ?? "© 2025 Your Company. All rights reserved."}
        </footer>
      )

    default:
      return null
  }
}

export function ElementRenderer({ element, pageId, depth = 0 }: ElementRendererProps) {
  const { selectedElementId, selectElement, deleteElement, hoveredElementId, hoverElement, updateElement } =
    useBuilderStore()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.id,
    data: { type: element.type, pageId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isSelected = selectedElementId === element.id
  const isHovered = hoveredElementId === element.id

  const isContainer = ["container", "section", "card", "grid", "columns", "form"].includes(
    element.type,
  )

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectElement(element.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElement(pageId, element.id)
  }

  // Corner resize handler
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.preventDefault()
      const el = e.currentTarget.parentElement as HTMLElement
      if (!el) return
      const startX = e.clientX
      const startY = e.clientY
      const startW = el.offsetWidth
      const startH = el.offsetHeight

      const onMove = (me: PointerEvent) => {
        const newW = Math.max(40, startW + me.clientX - startX)
        const newH = Math.max(20, startH + me.clientY - startY)
        updateElement(pageId, element.id, {
          style: { width: `${newW}px`, height: `${newH}px` },
        })
      }
      const onUp = () => {
        document.removeEventListener("pointermove", onMove)
        document.removeEventListener("pointerup", onUp)
      }
      document.addEventListener("pointermove", onMove)
      document.addEventListener("pointerup", onUp)
    },
    [pageId, element.id, updateElement],
  )
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/el",
        isDragging && "opacity-40",
        isSelected && "ring-2 ring-indigo-500 ring-offset-1",
        isHovered && !isSelected && "ring-1 ring-indigo-300 ring-offset-1",
      )}
      onClick={handleClick}
      onMouseEnter={(e) => { e.stopPropagation(); hoverElement(element.id) }}
      onMouseLeave={(e) => { e.stopPropagation(); hoverElement(null) }}
    >
      {/* Drag handle + action toolbar */}
      {(isSelected || isHovered) && (
        <div
          className="absolute -top-7 left-0 flex items-center gap-1 bg-indigo-600 text-white text-[10px] rounded-t px-1.5 py-0.5 z-50 select-none shadow"
          style={{ whiteSpace: "nowrap" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing flex items-center"
            title="Drag to reorder"
          >
            <GripVertical className="h-3 w-3 mr-1" />
          </span>
          <span className="font-medium capitalize">{element.type}</span>
          <button
            onClick={handleDelete}
            className="ml-1 hover:text-red-300 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Element body */}
      {isContainer ? (
        <div
          style={{
            padding: element.style.padding ?? "16px",
            ...(element.style as React.CSSProperties),
          }}
          className={cn(
            "min-h-[60px]",
            element.children.length === 0 && "border-2 border-dashed border-gray-200",
          )}
        >
          {element.children.length === 0 ? (
            <div className="flex items-center justify-center h-12 text-gray-400 text-xs select-none">
              Drop elements here
            </div>
          ) : (
            element.children.map((child) => (
              <ElementRenderer key={child.id} element={child} pageId={pageId} depth={depth + 1} />
            ))
          )}
        </div>
      ) : (
        <ElementContent element={element} />
      )}

      {/* Corner resize handle — shown only when selected */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-end justify-end"
          onPointerDown={handleResizePointerDown}
          title="Resize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-indigo-500 fill-current">
            <path d="M10 0 L10 10 L0 10 Z" />
          </svg>
        </div>
      )}
    </div>
  )
}
