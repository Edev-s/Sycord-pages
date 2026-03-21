export type ElementType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "container"
  | "columns"
  | "list"
  | "link"
  | "video"
  | "form"
  | "input"
  | "navbar"

export interface ElementStyle {
  backgroundColor?: string
  color?: string
  fontSize?: string
  fontWeight?: string
  textAlign?: string
  padding?: string
  margin?: string
  borderRadius?: string
  border?: string
  width?: string
  height?: string
  maxWidth?: string
  gap?: string
  display?: string
  flexDirection?: string
  justifyContent?: string
  alignItems?: string
}

export interface EditorElement {
  id: string
  type: ElementType
  content: string
  style: ElementStyle
  props: Record<string, string>
  children?: EditorElement[]
  parentId?: string
  linkTo?: string
}

export interface EditorPage {
  id: string
  name: string
  slug: string
  elements: EditorElement[]
  isHome?: boolean
}

export interface EditorProject {
  pages: EditorPage[]
  activePageId: string
  globalStyles: {
    fontFamily: string
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
}

export interface ElementCategory {
  id: string
  name: string
  icon: string
  elements: {
    type: ElementType
    label: string
    icon: string
    defaultContent: string
    defaultStyle: ElementStyle
    defaultProps: Record<string, string>
  }[]
}

export const ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    id: "layout",
    name: "Layout",
    icon: "Layers",
    elements: [
      {
        type: "container",
        label: "Container",
        icon: "Square",
        defaultContent: "",
        defaultStyle: {
          padding: "16px",
          backgroundColor: "transparent",
          borderRadius: "8px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        },
        defaultProps: {},
      },
      {
        type: "columns",
        label: "Columns",
        icon: "Columns",
        defaultContent: "",
        defaultStyle: {
          display: "flex",
          gap: "16px",
          width: "100%",
          padding: "8px",
        },
        defaultProps: { columns: "2" },
      },
      {
        type: "divider",
        label: "Divider",
        icon: "Minus",
        defaultContent: "",
        defaultStyle: {
          width: "100%",
          height: "1px",
          backgroundColor: "#444",
          margin: "8px 0",
        },
        defaultProps: {},
      },
      {
        type: "spacer",
        label: "Spacer",
        icon: "MoveVertical",
        defaultContent: "",
        defaultStyle: { height: "32px", width: "100%" },
        defaultProps: {},
      },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    icon: "Type",
    elements: [
      {
        type: "heading",
        label: "Heading",
        icon: "Heading",
        defaultContent: "Heading",
        defaultStyle: {
          fontSize: "28px",
          fontWeight: "700",
          color: "#ffffff",
          padding: "8px",
        },
        defaultProps: { level: "2" },
      },
      {
        type: "text",
        label: "Text",
        icon: "Type",
        defaultContent: "Enter your text here...",
        defaultStyle: {
          fontSize: "16px",
          color: "#cccccc",
          padding: "8px",
        },
        defaultProps: {},
      },
      {
        type: "button",
        label: "Button",
        icon: "MousePointerClick",
        defaultContent: "Click Me",
        defaultStyle: {
          backgroundColor: "#8b5cf6",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "600",
          border: "none",
          textAlign: "center",
        },
        defaultProps: {},
      },
      {
        type: "link",
        label: "Link",
        icon: "Link",
        defaultContent: "Link text",
        defaultStyle: {
          color: "#8b5cf6",
          fontSize: "16px",
          padding: "8px",
        },
        defaultProps: { href: "#" },
      },
    ],
  },
  {
    id: "media",
    name: "Media",
    icon: "Image",
    elements: [
      {
        type: "image",
        label: "Image",
        icon: "ImageIcon",
        defaultContent: "",
        defaultStyle: {
          width: "100%",
          maxWidth: "400px",
          borderRadius: "8px",
        },
        defaultProps: {
          src: "https://placehold.co/400x250/333/888?text=Image",
          alt: "Placeholder image",
        },
      },
      {
        type: "video",
        label: "Video",
        icon: "Video",
        defaultContent: "",
        defaultStyle: {
          width: "100%",
          maxWidth: "560px",
          borderRadius: "8px",
        },
        defaultProps: {
          src: "",
          type: "embed",
        },
      },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    icon: "Navigation",
    elements: [
      {
        type: "navbar",
        label: "Navbar",
        icon: "PanelTop",
        defaultContent: "My Site",
        defaultStyle: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          backgroundColor: "#1e1e1e",
          width: "100%",
          borderRadius: "8px",
        },
        defaultProps: {},
      },
      {
        type: "list",
        label: "List",
        icon: "List",
        defaultContent: "Item 1\nItem 2\nItem 3",
        defaultStyle: {
          padding: "8px 16px",
          color: "#cccccc",
          fontSize: "16px",
        },
        defaultProps: { ordered: "false" },
      },
    ],
  },
  {
    id: "forms",
    name: "Forms",
    icon: "FormInput",
    elements: [
      {
        type: "input",
        label: "Input",
        icon: "TextCursorInput",
        defaultContent: "",
        defaultStyle: {
          width: "100%",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #444",
          backgroundColor: "#2a2a2a",
          color: "#ffffff",
          fontSize: "14px",
        },
        defaultProps: {
          placeholder: "Enter text...",
          inputType: "text",
        },
      },
      {
        type: "form",
        label: "Form",
        icon: "FileInput",
        defaultContent: "",
        defaultStyle: {
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "16px",
          width: "100%",
        },
        defaultProps: {},
      },
    ],
  },
]

export function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function createDefaultElement(
  type: ElementType,
): EditorElement | null {
  for (const cat of ELEMENT_CATEGORIES) {
    const def = cat.elements.find((e) => e.type === type)
    if (def) {
      return {
        id: generateId(),
        type: def.type,
        content: def.defaultContent,
        style: { ...def.defaultStyle },
        props: { ...def.defaultProps },
      }
    }
  }
  return null
}
