import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

// ── Element Types ──────────────────────────────────────────────────────────────

export type ElementType =
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "container"
  | "section"
  | "navbar"
  | "hero"
  | "card"
  | "divider"
  | "spacer"
  | "grid"
  | "columns"
  | "input"
  | "form"
  | "footer"
  | "badge"
  | "list"
  | "video"
  | "icon"

export interface ElementStyle {
  color?: string
  backgroundColor?: string
  padding?: string
  margin?: string
  fontSize?: string
  fontWeight?: string
  textAlign?: "left" | "center" | "right" | "justify"
  borderRadius?: string
  border?: string
  width?: string
  height?: string
  display?: string
  flexDirection?: "row" | "column"
  gap?: string
  justifyContent?: string
  alignItems?: string
  opacity?: string
  boxShadow?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  objectFit?: string
  maxWidth?: string
  minHeight?: string
  gridTemplateColumns?: string
  [key: string]: string | undefined
}

export interface BuilderElement {
  id: string
  type: ElementType
  props: {
    text?: string
    src?: string
    alt?: string
    href?: string
    placeholder?: string
    label?: string
    level?: 1 | 2 | 3 | 4 | 5 | 6
    variant?: string
    cols?: number
    rows?: number
    items?: string[]
    videoUrl?: string
    iconName?: string
    [key: string]: unknown
  }
  style: ElementStyle
  children: BuilderElement[]
}

// ── Page ──────────────────────────────────────────────────────────────────────

export interface BuilderPage {
  id: string
  name: string
  slug: string
  elements: BuilderElement[]
}

// ── Theme ─────────────────────────────────────────────────────────────────────

export interface ProjectTheme {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  backgroundColor: string
  textColor: string
  borderRadius: string
}

// ── Project ───────────────────────────────────────────────────────────────────

export interface BuilderProject {
  id: string
  name: string
  theme: ProjectTheme
  pages: Record<string, BuilderPage>
  pageOrder: string[]
}

// ── AppState ──────────────────────────────────────────────────────────────────

export interface AppState {
  project: BuilderProject
  currentPageId: string
  selectedElementId: string | null
  hoveredElementId: string | null
  isDragging: boolean
  history: BuilderProject[]
  historyIndex: number

  // Page actions
  addPage: (name: string, slug: string) => void
  deletePage: (pageId: string) => void
  renamePage: (pageId: string, name: string) => void
  setCurrentPage: (pageId: string) => void

  // Element actions
  addElement: (pageId: string, element: BuilderElement, parentId?: string) => void
  updateElement: (pageId: string, elementId: string, updates: Partial<Pick<BuilderElement, "props" | "style">>) => void
  deleteElement: (pageId: string, elementId: string) => void
  moveElement: (pageId: string, elementId: string, targetParentId: string | null, targetIndex: number) => void
  reorderElements: (pageId: string, fromIndex: number, toIndex: number, parentId?: string) => void

  // Selection
  selectElement: (elementId: string | null) => void
  hoverElement: (elementId: string | null) => void
  setDragging: (isDragging: boolean) => void

  // Theme
  updateTheme: (updates: Partial<ProjectTheme>) => void

  // History
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // Persistence
  loadProject: (project: BuilderProject) => void
  resetProject: (projectId: string, projectName: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `el_${Math.random().toString(36).slice(2, 10)}`
}

function defaultPage(id: string, name: string, slug: string): BuilderPage {
  return { id, name, slug, elements: [] }
}

function defaultProject(id: string, name: string): BuilderProject {
  const homeId = generateId()
  return {
    id,
    name,
    theme: {
      primaryColor: "#6366f1",
      secondaryColor: "#ec4899",
      fontFamily: "Inter, sans-serif",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      borderRadius: "0.5rem",
    },
    pages: {
      [homeId]: defaultPage(homeId, "Home", "/"),
    },
    pageOrder: [homeId],
  }
}

/** Find an element deep in a tree and remove it, returning the removed element */
function removeElement(
  elements: BuilderElement[],
  id: string,
): { elements: BuilderElement[]; removed: BuilderElement | null } {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === id) {
      const removed = elements[i]
      const newElements = [...elements.slice(0, i), ...elements.slice(i + 1)]
      return { elements: newElements, removed }
    }
    const { elements: newChildren, removed } = removeElement(elements[i].children, id)
    if (removed) {
      return {
        elements: elements.map((el, idx) => (idx === i ? { ...el, children: newChildren } : el)),
        removed,
      }
    }
  }
  return { elements, removed: null }
}

/** Insert element into a tree at a specific parent / index */
function insertElement(
  elements: BuilderElement[],
  element: BuilderElement,
  parentId: string | null,
  index: number,
): BuilderElement[] {
  if (parentId === null) {
    const next = [...elements]
    next.splice(index, 0, element)
    return next
  }
  return elements.map((el) => {
    if (el.id === parentId) {
      const next = [...el.children]
      next.splice(index, 0, element)
      return { ...el, children: next }
    }
    return { ...el, children: insertElement(el.children, element, parentId, index) }
  })
}

/** Update an element deep in a tree */
function updateElementInTree(
  elements: BuilderElement[],
  id: string,
  updates: Partial<Pick<BuilderElement, "props" | "style">>,
): BuilderElement[] {
  return elements.map((el) => {
    if (el.id === id) {
      return {
        ...el,
        props: updates.props ? { ...el.props, ...updates.props } : el.props,
        style: updates.style ? { ...el.style, ...updates.style } : el.style,
      }
    }
    return { ...el, children: updateElementInTree(el.children, id, updates) }
  })
}

// ── Store ─────────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50

