"use client"

import { useState } from "react"
import type { EditorPage } from "./editor-types"
import { cn } from "@/lib/utils"
import {
  Plus,
  FileText,
  Home,
  X,
  Pencil,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface PageManagerProps {
  pages: EditorPage[]
  activePageId: string
  onSelectPage: (id: string) => void
  onAddPage: () => void
  onDeletePage: (id: string) => void
  onRenamePage: (id: string, name: string) => void
  isMobile: boolean
}

export default function PageManager({
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  isMobile,
}: PageManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(isMobile)

  const startEditing = (page: EditorPage) => {
    setEditingId(page.id)
    setEditName(page.name)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRenamePage(editingId, editName.trim())
    }
    setEditingId(null)
  }

  if (isMobile) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 overflow-x-auto scrollbar-hide">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onSelectPage(page.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              activePageId === page.id
                ? "bg-violet-600/20 text-violet-400"
                : "text-white/40 hover:text-white/60",
            )}
          >
            {page.isHome ? <Home className="size-3" /> : <FileText className="size-3" />}
            {page.name}
          </button>
        ))}
        <button
          onClick={onAddPage}
          className="flex-shrink-0 p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5"
        >
          <Plus className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "h-full bg-[#1a1a1a] border-r border-white/10 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-12" : "w-56",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        {!isCollapsed && (
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Pages
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-white/30 hover:text-white/60 rounded"
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pages.map((page) => (
          <div
            key={page.id}
            className={cn(
              "group flex items-center rounded-lg transition-colors cursor-pointer",
              activePageId === page.id
                ? "bg-violet-600/15 text-violet-400"
                : "text-white/50 hover:bg-white/5 hover:text-white/70",
              isCollapsed ? "justify-center p-2" : "px-3 py-2",
            )}
            onClick={() => onSelectPage(page.id)}
          >
            {page.isHome ? (
              <Home className="size-4 flex-shrink-0" />
            ) : (
              <FileText className="size-4 flex-shrink-0" />
            )}

            {!isCollapsed && (
              <>
                {editingId === page.id ? (
                  <div className="flex-1 flex items-center gap-1 ml-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit()
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        saveEdit()
                      }}
                      className="p-0.5 text-green-400 hover:text-green-300"
                    >
                      <Check className="size-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 ml-2 text-sm truncate">
                      {page.name}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(page)
                        }}
                        className="p-0.5 text-white/30 hover:text-white/60"
                      >
                        <Pencil className="size-3" />
                      </button>
                      {!page.isHome && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeletePage(page.id)
                          }}
                          className="p-0.5 text-red-400/40 hover:text-red-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add page */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={onAddPage}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors",
            isCollapsed ? "justify-center p-2" : "px-3 py-2",
          )}
        >
          <Plus className="size-4" />
          {!isCollapsed && <span className="text-sm">Add Page</span>}
        </button>
      </div>
    </div>
  )
}
