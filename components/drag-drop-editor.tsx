"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Search,
  Save,
  Code2,
  Settings2,
  Monitor,
  Smartphone,
  Undo2,
  Redo2,
  Plus,
  X,
  Loader2,
  Layout,
  Type,
  MousePointerClick,
  FormInput,
  Navigation,
  BarChart2,
  Bell,
  Layers,
  CheckSquare,
  AlignLeft,
  SlidersHorizontal,
  ToggleLeft,
  ListOrdered,
  Image,
  Table,
  User,
  Link,
  LayoutGrid,
  Minus,
  ChevronUp,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasElement {
  id: string
  type: string
  props: Record<string, unknown>
  children?: CanvasElement[]
}

interface PropDef {
  key: string
  label: string
  type: "text" | "select" | "boolean" | "color" | "number" | "textarea"
  options?: string[]
  defaultValue: unknown
}

interface ComponentDef {
  type: string
  label: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  defaultProps: Record<string, unknown>
  propDefs: PropDef[]
  previewComponent: (props: Record<string, unknown>) => React.ReactNode
  codeTemplate: (props: Record<string, unknown>) => string
}

// ─── HeroUI colour palette (for preview rendering) ────────────────────────────
const HEROUI_COLORS: Record<string, string> = {
  default: "#71717a",
  primary: "#006FEE",
  secondary: "#7828C8",
  success: "#17C964",
  warning: "#F5A524",
  danger: "#F31260",
}

const colorStyle = (color: string, variant = "solid"): React.CSSProperties => {
  const hex = HEROUI_COLORS[color] ?? HEROUI_COLORS.primary
  if (variant === "solid") return { backgroundColor: hex, color: "#fff" }
  if (variant === "bordered") return { border: `2px solid ${hex}`, color: hex, backgroundColor: "transparent" }
  if (variant === "flat") return { backgroundColor: `${hex}22`, color: hex }
  if (variant === "ghost") return { border: `2px solid ${hex}`, color: hex, backgroundColor: "transparent" }
  if (variant === "shadow") return { backgroundColor: hex, color: "#fff", boxShadow: `0 8px 24px ${hex}55` }
  if (variant === "light") return { color: hex, backgroundColor: "transparent" }
  return { backgroundColor: hex, color: "#fff" }
}

// ─── Component Catalog ────────────────────────────────────────────────────────

