"use client"

import { useState } from "react"
import type { EditorElement, EditorPage } from "./editor-types"
import { cn } from "@/lib/utils"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  Heading,
  Type,
  MousePointerClick,
  Image as ImageIcon,
  Minus,
  MoveVertical,
  Square,
  Columns2 as Columns,
  Link,
  Video,
  PanelTop,
  List,
  TextCursorInput,
  FileInput,
} from "lucide-react"

const TYPE_ICONS: Record<string, React.ElementType> = {
  heading: Heading,
  text: Type,
  button: MousePointerClick,
  image: ImageIcon,
  divider: Minus,
  spacer: MoveVertical,
  container: Square,
  columns: Columns,
  link: Link,
  video: Video,
  navbar: PanelTop,
  list: List,
  input: TextCursorInput,
  form: FileInput,
}

interface CanvasElementProps {
  element: EditorElement
  isSelected: boolean
  onSelect: (id: string) => void
}

function CanvasElement({ element, isSelected, onSelect }: CanvasElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const TypeIcon = TYPE_ICONS[element.type] || Square

  const renderContent = () => {
    switch (element.type) {
      case "heading": {
        const level = element.props.level || "2"
        const headingStyle = element.style as React.CSSProperties
        const headingText = element.content || "Heading"
        if (level === "1") return <h1 style={headingStyle}>{headingText}</h1>
        if (level === "3") return <h3 style={headingStyle}>{headingText}</h3>
        if (level === "4") return <h4 style={headingStyle}>{headingText}</h4>
        return <h2 style={headingStyle}>{headingText}</h2>
      }
      case "text":
        return (
          <p style={element.style as React.CSSProperties}>
            {element.content || "Text block"}
          </p>
        )
      case "button":
        return (
          <button
            style={element.style as React.CSSProperties}
            className="pointer-events-none"
          >
            {element.content || "Button"}
          </button>
        )
      case "image":
        return element.props.src ? (
          <img
            src={element.props.src}
            alt={element.props.alt || ""}
            style={element.style as React.CSSProperties}
            className="pointer-events-none"
          />
        ) : (
          <div
            className="flex items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-lg"
            style={{ ...element.style as React.CSSProperties, minHeight: "80px" }}
          >
            <ImageIcon className="size-8 text-white/20" />
          </div>
        )
      case "divider":
        return <hr style={element.style as React.CSSProperties} />
      case "spacer":
        return (
          <div
            style={element.style as React.CSSProperties}
            className="border border-dashed border-white/10 rounded flex items-center justify-center"
          >
            <span className="text-[10px] text-white/20">Spacer</span>
          </div>
        )
      case "container":
        return (
          <div
            style={element.style as React.CSSProperties}
            className="border border-dashed border-white/15 rounded-lg min-h-[60px] flex items-center justify-center"
          >
            <span className="text-xs text-white/20">Container</span>
          </div>
        )
      case "navbar":
        return (
          <nav
            style={element.style as React.CSSProperties}
            className="pointer-events-none"
          >
            <span style={{ fontWeight: 700, fontSize: "18px", color: "#fff" }}>
              {element.content || "Site Name"}
            </span>
            <div style={{ display: "flex", gap: "16px" }}>
              <span className="text-white/50 text-sm">Page 1</span>
              <span className="text-white/50 text-sm">Page 2</span>
            </div>
          </nav>
        )
      case "input":
        return (
          <input
            type={element.props.inputType || "text"}
            placeholder={element.props.placeholder || "Input..."}
            style={element.style as React.CSSProperties}
            className="pointer-events-none"
            readOnly
          />
        )
      case "link":
        return (
          <span style={element.style as React.CSSProperties}>
            {element.content || "Link"}
          </span>
        )
      case "list": {
        const items = (element.content || "Item 1\nItem 2").split("\n")
        const ListTag = element.props.ordered === "true" ? "ol" : "ul"
        return (
          <ListTag style={{ ...element.style as React.CSSProperties, paddingLeft: "20px" }}>
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ListTag>
        )
      }
      case "video":
        return (
          <div
            className="flex items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-lg"
            style={{ ...element.style as React.CSSProperties, minHeight: "120px" }}
          >
            <Video className="size-8 text-white/20" />
            <span className="ml-2 text-xs text-white/20">
              {element.props.src ? "Video embed" : "No video set"}
            </span>
          </div>
        )
      case "form":
        return (
          <div
            style={element.style as React.CSSProperties}
            className="border border-dashed border-white/15 rounded-lg min-h-[80px] flex items-center justify-center"
          >
            <span className="text-xs text-white/20">Form</span>
          </div>
        )
      default:
        return (
          <div style={element.style as React.CSSProperties}>
            {element.content}
          </div>
        )
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(element.id)
      }}
      className={cn(
        "group relative rounded-lg transition-all duration-150",
        isDragging && "opacity-50 z-50",
        isSelected
          ? "ring-2 ring-violet-500 ring-offset-1 ring-offset-[#2a2a2a]"
          : "hover:ring-1 hover:ring-white/20",
      )}
    >
      {/* Drag handle + type label */}
      <div
        className={cn(
          "absolute -top-5 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isSelected
            ? "bg-violet-600 text-white opacity-100"
            : "bg-white/10 text-white/60",
        )}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="size-3" />
        </div>
        <TypeIcon className="size-3" />
        <span className="capitalize">{element.type}</span>
      </div>

      {/* Element content */}
      <div className="relative">{renderContent()}</div>
    </div>
  )
}

interface EditorCanvasProps {
  page: EditorPage
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
}

export default function EditorCanvas({
  page,
  selectedElementId,
  onSelectElement,
}: EditorCanvasProps) {
  return (
    <div
      className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-y-auto"
      onClick={() => onSelectElement(null)}
    >
      <div
        className={cn(
          "w-full max-w-3xl min-h-[60vh] md:min-h-[70vh]",
          "bg-[#2a2a2a] rounded-2xl p-4 md:p-6",
          "border border-white/5",
          "transition-all duration-300",
        )}
      >
        {page.elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Square className="size-8 text-white/20" />
            </div>
            <p className="text-white/30 text-sm mb-1">
              No elements yet
            </p>
            <p className="text-white/20 text-xs">
              Add elements from the toolbar below
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            {page.elements.map((el) => (
              <CanvasElement
                key={el.id}
                element={el}
                isSelected={selectedElementId === el.id}
                onSelect={onSelectElement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { CanvasElement }
