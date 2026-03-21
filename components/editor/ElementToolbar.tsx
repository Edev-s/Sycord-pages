"use client"

import { useState } from "react"
import {
  type ElementType,
  ELEMENT_CATEGORIES,
  createDefaultElement,
  type EditorElement,
} from "./editor-types"
import { cn } from "@/lib/utils"
import {
  Layers,
  Type,
  Image,
  Navigation,
  FormInput,
  Square,
  Columns2 as Columns,
  Minus,
  MoveVertical,
  Heading,
  MousePointerClick,
  Link,
  ImageIcon,
  Video,
  PanelTop,
  List,
  TextCursorInput,
  FileInput,
  ChevronDown,
  X,
  GripVertical,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Type,
  Image,
  Navigation,
  FormInput,
  Square,
  Columns,
  Minus,
  MoveVertical,
  Heading,
  MousePointerClick,
  Link,
  ImageIcon,
  Video,
  PanelTop,
  List,
  TextCursorInput,
  FileInput,
}

interface ElementToolbarProps {
  onAddElement: (element: EditorElement) => void
  isDragging: boolean
}

export default function ElementToolbar({
  onAddElement,
  isDragging,
}: ElementToolbarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null)
    } else {
      setExpandedCategory(categoryId)
      setIsExpanded(true)
    }
  }

  const handleAddElement = (type: ElementType) => {
    const el = createDefaultElement(type)
    if (el) {
      onAddElement(el)
      setExpandedCategory(null)
      setIsExpanded(false)
    }
  }

  const getCategoryIcon = (iconName: string) => {
    const Icon = ICON_MAP[iconName]
    return Icon ? <Icon className="size-5" /> : null
  }

  const getElementIcon = (iconName: string) => {
    const Icon = ICON_MAP[iconName]
    return Icon ? <Icon className="size-4" /> : null
  }

  if (isDragging) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 transition-all duration-300",
        "bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-white/10",
        "md:static md:border-t-0 md:border-l md:h-full md:w-72 md:bg-[#1a1a1a]",
      )}
    >
      {/* Mobile collapse handle */}
      <div className="md:hidden flex justify-center pt-2 pb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-1 bg-white/20 rounded-full"
          aria-label="Toggle toolbar"
        />
      </div>

      {/* Category tabs - horizontal on mobile, vertical on desktop */}
      <div
        className={cn(
          "flex md:flex-col gap-2 p-3 md:p-4 overflow-x-auto md:overflow-x-visible",
          "scrollbar-hide",
        )}
      >
        {ELEMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={cn(
              "flex-shrink-0 flex flex-col md:flex-row items-center gap-1 md:gap-3",
              "p-3 md:p-3 rounded-xl md:rounded-lg",
              "transition-all duration-200",
              "min-w-[72px] md:min-w-0 md:w-full",
              expandedCategory === cat.id
                ? "bg-violet-600/20 text-violet-400 ring-1 ring-violet-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80",
            )}
          >
            {getCategoryIcon(cat.icon)}
            <span className="text-[10px] md:text-sm font-medium">
              {cat.name}
            </span>
            <ChevronDown
              className={cn(
                "hidden md:block ml-auto size-4 transition-transform",
                expandedCategory === cat.id && "rotate-180",
              )}
            />
          </button>
        ))}
      </div>

      {/* Expanded element list */}
      {expandedCategory && (
        <div
          className={cn(
            "absolute bottom-full left-0 right-0 md:static",
            "bg-[#1a1a1a]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none",
            "border-t md:border-t-0 border-white/10",
            "p-3 md:p-4 md:pt-0",
            "max-h-[50vh] md:max-h-none overflow-y-auto",
          )}
        >
          <div className="flex items-center justify-between mb-3 md:hidden">
            <span className="text-sm font-medium text-white/80">
              {ELEMENT_CATEGORIES.find((c) => c.id === expandedCategory)?.name}
            </span>
            <button
              onClick={() => setExpandedCategory(null)}
              className="p-1 text-white/40 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {ELEMENT_CATEGORIES.find(
              (c) => c.id === expandedCategory,
            )?.elements.map((el) => (
              <button
                key={el.type}
                onClick={() => handleAddElement(el.type)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  "bg-white/5 hover:bg-violet-600/20 hover:text-violet-300",
                  "text-white/70 transition-all duration-200",
                  "text-left group cursor-grab active:cursor-grabbing",
                )}
              >
                <div className="p-2 rounded-md bg-white/5 group-hover:bg-violet-600/20">
                  {getElementIcon(el.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block">{el.label}</span>
                </div>
                <GripVertical className="size-3 text-white/20 group-hover:text-white/40 hidden md:block" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
