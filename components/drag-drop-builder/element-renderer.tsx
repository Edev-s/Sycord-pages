"use client"

import React from "react"
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
        <button style={element.style as React.CSSProperties} className="cursor-pointer">
          {element.props.text ?? "Button"}
        </button>
      )

    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.props.src ?? "/placeholder.svg"}
          alt={element.props.alt ?? "Image"}
          style={{ width: "100%", height: "auto", ...(element.style as React.CSSProperties) }}
        />
      )

    case "divider":
      return <hr style={element.style as React.CSSProperties} />

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
            ...(element.style as React.CSSProperties),
          }}
        >
          <span style={{ color: "#fff", fontSize: "14px" }}>▶ Video</span>
        </div>
      )

    default:
      return null
  }
}

export function ElementRenderer({ element, pageId, depth = 0 }: ElementRendererProps) {
  const { selectedElementId, selectElement, deleteElement, hoveredElementId, hoverElement } =
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

  const isContainer = ["container", "section", "navbar", "hero", "card", "grid", "columns", "form", "footer"].includes(
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
            title="Drag"
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
    </div>
  )
}