export const useBuilderStore = create<AppState>()(
  immer((set, get) => {
    const pushHistory = () => {
      set((state) => {
        const snapshot = JSON.parse(JSON.stringify(state.project)) as BuilderProject
        const trimmed = state.history.slice(0, state.historyIndex + 1)
        state.history = [...trimmed, snapshot].slice(-MAX_HISTORY)
        state.historyIndex = state.history.length - 1
      })
    }

    return {
      project: defaultProject("default", "My Website"),
      currentPageId: "",
      selectedElementId: null,
      hoveredElementId: null,
      isDragging: false,
      history: [],
      historyIndex: -1,

      // ── Pages ──────────────────────────────────────────────────────────────

      addPage: (name, slug) => {
        pushHistory()
        const id = generateId()
        set((state) => {
          state.project.pages[id] = defaultPage(id, name, slug)
          state.project.pageOrder.push(id)
        })
      },

      deletePage: (pageId) => {
        const { project } = get()
        if (project.pageOrder.length <= 1) return
        pushHistory()
        set((state) => {
          delete state.project.pages[pageId]
          state.project.pageOrder = state.project.pageOrder.filter((id) => id !== pageId)
          if (state.currentPageId === pageId) {
            state.currentPageId = state.project.pageOrder[0]
          }
        })
      },

      renamePage: (pageId, name) => {
        set((state) => {
          if (state.project.pages[pageId]) {
            state.project.pages[pageId].name = name
          }
        })
      },

      setCurrentPage: (pageId) => {
        set((state) => {
          state.currentPageId = pageId
          state.selectedElementId = null
        })
      },

      // ── Elements ───────────────────────────────────────────────────────────

      addElement: (pageId, element, parentId) => {
        pushHistory()
        set((state) => {
          const page = state.project.pages[pageId]
          if (!page) return
          const elements = insertElement(
            page.elements,
            element,
            parentId ?? null,
            page.elements.length,
          )
          state.project.pages[pageId].elements = elements
        })
      },

      updateElement: (pageId, elementId, updates) => {
        set((state) => {
          const page = state.project.pages[pageId]
          if (!page) return
          state.project.pages[pageId].elements = updateElementInTree(
            page.elements,
            elementId,
            updates,
          )
        })
      },

      deleteElement: (pageId, elementId) => {
        pushHistory()
        set((state) => {
          const page = state.project.pages[pageId]
          if (!page) return
          const { elements } = removeElement(page.elements, elementId)
          state.project.pages[pageId].elements = elements
          if (state.selectedElementId === elementId) {
            state.selectedElementId = null
          }
        })
      },

      moveElement: (pageId, elementId, targetParentId, targetIndex) => {
        pushHistory()
        set((state) => {
          const page = state.project.pages[pageId]
          if (!page) return
          const { elements: after, removed } = removeElement(page.elements, elementId)
          if (!removed) return
          state.project.pages[pageId].elements = insertElement(
            after,
            removed,
            targetParentId,
            targetIndex,
          )
        })
      },

      reorderElements: (pageId, fromIndex, toIndex, parentId) => {
        set((state) => {
          const page = state.project.pages[pageId]
          if (!page) return

          const reorder = (elements: BuilderElement[]): BuilderElement[] => {
            if (!parentId) {
              const next = [...elements]
              const [moved] = next.splice(fromIndex, 1)
              next.splice(toIndex, 0, moved)
              return next
            }
            return elements.map((el) => {
              if (el.id === parentId) {
                const next = [...el.children]
                const [moved] = next.splice(fromIndex, 1)
                next.splice(toIndex, 0, moved)
                return { ...el, children: next }
              }
              return { ...el, children: reorder(el.children) }
            })
          }

          state.project.pages[pageId].elements = reorder(page.elements)
        })
      },

      // ── Selection ──────────────────────────────────────────────────────────

      selectElement: (elementId) => {
        set((state) => {
          state.selectedElementId = elementId
        })
      },

      hoverElement: (elementId) => {
        set((state) => {
          state.hoveredElementId = elementId
        })
      },

      setDragging: (isDragging) => {
        set((state) => {
          state.isDragging = isDragging
        })
      },

      // ── Theme ──────────────────────────────────────────────────────────────

      updateTheme: (updates) => {
        set((state) => {
          state.project.theme = { ...state.project.theme, ...updates }
        })
      },

      // ── History ────────────────────────────────────────────────────────────

      pushHistory,

      undo: () => {
        const { historyIndex, history } = get()
        if (historyIndex <= 0) return
        set((state) => {
          state.historyIndex = historyIndex - 1
          state.project = JSON.parse(JSON.stringify(history[historyIndex - 1]))
        })
      },

      redo: () => {
        const { historyIndex, history } = get()
        if (historyIndex >= history.length - 1) return
        set((state) => {
          state.historyIndex = historyIndex + 1
          state.project = JSON.parse(JSON.stringify(history[historyIndex + 1]))
        })
      },

      // ── Persistence ────────────────────────────────────────────────────────

      loadProject: (project) => {
        set((state) => {
          state.project = project
          state.currentPageId = project.pageOrder[0] ?? ""
          state.selectedElementId = null
          state.history = [JSON.parse(JSON.stringify(project))]
          state.historyIndex = 0
        })
      },

      resetProject: (projectId, projectName) => {
        const project = defaultProject(projectId, projectName)
        set((state) => {
          state.project = project
          state.currentPageId = project.pageOrder[0]
          state.selectedElementId = null
          state.history = [JSON.parse(JSON.stringify(project))]
          state.historyIndex = 0
        })
      },
    }
  }),
)
