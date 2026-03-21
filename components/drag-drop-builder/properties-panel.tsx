"use client"

import { useState } from "react"
import { useBuilderStore, type BuilderElement, type ElementStyle } from "@/lib/builder-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, X, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Section {
  title: string
  defaultOpen?: boolean
}

function Collapsible({ title, children, defaultOpen = true }: Section & { children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {title}
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function StyleInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className="h-7 text-xs font-mono"
      />
    </div>
  )
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 rounded border border-border cursor-pointer"
        />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-7 text-xs font-mono flex-1"
        />
      </div>
    </div>
  )
}

/** Find element by ID deep in the tree */
function findElement(elements: BuilderElement[], id: string): BuilderElement | null {
  for (const el of elements) {
    if (el.id === id) return el
    const found = findElement(el.children, id)
    if (found) return found
  }
  return null
}

export function PropertiesPanel() {
  const { project, currentPageId, selectedElementId, selectElement, updateElement, deleteElement } =
    useBuilderStore()

  const currentPage = project.pages[currentPageId]
  const selected = selectedElementId
    ? findElement(currentPage?.elements ?? [], selectedElementId)
    : null

  if (!selected) {
    return (
      <aside className="w-64 shrink-0 border-l border-border bg-background h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-2xl mb-2">👆</div>
            <p className="text-xs text-muted-foreground">Select an element to edit its properties</p>
          </div>
        </div>
      </aside>
    )
  }

  const updateStyle = (key: keyof ElementStyle, value: string) => {
    updateElement(currentPageId, selected.id, { style: { [key]: value } })
  }

  const updateProp = (key: string, value: unknown) => {
    updateElement(currentPageId, selected.id, { props: { [key]: value } })
  }

  return (
    <aside className="w-64 shrink-0 border-l border-border bg-background h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Editing</p>
          <h2 className="text-sm font-semibold text-foreground capitalize">{selected.type}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => {
              deleteElement(currentPageId, selected.id)
              selectElement(null)
            }}
            title="Delete element"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => selectElement(null)}
            title="Deselect"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content section */}
      <Collapsible title="Content">
        {(selected.type === "heading" || selected.type === "paragraph" || selected.type === "button" || selected.type === "badge") && (
          <StyleInput
            label="Text"
            value={selected.props.text as string}
            onChange={(v) => updateProp("text", v)}
            placeholder="Enter text..."
          />
        )}
        {selected.type === "heading" && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</Label>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5, 6] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => updateProp("level", lvl)}
                  className={cn(
                    "flex-1 py-1 text-xs rounded border transition-colors",
                    selected.props.level === lvl
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-border hover:bg-accent",
                  )}
                >
                  H{lvl}
                </button>
              ))}
            </div>
          </div>
        )}
        {selected.type === "image" && (
          <>
            <StyleInput
              label="Image URL"
              value={selected.props.src as string}
              onChange={(v) => updateProp("src", v)}
              placeholder="https://..."
            />
            <StyleInput
              label="Alt Text"
              value={selected.props.alt as string}
              onChange={(v) => updateProp("alt", v)}
              placeholder="Image description"
            />
          </>
        )}
        {selected.type === "button" && (
          <StyleInput
            label="Link (href)"
            value={selected.props.href as string}
            onChange={(v) => updateProp("href", v)}
            placeholder="#"
          />
        )}
        {selected.type === "input" && (
          <>
            <StyleInput
              label="Placeholder"
              value={selected.props.placeholder as string}
              onChange={(v) => updateProp("placeholder", v)}
              placeholder="Enter text..."
            />
            <StyleInput
              label="Label"
              value={selected.props.label as string}
              onChange={(v) => updateProp("label", v)}
              placeholder="Label"
            />
          </>
        )}
      </Collapsible>

      {/* Typography section */}
      <Collapsible title="Typography">
        <StyleInput
          label="Font Size"
          value={selected.style.fontSize}
          onChange={(v) => updateStyle("fontSize", v)}
          placeholder="16px"
        />
        <StyleInput
          label="Font Weight"
          value={selected.style.fontWeight}
          onChange={(v) => updateStyle("fontWeight", v)}
          placeholder="400"
        />
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Alignment</Label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateStyle("textAlign", align)}
                className={cn(
                  "flex-1 py-1 text-xs rounded border capitalize transition-colors",
                  selected.style.textAlign === align
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-border hover:bg-accent",
                )}
              >
                {align.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <ColorInput
          label="Text Color"
          value={selected.style.color}
          onChange={(v) => updateStyle("color", v)}
        />
      </Collapsible>

      {/* Spacing section */}
      <Collapsible title="Spacing" defaultOpen={false}>
        <StyleInput
          label="Padding"
          value={selected.style.padding}
          onChange={(v) => updateStyle("padding", v)}
          placeholder="16px"
        />
        <StyleInput
          label="Margin"
          value={selected.style.margin}
          onChange={(v) => updateStyle("margin", v)}
          placeholder="0"
        />
        <StyleInput
          label="Width"
          value={selected.style.width}
          onChange={(v) => updateStyle("width", v)}
          placeholder="100%"
        />
        <StyleInput
          label="Height"
          value={selected.style.height}
          onChange={(v) => updateStyle("height", v)}
          placeholder="auto"
        />
        <StyleInput
          label="Min Height"
          value={selected.style.minHeight}
          onChange={(v) => updateStyle("minHeight", v)}
          placeholder="auto"
        />
      </Collapsible>

      {/* Appearance section */}
      <Collapsible title="Appearance" defaultOpen={false}>
        <ColorInput
          label="Background Color"
          value={selected.style.backgroundColor}
          onChange={(v) => updateStyle("backgroundColor", v)}
        />
        <StyleInput
          label="Border Radius"
          value={selected.style.borderRadius}
          onChange={(v) => updateStyle("borderRadius", v)}
          placeholder="8px"
        />
        <StyleInput
          label="Border"
          value={selected.style.border}
          onChange={(v) => updateStyle("border", v)}
          placeholder="1px solid #e5e7eb"
        />
        <StyleInput
          label="Box Shadow"
          value={selected.style.boxShadow}
          onChange={(v) => updateStyle("boxShadow", v)}
          placeholder="0 4px 6px rgba(0,0,0,0.1)"
        />
        <StyleInput
          label="Opacity"
          value={selected.style.opacity}
          onChange={(v) => updateStyle("opacity", v)}
          placeholder="1"
        />
      </Collapsible>

      {/* Element ID (read-only reference) */}
      <Collapsible title="Advanced" defaultOpen={false}>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Element ID</Label>
          <Input value={selected.id} readOnly className="h-7 text-xs font-mono text-muted-foreground" />
        </div>
      </Collapsible>
    </aside>
  )
}