const CATALOG: ComponentDef[] = [
  // ── Layout ──────────────────────────────────────────────────────────────────
  {
    type: "Container",
    label: "Container",
    category: "Layout",
    icon: Layout,
    defaultProps: { maxWidth: "lg", padding: "md", className: "" },
    propDefs: [
      { key: "maxWidth", label: "Max Width", type: "select", options: ["sm", "md", "lg", "xl", "2xl", "full"], defaultValue: "lg" },
      { key: "padding", label: "Padding", type: "select", options: ["none", "sm", "md", "lg"], defaultValue: "md" },
    ],
    previewComponent: (props) => (
      <div style={{ maxWidth: props.maxWidth === "full" ? "100%" : undefined, border: "2px dashed #3f3f46", borderRadius: 12, padding: props.padding === "none" ? 0 : props.padding === "sm" ? 8 : props.padding === "lg" ? 24 : 16, minHeight: 48, color: "#a1a1aa", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Container ({String(props.maxWidth)})
      </div>
    ),
    codeTemplate: (p) => `<div className="container mx-auto max-w-${p.maxWidth} px-${p.padding === "sm" ? 4 : p.padding === "lg" ? 8 : 6}">\n  {/* content */}\n</div>`,
  },
  {
    type: "Spacer",
    label: "Spacer",
    category: "Layout",
    icon: Minus,
    defaultProps: { size: 4 },
    propDefs: [
      { key: "size", label: "Size (px)", type: "number", defaultValue: 16 },
    ],
    previewComponent: (props) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ width: "100%", height: 1, borderTop: "1px dashed #3f3f46" }} />
        <span style={{ fontSize: 11, color: "#52525b" }}>{String(props.size)}px spacer</span>
        <div style={{ width: "100%", height: 1, borderTop: "1px dashed #3f3f46" }} />
      </div>
    ),
    codeTemplate: (p) => `<Spacer y={${p.size}} />`,
  },
  {
    type: "Divider",
    label: "Divider",
    category: "Layout",
    icon: Minus,
    defaultProps: { orientation: "horizontal" },
    propDefs: [
      { key: "orientation", label: "Orientation", type: "select", options: ["horizontal", "vertical"], defaultValue: "horizontal" },
    ],
    previewComponent: () => (
      <div style={{ width: "100%", height: 1, backgroundColor: "#3f3f46", borderRadius: 9999 }} />
    ),
    codeTemplate: (p) => `<Divider orientation="${p.orientation}" />`,
  },
  {
    type: "ScrollShadow",
    label: "ScrollShadow",
    category: "Layout",
    icon: Layers,
    defaultProps: { size: 20 },
    propDefs: [
      { key: "size", label: "Shadow Size", type: "number", defaultValue: 20 },
    ],
    previewComponent: () => (
      <div style={{ border: "1px solid #3f3f46", borderRadius: 12, padding: 12, position: "relative", height: 80, background: "linear-gradient(to bottom, #27272a 0%, transparent 20%, transparent 80%, #27272a 100%)", color: "#a1a1aa", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
        ScrollShadow container
      </div>
    ),
    codeTemplate: (p) => `<ScrollShadow size={${p.size}} className="max-h-[400px]">\n  {/* scrollable content */}\n</ScrollShadow>`,
  },

  // ── Typography ───────────────────────────────────────────────────────────────
  {
    type: "H1",
    label: "Heading 1",
    category: "Typography",
    icon: Type,
    defaultProps: { text: "Page Title", color: "default" },
    propDefs: [
      { key: "text", label: "Text", type: "text", defaultValue: "Page Title" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "default" },
    ],
    previewComponent: (props) => (
      <h1 style={{ fontSize: 36, fontWeight: 800, color: props.color === "default" ? "#fafafa" : HEROUI_COLORS[String(props.color)], letterSpacing: "-0.02em" }}>{String(props.text)}</h1>
    ),
    codeTemplate: (p) => `<h1 className="text-4xl font-extrabold text-${p.color}">${p.text}</h1>`,
  },
  {
    type: "H2",
    label: "Heading 2",
    category: "Typography",
    icon: Type,
    defaultProps: { text: "Section Title", color: "default" },
    propDefs: [
      { key: "text", label: "Text", type: "text", defaultValue: "Section Title" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "default" },
    ],
    previewComponent: (props) => (
      <h2 style={{ fontSize: 28, fontWeight: 700, color: props.color === "default" ? "#fafafa" : HEROUI_COLORS[String(props.color)] }}>{String(props.text)}</h2>
    ),
    codeTemplate: (p) => `<h2 className="text-3xl font-bold text-${p.color}">${p.text}</h2>`,
  },
  {
    type: "H3",
    label: "Heading 3",
    category: "Typography",
    icon: Type,
    defaultProps: { text: "Subsection", color: "default" },
    propDefs: [
      { key: "text", label: "Text", type: "text", defaultValue: "Subsection" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary"], defaultValue: "default" },
    ],
    previewComponent: (props) => (
      <h3 style={{ fontSize: 22, fontWeight: 600, color: props.color === "default" ? "#fafafa" : HEROUI_COLORS[String(props.color)] }}>{String(props.text)}</h3>
    ),
    codeTemplate: (p) => `<h3 className="text-2xl font-semibold text-${p.color}">${p.text}</h3>`,
  },
  {
    type: "Paragraph",
    label: "Paragraph",
    category: "Typography",
    icon: AlignLeft,
    defaultProps: { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", size: "md" },
    propDefs: [
      { key: "text", label: "Text", type: "textarea", defaultValue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
    ],
    previewComponent: (props) => (
      <p style={{ fontSize: props.size === "sm" ? 13 : props.size === "lg" ? 18 : 15, color: "#a1a1aa", lineHeight: 1.6 }}>{String(props.text)}</p>
    ),
    codeTemplate: (p) => `<p className="text-${p.size} text-default-500">${p.text}</p>`,
  },
  {
    type: "Code",
    label: "Code",
    category: "Typography",
    icon: Code2,
    defaultProps: { code: "const x = 42;", color: "default", size: "md" },
    propDefs: [
      { key: "code", label: "Code", type: "text", defaultValue: "const x = 42;" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "default" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
    ],
    previewComponent: (props) => (
      <code style={{ fontFamily: "monospace", fontSize: props.size === "sm" ? 11 : props.size === "lg" ? 15 : 13, backgroundColor: "#27272a", color: props.color === "default" ? "#a1a1aa" : HEROUI_COLORS[String(props.color)], padding: "2px 8px", borderRadius: 6 }}>{String(props.code)}</code>
    ),
    codeTemplate: (p) => `<Code color="${p.color}" size="${p.size}">${p.code}</Code>`,
  },
  {
    type: "Kbd",
    label: "Kbd",
    category: "Typography",
    icon: Type,
    defaultProps: { keys: "Ctrl", text: "K" },
    propDefs: [
      { key: "keys", label: "Modifier", type: "select", options: ["ctrl", "shift", "alt", "meta", "enter", "escape", "space", "tab", ""], defaultValue: "ctrl" },
      { key: "text", label: "Key Text", type: "text", defaultValue: "K" },
    ],
    previewComponent: (props) => (
      <kbd style={{ fontFamily: "monospace", fontSize: 12, backgroundColor: "#27272a", color: "#fafafa", padding: "2px 8px", borderRadius: 6, border: "1px solid #3f3f46", boxShadow: "0 2px 0 #3f3f46" }}>{props.keys ? `${props.keys} + ` : ""}{String(props.text)}</kbd>
    ),
    codeTemplate: (p) => `<Kbd keys={["${p.keys}"]}>${p.text}</Kbd>`,
  },
  {
    type: "Snippet",
    label: "Snippet",
    category: "Typography",
    icon: Code2,
    defaultProps: { code: "npm install @heroui/react", color: "default" },
    propDefs: [
      { key: "code", label: "Code", type: "text", defaultValue: "npm install @heroui/react" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "default" },
    ],
    previewComponent: (props) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#27272a", borderRadius: 12, padding: "10px 16px", fontFamily: "monospace", fontSize: 13, color: props.color === "default" ? "#fafafa" : HEROUI_COLORS[String(props.color)] }}>
        <span style={{ color: "#71717a" }}>$</span>
        <span>{String(props.code)}</span>
        <button style={{ marginLeft: "auto", fontSize: 11, color: "#71717a", background: "none", border: "none", cursor: "pointer" }}>Copy</button>
      </div>
    ),
    codeTemplate: (p) => `<Snippet color="${p.color}">${p.code}</Snippet>`,
  },

  // ── Buttons ──────────────────────────────────────────────────────────────────
  {
    type: "Button",
    label: "Button",
    category: "Buttons",
    icon: MousePointerClick,
    defaultProps: { label: "Click me", color: "primary", variant: "solid", size: "md", radius: "md", isDisabled: false, isLoading: false },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Click me" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "variant", label: "Variant", type: "select", options: ["solid", "bordered", "flat", "ghost", "shadow", "light"], defaultValue: "solid" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "radius", label: "Radius", type: "select", options: ["none", "sm", "md", "lg", "full"], defaultValue: "md" },
      { key: "isDisabled", label: "Disabled", type: "boolean", defaultValue: false },
      { key: "isLoading", label: "Loading", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const radii: Record<string, string> = { none: "0", sm: "6px", md: "12px", lg: "18px", full: "9999px" }
      const sizes: Record<string, { padding: string; fontSize: string }> = { sm: { padding: "6px 14px", fontSize: "13px" }, md: { padding: "10px 20px", fontSize: "14px" }, lg: { padding: "14px 28px", fontSize: "16px" } }
      const s = sizes[String(props.size)] ?? sizes.md
      return (
        <button
          style={{ ...colorStyle(String(props.color), String(props.variant)), borderRadius: radii[String(props.radius)] ?? "12px", padding: s.padding, fontSize: s.fontSize, fontWeight: 500, cursor: props.isDisabled ? "not-allowed" : "pointer", opacity: props.isDisabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.2s", outline: "none" }}
          disabled={Boolean(props.isDisabled)}
        >
          {props.isLoading ? <span style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : null}
          {String(props.label)}
        </button>
      )
    },
    codeTemplate: (p) => `<Button color="${p.color}" variant="${p.variant}" size="${p.size}" radius="${p.radius}"${p.isDisabled ? " isDisabled" : ""}${p.isLoading ? " isLoading" : ""}>${p.label}</Button>`,
  },
  {
    type: "ButtonGroup",
    label: "ButtonGroup",
    category: "Buttons",
    icon: MousePointerClick,
    defaultProps: { variant: "solid", color: "primary", size: "md" },
    propDefs: [
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "variant", label: "Variant", type: "select", options: ["solid", "bordered", "flat", "ghost"], defaultValue: "solid" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
    ],
    previewComponent: (props) => (
      <div style={{ display: "inline-flex", overflow: "hidden", borderRadius: 12 }}>
        {["One", "Two", "Three"].map((label, i) => (
          <button key={label} style={{ ...colorStyle(String(props.color), String(props.variant)), padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.2)" : "none", outline: "none" }}>{label}</button>
        ))}
      </div>
    ),
    codeTemplate: (p) => `<ButtonGroup color="${p.color}" variant="${p.variant}" size="${p.size}">\n  <Button>One</Button>\n  <Button>Two</Button>\n  <Button>Three</Button>\n</ButtonGroup>`,
  },
  {
    type: "Link",
    label: "Link",
    category: "Buttons",
    icon: Link,
    defaultProps: { label: "Visit HeroUI", href: "#", color: "primary", size: "md", isExternal: false, showAnchorIcon: false },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Visit HeroUI" },
      { key: "href", label: "URL", type: "text", defaultValue: "#" },
      { key: "color", label: "Color", type: "select", options: ["foreground", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "isExternal", label: "External", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => (
      <a href="#" style={{ color: props.color === "foreground" ? "#fafafa" : HEROUI_COLORS[String(props.color)], fontSize: props.size === "sm" ? 13 : props.size === "lg" ? 18 : 15, textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}>{String(props.label)}{props.isExternal ? " ↗" : ""}</a>
    ),
    codeTemplate: (p) => `<Link href="${p.href}" color="${p.color}" size="${p.size}"${p.isExternal ? " isExternal" : ""}>${p.label}</Link>`,
  },

  // ── Inputs ───────────────────────────────────────────────────────────────────
  {
    type: "Input",
    label: "Input",
    category: "Inputs",
    icon: FormInput,
    defaultProps: { label: "Email", placeholder: "Enter your email", type: "text", variant: "flat", color: "default", size: "md", isRequired: false, isClearable: false, isDisabled: false },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Email" },
      { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "Enter your email" },
      { key: "type", label: "Type", type: "select", options: ["text", "email", "password", "number", "url", "tel", "search"], defaultValue: "text" },
      { key: "variant", label: "Variant", type: "select", options: ["flat", "bordered", "underlined", "faded"], defaultValue: "flat" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "default" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "isRequired", label: "Required", type: "boolean", defaultValue: false },
      { key: "isDisabled", label: "Disabled", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const accent = props.color === "default" ? "#71717a" : HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, color: accent, fontWeight: 500 }}>{String(props.label)}{props.isRequired ? " *" : ""}</label>
          <div style={{ backgroundColor: props.variant === "flat" ? "#27272a" : "transparent", border: props.variant === "bordered" ? `2px solid ${accent}` : props.variant === "underlined" ? "none" : "1px solid #3f3f46", borderBottom: props.variant === "underlined" ? `2px solid ${accent}` : undefined, borderRadius: props.variant === "underlined" ? 0 : 12, padding: "8px 12px", opacity: props.isDisabled ? 0.5 : 1 }}>
            <span style={{ color: "#52525b", fontSize: 14 }}>{String(props.placeholder)}</span>
          </div>
        </div>
      )
    },
    codeTemplate: (p) => `<Input label="${p.label}" placeholder="${p.placeholder}" type="${p.type}" variant="${p.variant}" color="${p.color}" size="${p.size}"${p.isRequired ? " isRequired" : ""}${p.isDisabled ? " isDisabled" : ""} />`,
  },
  {
    type: "Textarea",
    label: "Textarea",
    category: "Inputs",
    icon: AlignLeft,
    defaultProps: { label: "Description", placeholder: "Enter description...", variant: "flat", minRows: 3 },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Description" },
      { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "Enter description..." },
      { key: "variant", label: "Variant", type: "select", options: ["flat", "bordered", "underlined", "faded"], defaultValue: "flat" },
      { key: "minRows", label: "Min Rows", type: "number", defaultValue: 3 },
    ],
    previewComponent: (props) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 500 }}>{String(props.label)}</label>
        <div style={{ backgroundColor: "#27272a", border: props.variant === "bordered" ? "2px solid #71717a" : "1px solid #3f3f46", borderRadius: 12, padding: "8px 12px", minHeight: `${Number(props.minRows) * 24 + 16}px` }}>
          <span style={{ color: "#52525b", fontSize: 14 }}>{String(props.placeholder)}</span>
        </div>
      </div>
    ),
    codeTemplate: (p) => `<Textarea label="${p.label}" placeholder="${p.placeholder}" variant="${p.variant}" minRows={${p.minRows}} />`,
  },
  {
    type: "Select",
    label: "Select",
    category: "Inputs",
    icon: ChevronDown,
    defaultProps: { label: "Select option", placeholder: "Choose...", variant: "flat", color: "default", size: "md" },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Select option" },
      { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "Choose..." },
      { key: "variant", label: "Variant", type: "select", options: ["flat", "bordered", "underlined", "faded"], defaultValue: "flat" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary"], defaultValue: "default" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
    ],
    previewComponent: (props) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 500 }}>{String(props.label)}</label>
        <div style={{ backgroundColor: "#27272a", border: "1px solid #3f3f46", borderRadius: 12, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#52525b", fontSize: 14 }}>{String(props.placeholder)}</span>
          <ChevronDown style={{ width: 16, height: 16, color: "#71717a" }} />
        </div>
      </div>
    ),
    codeTemplate: (p) => `<Select label="${p.label}" placeholder="${p.placeholder}" variant="${p.variant}">\n  <SelectItem key="opt1">Option 1</SelectItem>\n  <SelectItem key="opt2">Option 2</SelectItem>\n</Select>`,
  },
  {
    type: "Checkbox",
    label: "Checkbox",
    category: "Inputs",
    icon: CheckSquare,
    defaultProps: { label: "Accept terms", color: "primary", size: "md", defaultSelected: false, isDisabled: false },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Accept terms" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "defaultSelected", label: "Checked", type: "boolean", defaultValue: false },
      { key: "isDisabled", label: "Disabled", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: props.isDisabled ? 0.5 : 1 }}>
          <div style={{ width: props.size === "sm" ? 16 : props.size === "lg" ? 24 : 20, height: props.size === "sm" ? 16 : props.size === "lg" ? 24 : 20, borderRadius: 4, border: `2px solid ${accent}`, backgroundColor: props.defaultSelected ? accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Boolean(props.defaultSelected) && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
          </div>
          <span style={{ color: "#fafafa", fontSize: 14 }}>{String(props.label)}</span>
        </div>
      )
    },
    codeTemplate: (p) => `<Checkbox color="${p.color}" size="${p.size}"${p.defaultSelected ? " defaultSelected" : ""}${p.isDisabled ? " isDisabled" : ""}>${p.label}</Checkbox>`,
  },
  {
    type: "RadioGroup",
    label: "RadioGroup",
    category: "Inputs",
    icon: ListOrdered,
    defaultProps: { label: "Choose plan", color: "primary", orientation: "vertical", defaultValue: "free" },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Choose plan" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "orientation", label: "Orientation", type: "select", options: ["vertical", "horizontal"], defaultValue: "vertical" },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 500 }}>{String(props.label)}</label>
          <div style={{ display: "flex", flexDirection: props.orientation === "horizontal" ? "row" : "column", gap: 8 }}>
            {["Free", "Pro", "Enterprise"].map((opt, i) => (
              <div key={opt} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {i === 0 && <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: accent }} />}
                </div>
                <span style={{ color: "#fafafa", fontSize: 14 }}>{opt}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    codeTemplate: (p) => `<RadioGroup label="${p.label}" color="${p.color}" orientation="${p.orientation}">\n  <Radio value="free">Free</Radio>\n  <Radio value="pro">Pro</Radio>\n  <Radio value="enterprise">Enterprise</Radio>\n</RadioGroup>`,
  },
  {
    type: "Switch",
    label: "Switch",
    category: "Inputs",
    icon: ToggleLeft,
    defaultProps: { label: "Enable notifications", color: "primary", size: "md", isSelected: false, isDisabled: false },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Enable notifications" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "isSelected", label: "On", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      const w = props.size === "sm" ? 36 : props.size === "lg" ? 52 : 44
      const h = props.size === "sm" ? 20 : props.size === "lg" ? 28 : 24
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: w, height: h, borderRadius: 9999, backgroundColor: props.isSelected ? accent : "#3f3f46", position: "relative", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: 2, left: props.isSelected ? w - h + 2 : 2, width: h - 4, height: h - 4, borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
          </div>
          <span style={{ color: "#fafafa", fontSize: 14 }}>{String(props.label)}</span>
        </div>
      )
    },
    codeTemplate: (p) => `<Switch color="${p.color}" size="${p.size}"${p.isSelected ? " defaultSelected" : ""}>${p.label}</Switch>`,
  },
  {
    type: "Slider",
    label: "Slider",
    category: "Inputs",
    icon: SlidersHorizontal,
    defaultProps: { label: "Volume", color: "primary", size: "md", step: 1, minValue: 0, maxValue: 100, defaultValue: 50, showTooltip: true },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "Volume" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "minValue", label: "Min", type: "number", defaultValue: 0 },
      { key: "maxValue", label: "Max", type: "number", defaultValue: 100 },
      { key: "defaultValue", label: "Default Value", type: "number", defaultValue: 50 },
      { key: "step", label: "Step", type: "number", defaultValue: 1 },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      const pct = ((Number(props.defaultValue) - Number(props.minValue)) / (Number(props.maxValue) - Number(props.minValue))) * 100
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <label style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 500 }}>{String(props.label)}</label>
            <span style={{ fontSize: 13, color: accent }}>{String(props.defaultValue)}</span>
          </div>
          <div style={{ position: "relative", height: 8, backgroundColor: "#3f3f46", borderRadius: 9999, width: "100%" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, backgroundColor: accent, borderRadius: 9999 }} />
            <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fff", boxShadow: `0 0 0 4px ${accent}` }} />
          </div>
        </div>
      )
    },
    codeTemplate: (p) => `<Slider label="${p.label}" color="${p.color}" size="${p.size}" step={${p.step}} minValue={${p.minValue}} maxValue={${p.maxValue}} defaultValue={${p.defaultValue}} />`,
  },

  // ── Navigation ───────────────────────────────────────────────────────────────
  {
    type: "Navbar",
    label: "Navbar",
    category: "Navigation",
    icon: Navigation,
    defaultProps: { brand: "MyApp", variant: "static", maxWidth: "xl", isBlurred: false },
    propDefs: [
      { key: "brand", label: "Brand Name", type: "text", defaultValue: "MyApp" },
      { key: "variant", label: "Variant", type: "select", options: ["static", "sticky", "floating"], defaultValue: "static" },
      { key: "maxWidth", label: "Max Width", type: "select", options: ["sm", "md", "lg", "xl", "2xl", "full"], defaultValue: "xl" },
      { key: "isBlurred", label: "Blur Effect", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => (
      <nav style={{ backgroundColor: props.isBlurred ? "rgba(24,25,27,0.8)" : "#18191B", borderBottom: "1px solid #27272a", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: props.isBlurred ? "blur(12px)" : "none", borderRadius: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: "#fafafa" }}>{String(props.brand)}</span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Home", "About", "Products"].map(item => (
            <span key={item} style={{ color: "#a1a1aa", fontSize: 14, cursor: "pointer" }}>{item}</span>
          ))}
        </div>
        <button style={{ ...colorStyle("primary", "solid"), borderRadius: 12, padding: "6px 16px", fontSize: 14, cursor: "pointer", border: "none" }}>Sign Up</button>
      </nav>
    ),
    codeTemplate: (p) => `<Navbar variant="${p.variant}" maxWidth="${p.maxWidth}"${p.isBlurred ? " isBlurred" : ""}>\n  <NavbarBrand>\n    <p className="font-bold text-inherit">${p.brand}</p>\n  </NavbarBrand>\n  <NavbarContent className="hidden sm:flex gap-4" justify="center">\n    <NavbarItem><Link color="foreground" href="#">Home</Link></NavbarItem>\n    <NavbarItem><Link color="foreground" href="#">About</Link></NavbarItem>\n  </NavbarContent>\n  <NavbarContent justify="end">\n    <NavbarItem><Button color="primary" variant="solid">Sign Up</Button></NavbarItem>\n  </NavbarContent>\n</Navbar>`,
  },
  {
    type: "Tabs",
    label: "Tabs",
    category: "Navigation",
    icon: LayoutGrid,
    defaultProps: { variant: "solid", color: "primary", size: "md", radius: "md" },
    propDefs: [
      { key: "variant", label: "Variant", type: "select", options: ["solid", "bordered", "light", "underlined"], defaultValue: "solid" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "radius", label: "Radius", type: "select", options: ["none", "sm", "md", "lg", "full"], defaultValue: "md" },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      return (
        <div>
          <div style={{ display: "flex", gap: 4, backgroundColor: props.variant === "solid" ? "#27272a" : "transparent", borderBottom: props.variant === "underlined" ? "2px solid #3f3f46" : "none", borderRadius: props.variant !== "underlined" ? 12 : 0, padding: props.variant === "solid" ? 4 : 0 }}>
            {["Photos", "Music", "Videos"].map((tab, i) => (
              <div key={tab} style={{ padding: "8px 16px", fontSize: 14, fontWeight: 500, borderRadius: 8, cursor: "pointer", backgroundColor: i === 0 && props.variant === "solid" ? accent : "transparent", color: i === 0 ? (props.variant === "solid" ? "#fff" : accent) : "#71717a", borderBottom: i === 0 && props.variant === "underlined" ? `2px solid ${accent}` : "none" }}>
                {tab}
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 4px", color: "#a1a1aa", fontSize: 13 }}>Tab content goes here</div>
        </div>
      )
    },
    codeTemplate: (p) => `<Tabs variant="${p.variant}" color="${p.color}" size="${p.size}" radius="${p.radius}">\n  <Tab key="photos" title="Photos">\n    <p>Photos content</p>\n  </Tab>\n  <Tab key="music" title="Music">\n    <p>Music content</p>\n  </Tab>\n  <Tab key="videos" title="Videos">\n    <p>Videos content</p>\n  </Tab>\n</Tabs>`,
  },
  {
    type: "Breadcrumbs",
    label: "Breadcrumbs",
    category: "Navigation",
    icon: ChevronRight,
    defaultProps: { variant: "solid", color: "primary", size: "md", separator: "/" },
    propDefs: [
      { key: "variant", label: "Variant", type: "select", options: ["solid", "bordered", "light"], defaultValue: "solid" },
      { key: "color", label: "Color", type: "select", options: ["foreground", "primary", "secondary"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
    ],
    previewComponent: (props) => {
      const accent = props.color === "foreground" ? "#fafafa" : HEROUI_COLORS[String(props.color)]
      return (
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["Home", "Music", "Artist"].map((crumb, i, arr) => (
            <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: i === arr.length - 1 ? "#fafafa" : accent, fontSize: 14, textDecoration: i < arr.length - 1 ? "underline" : "none", textUnderlineOffset: 2 }}>{crumb}</span>
              {i < arr.length - 1 && <span style={{ color: "#71717a", fontSize: 14 }}>/</span>}
            </span>
          ))}
        </nav>
      )
    },
    codeTemplate: (p) => `<Breadcrumbs variant="${p.variant}" color="${p.color}" size="${p.size}">\n  <BreadcrumbItem href="#">Home</BreadcrumbItem>\n  <BreadcrumbItem href="#">Music</BreadcrumbItem>\n  <BreadcrumbItem>Artist</BreadcrumbItem>\n</Breadcrumbs>`,
  },
  {
    type: "Pagination",
    label: "Pagination",
    category: "Navigation",
    icon: ListOrdered,
    defaultProps: { total: 10, initialPage: 1, color: "primary", size: "md", variant: "flat", isCompact: false, showControls: false },
    propDefs: [
      { key: "total", label: "Total Pages", type: "number", defaultValue: 10 },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "variant", label: "Variant", type: "select", options: ["flat", "bordered", "light", "faded"], defaultValue: "flat" },
      { key: "showControls", label: "Show Controls", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {Boolean(props.showControls) && <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#a1a1aa" }}><ChevronLeft style={{ width: 16, height: 16 }} /></div>}
          {[1, 2, 3, "...", 10].map((p, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: p === 1 ? accent : "#27272a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: p === 1 ? "#fff" : "#a1a1aa", fontSize: 14 }}>{p}</div>
          ))}
          {Boolean(props.showControls) && <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#a1a1aa" }}><ChevronRight style={{ width: 16, height: 16 }} /></div>}
        </div>
      )
    },
    codeTemplate: (p) => `<Pagination total={${p.total}} initialPage={${p.initialPage}} color="${p.color}" size="${p.size}" variant="${p.variant}"${p.showControls ? " showControls" : ""} />`,
  },

  // ── Data Display ─────────────────────────────────────────────────────────────
  {
    type: "Card",
    label: "Card",
    category: "Data Display",
    icon: LayoutGrid,
    defaultProps: { title: "Card Title", description: "Card description goes here.", shadow: "md", radius: "lg", isHoverable: false, isPressable: false },
    propDefs: [
      { key: "title", label: "Title", type: "text", defaultValue: "Card Title" },
      { key: "description", label: "Description", type: "textarea", defaultValue: "Card description goes here." },
      { key: "shadow", label: "Shadow", type: "select", options: ["none", "sm", "md", "lg"], defaultValue: "md" },
      { key: "radius", label: "Radius", type: "select", options: ["none", "sm", "md", "lg"], defaultValue: "lg" },
      { key: "isHoverable", label: "Hoverable", type: "boolean", defaultValue: false },
      { key: "isPressable", label: "Pressable", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => (
      <div style={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: props.radius === "none" ? 0 : props.radius === "sm" ? 8 : props.radius === "lg" ? 20 : 14, padding: 20, boxShadow: props.shadow === "none" ? "none" : props.shadow === "lg" ? "0 8px 32px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.3)", cursor: props.isPressable ? "pointer" : "default" }}>
        <div style={{ marginBottom: 12 }}>
          <h4 style={{ color: "#fafafa", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{String(props.title)}</h4>
          <p style={{ color: "#a1a1aa", fontSize: 14 }}>{String(props.description)}</p>
        </div>
        <button style={{ ...colorStyle("primary", "solid"), borderRadius: 10, padding: "6px 14px", fontSize: 13, border: "none", cursor: "pointer" }}>Learn More</button>
      </div>
    ),
    codeTemplate: (p) => `<Card shadow="${p.shadow}" radius="${p.radius}"${p.isHoverable ? " isHoverable" : ""}${p.isPressable ? " isPressable" : ""}>\n  <CardHeader>\n    <h4 className="font-bold text-large">${p.title}</h4>\n  </CardHeader>\n  <CardBody>\n    <p>${p.description}</p>\n  </CardBody>\n  <CardFooter>\n    <Button color="primary" variant="solid">Learn More</Button>\n  </CardFooter>\n</Card>`,
  },
  {
    type: "Avatar",
    label: "Avatar",
    category: "Data Display",
    icon: User,
    defaultProps: { name: "Jane Doe", src: "", size: "md", color: "primary", radius: "full", isBordered: false },
    propDefs: [
      { key: "name", label: "Name", type: "text", defaultValue: "Jane Doe" },
      { key: "src", label: "Image URL", type: "text", defaultValue: "" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "radius", label: "Radius", type: "select", options: ["none", "sm", "md", "lg", "full"], defaultValue: "full" },
      { key: "isBordered", label: "Bordered", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const sizes: Record<string, number> = { sm: 32, md: 40, lg: 56 }
      const sz = sizes[String(props.size)] ?? 40
      const accent = HEROUI_COLORS[String(props.color)]
      const initials = String(props.name).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: sz, height: sz, borderRadius: props.radius === "full" ? "50%" : props.radius === "none" ? 0 : 8, backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.35, fontWeight: 600, color: "#fff", border: props.isBordered ? `2px solid ${accent}` : "none", outline: props.isBordered ? `2px solid transparent` : "none", boxShadow: props.isBordered ? `0 0 0 2px #18181b, 0 0 0 4px ${accent}` : "none" }}>
            {initials}
          </div>
          <span style={{ color: "#fafafa", fontSize: 14 }}>{String(props.name)}</span>
        </div>
      )
    },
    codeTemplate: (p) => `<Avatar name="${p.name}"${p.src ? ` src="${p.src}"` : ""} size="${p.size}" color="${p.color}" radius="${p.radius}"${p.isBordered ? " isBordered" : ""} />`,
  },
  {
    type: "AvatarGroup",
    label: "AvatarGroup",
    category: "Data Display",
    icon: User,
    defaultProps: { max: 5, isBordered: true, size: "md", color: "primary" },
    propDefs: [
      { key: "max", label: "Max Visible", type: "number", defaultValue: 5 },
      { key: "isBordered", label: "Bordered", type: "boolean", defaultValue: true },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
    ],
    previewComponent: (props) => {
      const sizes: Record<string, number> = { sm: 28, md: 40, lg: 52 }
      const sz = sizes[String(props.size)] ?? 40
      const colors = ["#006FEE", "#7828C8", "#17C964", "#F5A524", "#F31260"]
      return (
        <div style={{ display: "flex" }}>
          {colors.slice(0, 4).map((c, i) => (
            <div key={i} style={{ width: sz, height: sz, borderRadius: "50%", backgroundColor: c, marginLeft: i > 0 ? -sz * 0.25 : 0, border: "2px solid #18181b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.3, fontWeight: 600, color: "#fff", zIndex: 5 - i }}>
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          <div style={{ width: sz, height: sz, borderRadius: "50%", backgroundColor: "#27272a", marginLeft: -sz * 0.25, border: "2px solid #18181b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.3, fontWeight: 600, color: "#a1a1aa", zIndex: 0 }}>+2</div>
        </div>
      )
    },
    codeTemplate: (p) => `<AvatarGroup max={${p.max}}${p.isBordered ? " isBordered" : ""} size="${p.size}">\n  <Avatar name="Alice" />\n  <Avatar name="Bob" />\n  <Avatar name="Carol" />\n</AvatarGroup>`,
  },
  {
    type: "Badge",
    label: "Badge",
    category: "Data Display",
    icon: Bell,
    defaultProps: { content: "5", color: "primary", variant: "solid", size: "md", placement: "top-right", isInvisible: false },
    propDefs: [
      { key: "content", label: "Content", type: "text", defaultValue: "5" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "variant", label: "Variant", type: "select", options: ["solid", "flat", "faded", "shadow", "dot"], defaultValue: "solid" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ position: "relative", display: "inline-flex" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#27272a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell style={{ width: 24, height: 24, color: "#a1a1aa" }} />
          </div>
          {!props.isInvisible && (
            <div style={{ position: "absolute", top: -6, right: -6, backgroundColor: accent, color: "#fff", borderRadius: 9999, minWidth: props.variant === "dot" ? 10 : 18, height: props.variant === "dot" ? 10 : 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, border: "2px solid #18181b", padding: props.variant === "dot" ? 0 : "0 5px" }}>
              {props.variant !== "dot" ? String(props.content) : null}
            </div>
          )}
        </div>
      )
    },
    codeTemplate: (p) => `<Badge content="${p.content}" color="${p.color}" variant="${p.variant}" size="${p.size}" placement="top-right">\n  <Button isIconOnly aria-label="notifications"><Bell /></Button>\n</Badge>`,
  },
  {
    type: "Chip",
    label: "Chip",
    category: "Data Display",
    icon: Bell,
    defaultProps: { label: "React", color: "primary", variant: "solid", size: "md", radius: "full" },
    propDefs: [
      { key: "label", label: "Label", type: "text", defaultValue: "React" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "variant", label: "Variant", type: "select", options: ["solid", "bordered", "flat", "dot", "shadow"], defaultValue: "solid" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "radius", label: "Radius", type: "select", options: ["none", "sm", "md", "lg", "full"], defaultValue: "full" },
    ],
    previewComponent: (props) => {
      const radii: Record<string, string> = { none: "0", sm: "6px", md: "10px", lg: "14px", full: "9999px" }
      return (
        <span style={{ ...colorStyle(String(props.color), String(props.variant)), display: "inline-flex", alignItems: "center", borderRadius: radii[String(props.radius)] ?? "9999px", padding: props.size === "sm" ? "2px 8px" : props.size === "lg" ? "6px 16px" : "4px 12px", fontSize: props.size === "sm" ? 11 : props.size === "lg" ? 15 : 13, fontWeight: 500 }}>
          {props.variant === "dot" && <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: HEROUI_COLORS[String(props.color)], marginRight: 6 }} />}
          {String(props.label)}
        </span>
      )
    },
    codeTemplate: (p) => `<Chip color="${p.color}" variant="${p.variant}" size="${p.size}" radius="${p.radius}">${p.label}</Chip>`,
  },
  {
    type: "Image",
    label: "Image",
    category: "Data Display",
    icon: Image,
    defaultProps: { src: "https://via.placeholder.com/400x200", alt: "Image", width: 400, height: 200, radius: "lg", shadow: "none", isBlurred: false, isZoomed: false },
    propDefs: [
      { key: "src", label: "Image URL", type: "text", defaultValue: "https://via.placeholder.com/400x200" },
      { key: "alt", label: "Alt Text", type: "text", defaultValue: "Image" },
      { key: "width", label: "Width", type: "number", defaultValue: 400 },
      { key: "height", label: "Height", type: "number", defaultValue: 200 },
      { key: "radius", label: "Radius", type: "select", options: ["none", "sm", "md", "lg", "full"], defaultValue: "lg" },
      { key: "shadow", label: "Shadow", type: "select", options: ["none", "sm", "md", "lg"], defaultValue: "none" },
      { key: "isBlurred", label: "Blurred Shadow", type: "boolean", defaultValue: false },
      { key: "isZoomed", label: "Zoomed on Hover", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const radii: Record<string, string> = { none: "0", sm: "6px", md: "12px", lg: "18px", full: "9999px" }
      return (
        <div style={{ overflow: "hidden", borderRadius: radii[String(props.radius)] ?? "18px", display: "inline-block", maxWidth: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={String(props.src)} alt={String(props.alt)} style={{ maxWidth: "100%", height: "auto", display: "block", objectFit: "cover" }} />
        </div>
      )
    },
    codeTemplate: (p) => `<Image src="${p.src}" alt="${p.alt}" width={${p.width}} height={${p.height}} radius="${p.radius}"${p.isBlurred ? " isBlurred" : ""}${p.isZoomed ? " isZoomed" : ""} />`,
  },
  {
    type: "Table",
    label: "Table",
    category: "Data Display",
    icon: Table,
    defaultProps: { aria_label: "Data table", shadow: "sm", selectionMode: "none", color: "primary" },
    propDefs: [
      { key: "aria_label", label: "Aria Label", type: "text", defaultValue: "Data table" },
      { key: "shadow", label: "Shadow", type: "select", options: ["none", "sm", "md", "lg"], defaultValue: "sm" },
      { key: "selectionMode", label: "Selection Mode", type: "select", options: ["none", "single", "multiple"], defaultValue: "none" },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary"], defaultValue: "primary" },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#27272a" }}>
              <tr>
                {["Name", "Role", "Status"].map(h => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[["Alice", "Engineer", "Active"], ["Bob", "Designer", "Paused"], ["Carol", "PM", "Active"]].map((row, i) => (
                <tr key={i} style={{ borderTop: "1px solid #27272a" }}>
                  {row.map((cell, j) => <td key={j} style={{ padding: "10px 16px", fontSize: 13, color: j === 2 ? (cell === "Active" ? "#17C964" : "#F5A524") : "#fafafa" }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    codeTemplate: (p) => `<Table aria-label="${p.aria_label}" shadow="${p.shadow}" selectionMode="${p.selectionMode}">\n  <TableHeader>\n    <TableColumn>NAME</TableColumn>\n    <TableColumn>ROLE</TableColumn>\n    <TableColumn>STATUS</TableColumn>\n  </TableHeader>\n  <TableBody>\n    <TableRow key="1"><TableCell>Alice</TableCell><TableCell>Engineer</TableCell><TableCell>Active</TableCell></TableRow>\n    <TableRow key="2"><TableCell>Bob</TableCell><TableCell>Designer</TableCell><TableCell>Paused</TableCell></TableRow>\n  </TableBody>\n</Table>`,
  },
  {
    type: "Tooltip",
    label: "Tooltip",
    category: "Data Display",
    icon: Bell,
    defaultProps: { content: "Tooltip content", color: "default", placement: "top", showArrow: true },
    propDefs: [
      { key: "content", label: "Tooltip Content", type: "text", defaultValue: "Tooltip content" },
      { key: "color", label: "Color", type: "select", options: ["default", "foreground", "primary", "secondary", "success", "warning", "danger"], defaultValue: "default" },
      { key: "placement", label: "Placement", type: "select", options: ["top", "bottom", "left", "right", "top-start", "top-end"], defaultValue: "top" },
      { key: "showArrow", label: "Show Arrow", type: "boolean", defaultValue: true },
    ],
    previewComponent: (props) => {
      const accent = props.color === "default" ? "#27272a" : props.color === "foreground" ? "#27272a" : HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, position: "relative" }}>
          <div style={{ backgroundColor: accent, color: "#fff", padding: "6px 12px", borderRadius: 10, fontSize: 13, position: "relative" }}>
            {String(props.content)}
            {Boolean(props.showArrow) && <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `6px solid ${accent}` }} />}
          </div>
          <button style={{ ...colorStyle("default", "flat"), borderRadius: 10, padding: "6px 14px", fontSize: 13, border: "none", cursor: "pointer" }}>Hover me</button>
        </div>
      )
    },
    codeTemplate: (p) => `<Tooltip content="${p.content}" color="${p.color}" placement="${p.placement}"${p.showArrow ? " showArrow" : ""}>\n  <Button variant="flat">Hover me</Button>\n</Tooltip>`,
  },
  {
    type: "User",
    label: "User",
    category: "Data Display",
    icon: User,
    defaultProps: { name: "Jane Doe", description: "Software Engineer", avatarSrc: "", avatarColor: "primary" },
    propDefs: [
      { key: "name", label: "Name", type: "text", defaultValue: "Jane Doe" },
      { key: "description", label: "Description", type: "text", defaultValue: "Software Engineer" },
      { key: "avatarSrc", label: "Avatar URL", type: "text", defaultValue: "" },
      { key: "avatarColor", label: "Avatar Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.avatarColor)]
      const initials = String(props.name).split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{initials}</div>
          <div>
            <p style={{ color: "#fafafa", fontWeight: 500, fontSize: 14 }}>{String(props.name)}</p>
            <p style={{ color: "#71717a", fontSize: 12 }}>{String(props.description)}</p>
          </div>
        </div>
      )
    },
    codeTemplate: (p) => `<User name="${p.name}" description="${p.description}"${p.avatarSrc ? ` avatarProps={{ src: "${p.avatarSrc}" }}` : ""} />`,
  },
  {
    type: "Accordion",
    label: "Accordion",
    category: "Data Display",
    icon: ChevronDown,
    defaultProps: { variant: "light", selectionMode: "single" },
    propDefs: [
      { key: "variant", label: "Variant", type: "select", options: ["light", "shadow", "bordered", "splitted"], defaultValue: "light" },
      { key: "selectionMode", label: "Selection Mode", type: "select", options: ["single", "multiple"], defaultValue: "single" },
    ],
    previewComponent: (props) => (
      <div style={{ border: props.variant === "bordered" ? "1px solid #3f3f46" : "none", borderRadius: 14, overflow: "hidden" }}>
        {["What is HeroUI?", "How to install HeroUI?", "What frameworks does HeroUI support?"].map((title, i) => (
          <div key={title} style={{ borderBottom: "1px solid #27272a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer", backgroundColor: props.variant === "shadow" ? "#18181b" : "transparent" }}>
              <span style={{ color: "#fafafa", fontSize: 14, fontWeight: 500 }}>{title}</span>
              {i === 0 ? <ChevronUp style={{ width: 16, height: 16, color: "#71717a" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "#71717a" }} />}
            </div>
            {i === 0 && <div style={{ padding: "0 16px 14px", color: "#a1a1aa", fontSize: 13 }}>HeroUI is a beautiful, fast, and modern React UI library.</div>}
          </div>
        ))}
      </div>
    ),
    codeTemplate: (p) => `<Accordion variant="${p.variant}" selectionMode="${p.selectionMode}">\n  <AccordionItem key="1" title="What is HeroUI?">\n    HeroUI is a beautiful, fast, and modern React UI library.\n  </AccordionItem>\n  <AccordionItem key="2" title="How to install HeroUI?">\n    npm install @heroui/react\n  </AccordionItem>\n</Accordion>`,
  },

  // ── Feedback ─────────────────────────────────────────────────────────────────
  {
    type: "Spinner",
    label: "Spinner",
    category: "Feedback",
    icon: Loader2,
    defaultProps: { color: "primary", size: "md", label: "" },
    propDefs: [
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger", "current", "white"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "label", label: "Label", type: "text", defaultValue: "" },
    ],
    previewComponent: (props) => {
      const accent = props.color === "white" ? "#fff" : props.color === "current" ? "#a1a1aa" : HEROUI_COLORS[String(props.color)] ?? "#006FEE"
      const sz = props.size === "sm" ? 20 : props.size === "lg" ? 36 : 28
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: sz, height: sz, borderRadius: "50%", border: `3px solid ${accent}33`, borderTop: `3px solid ${accent}`, animation: "spin 0.8s linear infinite" }} />
          {Boolean(props.label) && <span style={{ color: "#a1a1aa", fontSize: 14 }}>{String(props.label)}</span>}
        </div>
      )
    },
    codeTemplate: (p) => `<Spinner color="${p.color}" size="${p.size}"${p.label ? ` label="${p.label}"` : ""} />`,
  },
  {
    type: "CircularProgress",
    label: "CircularProgress",
    category: "Feedback",
    icon: Loader2,
    defaultProps: { value: 70, color: "primary", size: "md", label: "Loading...", showValueLabel: true },
    propDefs: [
      { key: "value", label: "Value (0-100)", type: "number", defaultValue: 70 },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "label", label: "Label", type: "text", defaultValue: "Loading..." },
      { key: "showValueLabel", label: "Show Value", type: "boolean", defaultValue: true },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      const sz = props.size === "sm" ? 48 : props.size === "lg" ? 80 : 64
      const r = sz * 0.38
      const circ = 2 * Math.PI * r
      const pct = Number(props.value) / 100
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative", width: sz, height: sz }}>
            <svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="#27272a" strokeWidth={sz * 0.1} />
              <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={accent} strokeWidth={sz * 0.1} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
            </svg>
            {Boolean(props.showValueLabel) && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.22, fontWeight: 600, color: "#fafafa" }}>{String(props.value)}%</span>}
          </div>
          {Boolean(props.label) && <span style={{ color: "#a1a1aa", fontSize: 12 }}>{String(props.label)}</span>}
        </div>
      )
    },
    codeTemplate: (p) => `<CircularProgress value={${p.value}} color="${p.color}" size="${p.size}"${p.label ? ` label="${p.label}"` : ""}${p.showValueLabel ? " showValueLabel" : ""} />`,
  },
  {
    type: "Progress",
    label: "Progress",
    category: "Feedback",
    icon: BarChart2,
    defaultProps: { value: 60, color: "primary", size: "md", label: "Progress", showValueLabel: false, isStriped: false },
    propDefs: [
      { key: "value", label: "Value (0-100)", type: "number", defaultValue: 60 },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "size", label: "Size", type: "select", options: ["sm", "md", "lg"], defaultValue: "md" },
      { key: "label", label: "Label", type: "text", defaultValue: "Progress" },
      { key: "showValueLabel", label: "Show Value", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      const h = props.size === "sm" ? 4 : props.size === "lg" ? 10 : 6
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {Boolean(props.label) && <span style={{ fontSize: 13, color: "#a1a1aa" }}>{String(props.label)}</span>}
            {Boolean(props.showValueLabel) && <span style={{ fontSize: 13, color: accent }}>{String(props.value)}%</span>}
          </div>
          <div style={{ width: "100%", height: h, backgroundColor: "#27272a", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${props.value}%`, backgroundColor: accent, borderRadius: 9999, transition: "width 0.3s" }} />
          </div>
        </div>
      )
    },
    codeTemplate: (p) => `<Progress value={${p.value}} color="${p.color}" size="${p.size}"${p.label ? ` label="${p.label}"` : ""}${p.showValueLabel ? " showValueLabel" : ""} />`,
  },
  {
    type: "Skeleton",
    label: "Skeleton",
    category: "Feedback",
    icon: Layers,
    defaultProps: { isLoaded: false, rows: 3 },
    propDefs: [
      { key: "rows", label: "Rows", type: "number", defaultValue: 3 },
      { key: "isLoaded", label: "Is Loaded", type: "boolean", defaultValue: false },
    ],
    previewComponent: (props) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, backgroundColor: "#18181b", borderRadius: 14, border: "1px solid #27272a" }}>
        {Array.from({ length: Number(props.rows) }, (_, i) => (
          <div key={i} style={{ height: 16, borderRadius: 8, background: "linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", width: i === Number(props.rows) - 1 ? "60%" : "100%" }} />
        ))}
      </div>
    ),
    codeTemplate: (p) => `<div className="space-y-3">\n  <Skeleton className="rounded-lg">\n    <div className="h-4 rounded-lg bg-default-300" />\n  </Skeleton>\n  <Skeleton className="w-4/5 rounded-lg">\n    <div className="h-4 rounded-lg bg-default-300" />\n  </Skeleton>\n</div>`,
  },
  {
    type: "Alert",
    label: "Alert",
    category: "Feedback",
    icon: Bell,
    defaultProps: { title: "Heads up!", description: "You can change this to display an alert.", color: "primary", variant: "flat" },
    propDefs: [
      { key: "title", label: "Title", type: "text", defaultValue: "Heads up!" },
      { key: "description", label: "Description", type: "textarea", defaultValue: "You can change this to display an alert." },
      { key: "color", label: "Color", type: "select", options: ["default", "primary", "secondary", "success", "warning", "danger"], defaultValue: "primary" },
      { key: "variant", label: "Variant", type: "select", options: ["flat", "faded", "bordered", "solid"], defaultValue: "flat" },
    ],
    previewComponent: (props) => {
      const accent = HEROUI_COLORS[String(props.color)]
      return (
        <div style={{ ...colorStyle(String(props.color), String(props.variant)), borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10 }}>
          <div style={{ marginTop: 2 }}>
            <Bell style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{String(props.title)}</p>
            <p style={{ fontSize: 13, opacity: 0.85 }}>{String(props.description)}</p>
          </div>
        </div>
      )
    },
    codeTemplate: (p) => `<Alert color="${p.color}" variant="${p.variant}" title="${p.title}">${p.description}</Alert>`,
  },
]

// ─── Catalog helpers ───────────────────────────────────────────────────────────
const CATEGORIES = [...new Set(CATALOG.map(c => c.category))]
const getCatalogByType = (type: string) => CATALOG.find(c => c.type === type)

function generateId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `el_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

// ─── Code Generator ────────────────────────────────────────────────────────────
function generateCode(elements: CanvasElement[]): string {
  const imports = new Set<string>()
  imports.add("@heroui/react")

  const renderElement = (el: CanvasElement): string => {
    const def = getCatalogByType(el.type)
    if (!def) return ""
    return def.codeTemplate(el.props)
  }

  const body = elements.map(el => renderElement(el)).filter(Boolean).join("\n\n")

  return `import { ${[...new Set(elements.map(e => e.type).filter(Boolean))].join(", ")} } from "@heroui/react"\n\nexport default function MyPage() {\n  return (\n    <div className="container mx-auto p-6 space-y-4">\n${body.split("\n").map(l => "      " + l).join("\n")}\n    </div>\n  )\n}`
}

// ─── Component Library Item (draggable from palette) ──────────────────────────
function PaletteItem({ component }: { component: ComponentDef }) {
  const id = `palette_${component.type}`
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing select-none transition-all", "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10", isDragging ? "opacity-40 scale-95" : "opacity-100")}
    >
      <component.icon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      <span className="text-xs text-zinc-300 font-medium truncate">{component.label}</span>
    </div>
  )
}

// ─── Canvas Element (sortable on canvas) ─────────────────────────────────────
interface CanvasElementProps {
  element: CanvasElement
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function CanvasElementWrapper({ element, isSelected, onSelect, onDelete, onDuplicate }: CanvasElementProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id })
  const def = getCatalogByType(element.type)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl transition-all duration-150",
        isSelected
          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#18191B]"
          : "hover:ring-1 hover:ring-white/20 hover:ring-offset-1 hover:ring-offset-[#18191B]",
      )}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
    >
      {/* Drag handle + type badge */}
      <div className={cn("absolute -top-7 left-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20", isSelected && "opacity-100")}>
        <div {...listeners} {...attributes} className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3 w-3 text-white" />
          <span className="text-[10px] text-white font-medium">{element.type}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} className="p-1 rounded-md bg-zinc-700 hover:bg-zinc-600 transition-colors" title="Duplicate">
          <Copy className="h-3 w-3 text-white" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 rounded-md bg-red-600/80 hover:bg-red-600 transition-colors" title="Delete">
          <Trash2 className="h-3 w-3 text-white" />
        </button>
      </div>

      {/* Rendered component preview */}
      <div className="p-1 pointer-events-none select-none">
        {def ? def.previewComponent(element.props) : (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-sm text-center">
            Unknown component: {element.type}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Properties Panel ─────────────────────────────────────────────────────────
interface PropertiesPanelProps {
  element: CanvasElement | null
  onChange: (id: string, key: string, value: unknown) => void
}

function PropertiesPanel({ element, onChange }: PropertiesPanelProps) {
  if (!element) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Settings2 className="h-10 w-10 text-zinc-600 mb-3" />
        <p className="text-sm text-zinc-500">Select a component on the canvas to edit its properties.</p>
      </div>
    )
  }

  const def = getCatalogByType(element.type)
  if (!def) return null

  return (
    <div className="p-4 overflow-y-auto h-full custom-scrollbar">
      <div className="mb-4 flex items-center gap-2">
        <def.icon className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-zinc-100">{element.type}</h3>
      </div>

      <div className="space-y-4">
        {def.propDefs.map(prop => (
          <div key={prop.key}>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">{prop.label}</label>
            {prop.type === "text" && (
              <input
                type="text"
                value={String(element.props[prop.key] ?? prop.defaultValue)}
                onChange={e => onChange(element.id, prop.key, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            )}
            {prop.type === "textarea" && (
              <textarea
                value={String(element.props[prop.key] ?? prop.defaultValue)}
                onChange={e => onChange(element.id, prop.key, e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            )}
            {prop.type === "select" && (
              <select
                value={String(element.props[prop.key] ?? prop.defaultValue)}
                onChange={e => onChange(element.id, prop.key, e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {prop.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
            {prop.type === "boolean" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => onChange(element.id, prop.key, !element.props[prop.key])}
                  className={cn("w-10 h-6 rounded-full transition-colors relative cursor-pointer", element.props[prop.key] ? "bg-blue-500" : "bg-zinc-700")}
                >
                  <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", element.props[prop.key] ? "left-5" : "left-1")} />
                </div>
                <span className="text-xs text-zinc-400">{element.props[prop.key] ? "Yes" : "No"}</span>
              </label>
            )}
            {prop.type === "number" && (
              <input
                type="number"
                value={Number(element.props[prop.key] ?? prop.defaultValue)}
                onChange={e => onChange(element.id, prop.key, Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
            )}
            {prop.type === "color" && (
              <input
                type="color"
                value={String(element.props[prop.key] ?? prop.defaultValue)}
                onChange={e => onChange(element.id, prop.key, e.target.value)}
                className="w-full h-9 bg-transparent border border-white/10 rounded-lg cursor-pointer"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Code Panel ───────────────────────────────────────────────────────────────
function CodePanel({ elements, onSave, isSaving }: { elements: CanvasElement[]; onSave: () => void; isSaving: boolean }) {
  const code = generateCode(elements)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-zinc-400" />
          <span className="text-sm text-zinc-300 font-medium">Generated Code</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-300 transition-colors">
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={onSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white transition-colors">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <pre className="p-4 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap break-all">{code}</pre>
      </div>
    </div>
  )
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function CanvasDropZone({ children, isEmpty }: { children: React.ReactNode; isEmpty: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id: "canvas-drop-zone" })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-full transition-all duration-200",
        isOver && "bg-blue-500/5",
      )}
    >
      {isEmpty ? (
        <div className={cn("flex flex-col items-center justify-center min-h-[400px] text-center p-8 rounded-2xl border-2 border-dashed transition-all duration-200", isOver ? "border-blue-500 bg-blue-500/10" : "border-white/10")}>
          <Layout className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-base font-semibold text-zinc-400 mb-2">Drag components here</h3>
          <p className="text-sm text-zinc-600 max-w-xs">Select components from the library on the left and drag them onto the canvas.</p>
        </div>
      ) : (
        <div className="space-y-6 pt-6">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main Editor ──────────────────────────────────────────────────────────────
export interface DragDropEditorProps {
  projectId?: string
  initialElements?: CanvasElement[]
  onSave?: (code: string, elements: CanvasElement[]) => Promise<void>
}

export default function DragDropEditor({ projectId, initialElements = [], onSave }: DragDropEditorProps) {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [closedCategories, setClosedCategories] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
  const [rightTab, setRightTab] = useState<"properties" | "code">("properties")
  // Mobile active section
  const [mobileTab, setMobileTab] = useState<"library" | "canvas" | "code">("canvas")
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<CanvasElement[][]>([initialElements])
  const [historyIndex, setHistoryIndex] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const selectedElement = elements.find(el => el.id === selectedId) ?? null

  const HISTORY_MAX = 50

  // Push to history
  const pushHistory = useCallback((newElements: CanvasElement[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1)
      const next = [...trimmed, newElements]
      return next.length > HISTORY_MAX ? next.slice(next.length - HISTORY_MAX) : next
    })
    setHistoryIndex(prev => Math.min(prev + 1, HISTORY_MAX - 1))
  }, [historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(i => i - 1)
      setElements(history[historyIndex - 1])
      setSelectedId(null)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1)
      setElements(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveComponentId(String(event.active.id))
  }

  const handleDragOver = (_event: DragOverEvent) => { /* handled in dragEnd */ }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveComponentId(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Drag from palette to canvas
    if (activeId.startsWith("palette_")) {
      const type = activeId.replace("palette_", "")
      const def = getCatalogByType(type)
      if (!def) return

      const newElement: CanvasElement = {
        id: generateId(),
        type,
        props: { ...def.defaultProps },
        children: [],
      }

      let newElements: CanvasElement[]
      if (overId === "canvas-drop-zone") {
        newElements = [...elements, newElement]
      } else {
        // Insert near the target element
        const targetIdx = elements.findIndex(el => el.id === overId)
        if (targetIdx >= 0) {
          newElements = [...elements]
          newElements.splice(targetIdx + 1, 0, newElement)
        } else {
          newElements = [...elements, newElement]
        }
      }

      setElements(newElements)
      pushHistory(newElements)
      setSelectedId(newElement.id)
      setMobileTab("canvas")
      return
    }

    // Reorder within canvas
    if (activeId !== overId && !overId.startsWith("palette_")) {
      const oldIdx = elements.findIndex(el => el.id === activeId)
      const newIdx = elements.findIndex(el => el.id === overId)
      if (oldIdx >= 0 && newIdx >= 0) {
        const newElements = arrayMove(elements, oldIdx, newIdx)
        setElements(newElements)
        pushHistory(newElements)
      }
    }
  }

  const handleDeleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    pushHistory(newElements)
    if (selectedId === id) setSelectedId(null)
  }

  const handleDuplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    const dup: CanvasElement = { ...el, id: generateId(), props: { ...el.props } }
    const idx = elements.findIndex(e => e.id === id)
    const newElements = [...elements]
    newElements.splice(idx + 1, 0, dup)
    setElements(newElements)
    pushHistory(newElements)
    setSelectedId(dup.id)
  }

  const handlePropChange = (id: string, key: string, value: unknown) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, props: { ...el.props, [key]: value } } : el))
  }

  const handleSave = async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(generateCode(elements), elements)
      setSaveMessage("Saved!")
      setTimeout(() => setSaveMessage(null), 3000)
    } catch {
      setSaveMessage("Save failed")
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredCatalog = CATALOG.filter(c =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredCategories = CATEGORIES.filter(cat =>
    filteredCatalog.some(c => c.category === cat),
  )

  const toggleCategory = (cat: string) => {
    setClosedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  // All palette items for DnD context
  const paletteIds = CATALOG.map(c => `palette_${c.type}`)
  const canvasIds = elements.map(el => el.id)

  // Active dragging component (for overlay)
  const activeDef = activeComponentId?.startsWith("palette_")
    ? getCatalogByType(activeComponentId.replace("palette_", ""))
    : null

  // ─── Component Library Panel ────────────────────────────────────────────────
  const LibraryPanel = (
    <div className="flex flex-col h-full bg-zinc-900/50 border-r border-white/10">
      <div className="p-3 border-b border-white/10 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {filteredCategories.map(cat => (
          <div key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
            >
              <span>{cat}</span>
              {closedCategories.has(cat) ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {!closedCategories.has(cat) && (
              <div className="mt-1 space-y-1">
                {filteredCatalog.filter(c => c.category === cat).map(comp => (
                  <SortableContext key={comp.type} items={[`palette_${comp.type}`]} strategy={verticalListSortingStrategy}>
                    <PaletteItem component={comp} />
                  </SortableContext>
                ))}
              </div>
            )}
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-xs">No components found</div>
        )}
      </div>
    </div>
  )

  // ─── Canvas Panel ────────────────────────────────────────────────────────────
  const CanvasPanel = (
    <div className="flex-1 overflow-y-auto custom-scrollbar" onClick={() => setSelectedId(null)}>
      <div className={cn("mx-auto transition-all duration-300 min-h-full p-6", viewMode === "mobile" ? "max-w-[390px]" : "max-w-full")}>
        <SortableContext items={canvasIds} strategy={verticalListSortingStrategy}>
          <CanvasDropZone isEmpty={elements.length === 0}>
            {elements.map(el => (
              <CanvasElementWrapper
                key={el.id}
                element={el}
                isSelected={selectedId === el.id}
                onSelect={() => { setSelectedId(el.id); setRightTab("properties"); setMobileTab("code") }}
                onDelete={() => handleDeleteElement(el.id)}
                onDuplicate={() => handleDuplicateElement(el.id)}
              />
            ))}
          </CanvasDropZone>
        </SortableContext>
      </div>
    </div>
  )

  // ─── Right Panel ─────────────────────────────────────────────────────────────
  const RightPanel = (
    <div className="flex flex-col h-full bg-zinc-900/50 border-l border-white/10">
      <div className="flex border-b border-white/10 shrink-0">
        <button
          onClick={() => setRightTab("properties")}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors", rightTab === "properties" ? "text-blue-400 border-b-2 border-blue-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <Settings2 className="h-3.5 w-3.5" /> Props
        </button>
        <button
          onClick={() => setRightTab("code")}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors", rightTab === "code" ? "text-blue-400 border-b-2 border-blue-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <Code2 className="h-3.5 w-3.5" /> Code
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {rightTab === "properties" ? (
          <PropertiesPanel element={selectedElement} onChange={handlePropChange} />
        ) : (
          <CodePanel elements={elements} onSave={handleSave} isSaving={isSaving} />
        )}
      </div>
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-[#18191B]">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-zinc-900/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={() => setViewMode("desktop")} className={cn("p-1.5 rounded-lg transition-colors", viewMode === "desktop" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-300")} title="Desktop">
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode("mobile")} className={cn("p-1.5 rounded-lg transition-colors", viewMode === "mobile" ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-300")} title="Mobile">
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 rounded-lg disabled:opacity-30 text-zinc-500 hover:text-zinc-300 disabled:hover:text-zinc-500 transition-colors" title="Undo">
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-lg disabled:opacity-30 text-zinc-500 hover:text-zinc-300 disabled:hover:text-zinc-500 transition-colors" title="Redo">
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 hidden sm:block">{elements.length} component{elements.length !== 1 ? "s" : ""}</span>
            {saveMessage && (
              <span className={cn("text-xs font-medium", saveMessage === "Saved!" ? "text-green-400" : "text-red-400")}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !onSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
            >
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* ── Desktop: 3-column layout ── */}
        <div className="hidden md:flex flex-1 min-h-0">
          <div className="w-64 shrink-0 overflow-hidden">{LibraryPanel}</div>
          {CanvasPanel}
          <div className="w-72 shrink-0 overflow-hidden">{RightPanel}</div>
        </div>

        {/* ── Mobile: stacked with bottom nav ── */}
        <div className="flex md:hidden flex-1 min-h-0 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            {mobileTab === "library" && LibraryPanel}
            {mobileTab === "canvas" && (
              <div className="flex flex-col h-full">
                {CanvasPanel}
              </div>
            )}
            {mobileTab === "code" && (
              <div className="flex flex-col h-full bg-zinc-900/50">
                <div className="flex border-b border-white/10 shrink-0">
                  <button onClick={() => setRightTab("properties")} className={cn("flex-1 py-3 text-xs font-medium transition-colors", rightTab === "properties" ? "text-blue-400 border-b-2 border-blue-400" : "text-zinc-500")}>
                    Properties
                  </button>
                  <button onClick={() => setRightTab("code")} className={cn("flex-1 py-3 text-xs font-medium transition-colors", rightTab === "code" ? "text-blue-400 border-b-2 border-blue-400" : "text-zinc-500")}>
                    Code
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {rightTab === "properties" ? (
                    <PropertiesPanel element={selectedElement} onChange={handlePropChange} />
                  ) : (
                    <CodePanel elements={elements} onSave={handleSave} isSaving={isSaving} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile bottom nav */}
          <div className="border-t border-white/10 bg-zinc-900/80 backdrop-blur-sm flex shrink-0">
            {([
              { id: "library" as const, label: "Library", icon: Layout },
              { id: "canvas" as const, label: "Canvas", icon: LayoutGrid },
              { id: "code" as const, label: "Inspector", icon: Settings2 },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={cn("flex-1 flex flex-col items-center gap-1 py-3 transition-colors", mobileTab === id ? "text-blue-400" : "text-zinc-500")}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDef ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 shadow-2xl shadow-blue-500/50 border border-blue-400/50 pointer-events-none">
            <activeDef.icon className="h-3.5 w-3.5 text-white shrink-0" />
            <span className="text-xs text-white font-medium">{activeDef.label}</span>
          </div>
        ) : null}
      </DragOverlay>

      {/* CSS animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </DndContext>
  )
}
