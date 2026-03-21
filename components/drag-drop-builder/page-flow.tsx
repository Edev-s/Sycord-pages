"use client"

import { useCallback, useMemo, useEffect } from "react"
import { useBuilderStore } from "@/lib/builder-store"
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  Handle,
  Position,
  BackgroundVariant,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

// ── Custom Node ────────────────────────────────────────────────────────────────

interface PageNodeData {
  label: string
  slug: string
  elementCount: number
  isActive: boolean
  [key: string]: unknown
}

function PageNode({ data, selected }: { data: PageNodeData; selected?: boolean }) {
  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 bg-white dark:bg-zinc-900 shadow-md min-w-[140px] text-center transition-all
        ${data.isActive ? "border-indigo-500 shadow-indigo-200" : "border-gray-200 dark:border-zinc-700"}
        ${selected ? "ring-2 ring-indigo-400 ring-offset-2" : ""}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400" />

      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
            data.isActive
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
              : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {data.label.charAt(0).toUpperCase()}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
            {data.label}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">{data.slug}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              data.isActive
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {data.elementCount} element{data.elementCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400" />
    </div>
  )
}

const NODE_TYPES = { pageNode: PageNode }

// ── Layout helpers ────────────────────────────────────────────────────────────

function buildFlowGraph(
  pages: ReturnType<typeof useBuilderStore.getState>["project"]["pages"],
  pageOrder: string[],
  currentPageId: string,
): { nodes: Node[]; edges: Edge[] } {
  const COLS = 3
  const H_GAP = 220
  const V_GAP = 160

  const nodes: Node[] = pageOrder.map((id, index) => {
    const page = pages[id]
    const col = index % COLS
    const row = Math.floor(index / COLS)

    return {
      id,
      type: "pageNode",
      position: { x: col * H_GAP, y: row * V_GAP },
      data: {
        label: page.name,
        slug: page.slug,
        elementCount: page.elements.length,
        isActive: id === currentPageId,
      },
    }
  })

  // Simple sequential edges
  const edges: Edge[] = pageOrder.slice(0, -1).map((id, i) => ({
    id: `e-${id}-${pageOrder[i + 1]}`,
    source: id,
    target: pageOrder[i + 1],
    animated: false,
    style: { stroke: "#6366f1", strokeWidth: 1.5 },
  }))

  return { nodes, edges }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PageFlow() {
  const { project, currentPageId, setCurrentPage } = useBuilderStore()

  const initial = useMemo(
    () => buildFlowGraph(project.pages, project.pageOrder, currentPageId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)

  // Sync graph whenever project pages or current page changes
  useEffect(() => {
    const { nodes: n, edges: e } = buildFlowGraph(project.pages, project.pageOrder, currentPageId)
    setNodes(n)
    setEdges(e)
  }, [project.pages, project.pageOrder, currentPageId, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, style: { stroke: "#6366f1" } }, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setCurrentPage(node.id)
    },
    [setCurrentPage],
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <Controls />
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor={(n) => ((n.data as PageNodeData).isActive ? "#6366f1" : "#d1d5db")}
          style={{ borderRadius: "8px" }}
        />
      </ReactFlow>
    </div>
  )
}
