"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import type { ElementType } from "@/lib/builder-store"
import {
  Type,
  AlignLeft,
  Square,
  Image,
  Layout,
  Minus,
  Space,
  Grid,
  Columns,
  TextCursor,
  FileText,
  Anchor,
  Star,
  List,
  Video,
  Zap,
} from "lucide-react"

interface PaletteItem {
  type: ElementType
  label: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  defaultProps: Record<string, unknown>
  defaultStyle: Record<string, string>
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Layout
  {
    type: "section",
    label: "Section",
    icon: Layout,
    category: "Layout",
    defaultProps: {},
    defaultStyle: { padding: "48px 24px", backgroundColor: "#ffffff", minHeight: "120px" },
  },
  {
    type: "container",
    label: "Container",
    icon: Square,
    category: "Layout",
    defaultProps: {},
    defaultStyle: { padding: "16px", maxWidth: "1200px", margin: "0 auto" },
  },
  {
    type: "columns",
    label: "Columns",
    icon: Columns,
    category: "Layout",
    defaultProps: { cols: 2 },
    defaultStyle: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
      padding: "16px",
    },
  },
  {
    type: "grid",
    label: "Grid",
    icon: Grid,
    category: "Layout",
    defaultProps: { cols: 3 },
    defaultStyle: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
      padding: "16px",
    },
  },
  {
    type: "card",
    label: "Card",
    icon: FileText,
    category: "Layout",
    defaultProps: {},
    defaultStyle: {
      padding: "24px",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      backgroundColor: "#ffffff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
  },
  // Typography
  {
    type: "heading",
    label: "Heading",
    icon: Type,
    category: "Typography",
    defaultProps: { text: "Your Heading", level: 2 },
    defaultStyle: { fontSize: "36px", fontWeight: "700", color: "#111827", margin: "0 0 16px 0" },
  },
  {
    type: "paragraph",
    label: "Paragraph",
    icon: AlignLeft,
    category: "Typography",
    defaultProps: { text: "Write your content here. Click to edit this text." },
    defaultStyle: { fontSize: "16px", color: "#6b7280", lineHeight: "1.6" },
  },
  {
    type: "badge",
    label: "Badge",
    icon: Star,
    category: "Typography",
    defaultProps: { text: "New" },
    defaultStyle: { backgroundColor: "#6366f1", color: "#ffffff" },
  },
  {
    type: "list",
    label: "List",
    icon: List,
    category: "Typography",
    defaultProps: { items: ["First item", "Second item", "Third item"] },
    defaultStyle: { fontSize: "16px", color: "#374151" },
  },
  // Interactive
  {
    type: "button",
    label: "Button",
    icon: Zap,
    category: "Interactive",
    defaultProps: { text: "Click Me", href: "#" },
    defaultStyle: {
      backgroundColor: "#6366f1",
      color: "#ffffff",
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      fontWeight: "600",
      fontSize: "14px",
      cursor: "pointer",
      display: "inline-block",
    },
  },
  {
    type: "input",
    label: "Input",
    icon: TextCursor,
    category: "Interactive",
    defaultProps: { placeholder: "Enter text...", label: "Label" },
    defaultStyle: { fontSize: "14px", color: "#374151" },
  },
  {
    type: "form",
    label: "Form",
    icon: FileText,
    category: "Interactive",
    defaultProps: {},
    defaultStyle: { padding: "24px", backgroundColor: "#f9fafb", borderRadius: "8px" },
  },
  // Media
  {
    type: "image",
    label: "Image",
    icon: Image,
    category: "Media",
    defaultProps: { src: "/placeholder.jpg", alt: "Image" },
    defaultStyle: { width: "100%", height: "auto", borderRadius: "8px", objectFit: "cover" },
  },
  {
    type: "video",
    label: "Video",
    icon: Video,
    category: "Media",
    defaultProps: { videoUrl: "" },
    defaultStyle: { width: "100%", borderRadius: "8px" },
  },
  // Structural
  {
    type: "navbar",
    label: "Navbar",
    icon: Anchor,
    category: "Structural",
    defaultProps: { text: "Brand" },
    defaultStyle: {
      backgroundColor: "#1f2937",
      color: "#ffffff",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
  },
  {
    type: "hero",
    label: "Hero",
    icon: Layout,
    category: "Structural",
    defaultProps: {},
    defaultStyle: {
      padding: "80px 24px",
      backgroundColor: "#6366f1",
      color: "#ffffff",
      textAlign: "center",
      minHeight: "400px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
  },
  {
    type: "footer",
    label: "Footer",
    icon: Minus,
    category: "Structural",
    defaultProps: { text: "© 2025 Your Company" },
    defaultStyle: {
      backgroundColor: "#1f2937",
      color: "#9ca3af",
      padding: "32px 24px",
      textAlign: "center",
      fontSize: "14px",
    },
  },
  // Decorative
  {
    type: "divider",
    label: "Divider",
    icon: Minus,
    category: "Decorative",
    defaultProps: {},
    defaultStyle: { border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" },
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: Space,
    category: "Decorative",
    defaultProps: {},
    defaultStyle: { height: "32px" },
  },
]

const CATEGORIES = ["Layout", "Typography", "Interactive", "Media", "Structural", "Decorative"]

interface DraggablePaletteItemProps {
  item: PaletteItem
}

function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      fromPalette: true,
      elementType: item.type,
      defaultProps: item.defaultProps,
      defaultStyle: item.defaultStyle,
    },
  })

  const Icon = item.icon

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-indigo-300 cursor-grab active:cursor-grabbing transition-all select-none text-center",
        isDragging && "opacity-50 ring-2 ring-indigo-400",
      )}
      title={item.label}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground font-medium leading-tight">{item.label}</span>
    </div>
  )
}

export function BuilderSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-background overflow-y-auto h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Elements</h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Drag onto the canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {CATEGORIES.map((category) => {
          const items = PALETTE_ITEMS.filter((i) => i.category === category)
          if (items.length === 0) return null
          return (
            <div key={category}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {category}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <DraggablePaletteItem key={item.type} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export { PALETTE_ITEMS }
export type { PaletteItem }
