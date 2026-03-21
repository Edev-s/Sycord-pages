"use client"

import { useState, useEffect } from "react"
import type { EditorElement, EditorPage } from "./editor-types"
import { cn } from "@/lib/utils"
import {
  X,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Trash2,
  Copy,
} from "lucide-react"

interface ElementPropertiesProps {
  element: EditorElement | null
  pages: EditorPage[]
  onUpdate: (id: string, updates: Partial<EditorElement>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onClose: () => void
  isMobile: boolean
}

export default function ElementProperties({
  element,
  pages,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  isMobile,
}: ElementPropertiesProps) {
  const [localContent, setLocalContent] = useState("")
  const [activeTab, setActiveTab] = useState<"content" | "style" | "actions">("content")

  useEffect(() => {
    if (element) {
      setLocalContent(element.content)
    }
  }, [element?.id, element?.content])

  if (!element) return null

  const handleContentChange = (val: string) => {
    setLocalContent(val)
    onUpdate(element.id, { content: val })
  }

  const handleStyleChange = (key: string, val: string) => {
    onUpdate(element.id, {
      style: { ...element.style, [key]: val },
    })
  }

  const handlePropsChange = (key: string, val: string) => {
    onUpdate(element.id, {
      props: { ...element.props, [key]: val },
    })
  }

  const handleLinkToChange = (val: string) => {
    onUpdate(element.id, { linkTo: val || undefined })
  }

  const tabs = [
    { id: "content" as const, label: "Content", icon: Type },
    { id: "style" as const, label: "Style", icon: Palette },
    { id: "actions" as const, label: "Actions", icon: Link },
  ]

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white capitalize">
          {element.type}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicate(element.id)}
            className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/10"
            title="Duplicate"
          >
            <Copy className="size-4" />
          </button>
          <button
            onClick={() => onDelete(element.id)}
            className="p-1.5 text-red-400/60 hover:text-red-400 rounded-md hover:bg-red-500/10"
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "text-violet-400 border-b-2 border-violet-400"
                : "text-white/40 hover:text-white/60",
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "content" && (
          <>
            {(element.type === "heading" || element.type === "text" || element.type === "button" || element.type === "link" || element.type === "navbar" || element.type === "list") && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">
                  Text Content
                </label>
                {element.type === "text" || element.type === "list" ? (
                  <textarea
                    value={localContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                    rows={4}
                  />
                ) : (
                  <input
                    type="text"
                    value={localContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                )}
              </div>
            )}

            {element.type === "heading" && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">
                  Heading Level
                </label>
                <select
                  value={element.props.level || "2"}
                  onChange={(e) => handlePropsChange("level", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                >
                  <option value="1">H1</option>
                  <option value="2">H2</option>
                  <option value="3">H3</option>
                  <option value="4">H4</option>
                </select>
              </div>
            )}

            {element.type === "image" && (
              <>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={element.props.src || ""}
                    onChange={(e) => handlePropsChange("src", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={element.props.alt || ""}
                    onChange={(e) => handlePropsChange("alt", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
              </>
            )}

            {element.type === "input" && (
              <>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={element.props.placeholder || ""}
                    onChange={(e) =>
                      handlePropsChange("placeholder", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">
                    Input Type
                  </label>
                  <select
                    value={element.props.inputType || "text"}
                    onChange={(e) =>
                      handlePropsChange("inputType", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="password">Password</option>
                    <option value="number">Number</option>
                    <option value="tel">Phone</option>
                  </select>
                </div>
              </>
            )}

            {element.type === "video" && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">
                  Video / Embed URL
                </label>
                <input
                  type="text"
                  value={element.props.src || ""}
                  onChange={(e) => handlePropsChange("src", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  placeholder="https://youtube.com/embed/..."
                />
              </div>
            )}

            {element.type === "link" && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">
                  Link URL
                </label>
                <input
                  type="text"
                  value={element.props.href || ""}
                  onChange={(e) => handlePropsChange("href", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  placeholder="https://..."
                />
              </div>
            )}
          </>
        )}

        {activeTab === "style" && (
          <>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Text Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={element.style.color || "#ffffff"}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={element.style.color || ""}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Background
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={element.style.backgroundColor || "#000000"}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={element.style.backgroundColor || ""}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Font Size
              </label>
              <input
                type="text"
                value={element.style.fontSize || ""}
                onChange={(e) => handleStyleChange("fontSize", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                placeholder="16px"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Font Weight
              </label>
              <select
                value={element.style.fontWeight || "400"}
                onChange={(e) =>
                  handleStyleChange("fontWeight", e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              >
                <option value="300">Light</option>
                <option value="400">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Text Align
              </label>
              <div className="flex gap-1">
                {[
                  { val: "left", icon: AlignLeft },
                  { val: "center", icon: AlignCenter },
                  { val: "right", icon: AlignRight },
                ].map(({ val, icon: Icon }) => (
                  <button
                    key={val}
                    onClick={() => handleStyleChange("textAlign", val)}
                    className={cn(
                      "flex-1 p-2 rounded-lg flex justify-center",
                      element.style.textAlign === val
                        ? "bg-violet-600/20 text-violet-400"
                        : "bg-white/5 text-white/40 hover:bg-white/10",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Padding
              </label>
              <input
                type="text"
                value={element.style.padding || ""}
                onChange={(e) => handleStyleChange("padding", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                placeholder="8px"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Border Radius
              </label>
              <input
                type="text"
                value={element.style.borderRadius || ""}
                onChange={(e) =>
                  handleStyleChange("borderRadius", e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                placeholder="8px"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Width
              </label>
              <input
                type="text"
                value={element.style.width || ""}
                onChange={(e) => handleStyleChange("width", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                placeholder="100%"
              />
            </div>
          </>
        )}

        {activeTab === "actions" && (
          <>
            {element.type === "button" && (
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">
                  Navigate to Page
                </label>
                <select
                  value={element.linkTo || ""}
                  onChange={(e) => handleLinkToChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                >
                  <option value="">None</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-white/30 mt-1.5">
                  Link this button to navigate to another page
                </p>
              </div>
            )}

            {element.type !== "button" && (
              <p className="text-sm text-white/30 text-center py-8">
                No actions available for this element type
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )

  // Mobile: show as bottom sheet / popup overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />
        <div className="relative w-full max-h-[75vh] bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl overflow-hidden">
          {content}
        </div>
      </div>
    )
  }

  // Desktop: show as side panel
  return (
    <div className="w-80 h-full bg-[#1a1a1a] border-l border-white/10 overflow-hidden flex flex-col">
      {content}
    </div>
  )
}
