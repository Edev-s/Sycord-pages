"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Bot,
  ChevronDown,
  Sparkles,
  FileCode,
  ArrowRight,
  Rocket,
  BrainCircuit,
  CheckCircle2,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  AlertCircle,
  Bug,
  Layout,
  Eye,
  Pencil,
  BookOpen,
  Zap,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// ──────────────────────────────────────────────────────
// Constants & Types
// ──────────────────────────────────────────────────────

const MODELS = [
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", description: "Best quality" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", description: "Fast" },
]

type Step = "idle" | "planning" | "coding" | "fixing" | "done"

type AIPhase =
  | "idle"
  | "thinking"
  | "planning"
  | "reading-context"
  | "generating"
  | "writing-file"
  | "validating"
  | "fixing"
  | "finishing"
  | "done"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  code?: string
  plan?: string
  pageName?: string
  isIntermediate?: boolean
  isErrorLog?: boolean
}

export interface GeneratedPage {
  name: string
  code: string
  timestamp: number
  usedFor?: string
}

// ──────────────────────────────────────────────────────
// Animated Phase Indicator
// ──────────────────────────────────────────────────────

const PHASE_CONFIG: Record<AIPhase, { label: string; icon: React.ReactNode; color: string }> = {
  idle:             { label: "Ready",              icon: <Sparkles className="h-3.5 w-3.5" />,     color: "text-zinc-500" },
  thinking:         { label: "Thinking...",         icon: <BrainCircuit className="h-3.5 w-3.5" />, color: "text-amber-400" },
  planning:         { label: "Planning architecture...", icon: <BookOpen className="h-3.5 w-3.5" />, color: "text-blue-400" },
  "reading-context":{ label: "Reading files...",    icon: <Eye className="h-3.5 w-3.5" />,         color: "text-cyan-400" },
  generating:       { label: "Generating code...",  icon: <Pencil className="h-3.5 w-3.5" />,      color: "text-violet-400" },
  "writing-file":   { label: "Writing file...",     icon: <FileCode className="h-3.5 w-3.5" />,    color: "text-emerald-400" },
  validating:       { label: "Validating...",       icon: <CheckCircle2 className="h-3.5 w-3.5" />,color: "text-teal-400" },
  fixing:           { label: "Auto-fixing...",      icon: <Bug className="h-3.5 w-3.5" />,         color: "text-orange-400" },
  finishing:        { label: "Finishing up...",      icon: <Zap className="h-3.5 w-3.5" />,         color: "text-yellow-400" },
  done:             { label: "Complete",            icon: <CheckCircle2 className="h-3.5 w-3.5" />,color: "text-emerald-400" },
}

function PhaseIndicator({ phase, filename }: { phase: AIPhase; filename?: string }) {
  const config = PHASE_CONFIG[phase]
  const isActive = phase !== "idle" && phase !== "done"

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center gap-2.5"
      >
        <div className={cn(
          "relative flex items-center justify-center h-7 w-7 rounded-lg",
          isActive ? "bg-white/10" : "bg-white/5"
        )}>
          <span className={config.color}>{config.icon}</span>
          {isActive && (
            <motion.div
              className={cn("absolute inset-0 rounded-lg border", config.color.replace("text-", "border-"))}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={cn("text-xs font-medium", config.color)}>
            {config.label}
          </span>
          {filename && isActive && (
            <span className="text-[10px] text-zinc-600 font-mono truncate max-w-[180px]">
              {filename}
            </span>
          )}
        </div>
        {isActive && (
          <Loader2 className={cn("h-3 w-3 animate-spin ml-auto", config.color)} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ──────────────────────────────────────────────────────
// File Tree Visualizer
// ──────────────────────────────────────────────────────

interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
  status: "pending" | "generating" | "done"
}

function FileTreeVisualizer({ pages, currentFile }: { pages: GeneratedPage[]; currentFile?: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true, src: true })

  const buildTree = useCallback((): FileNode[] => {
    const root: FileNode[] = []

    const addNode = (path: string, status: "done" | "generating"): void => {
      const parts = path.split("/")
      let current = root
      let currentPath = ""

      parts.forEach((part, i) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isFile = i === parts.length - 1
        let node = current.find((n) => n.name === part)

        if (!node) {
          node = {
            name: part,
            path: currentPath,
            type: isFile ? "file" : "folder",
            children: isFile ? undefined : [],
            status: isFile ? status : "done",
          }
          current.push(node)
        } else if (isFile && status === "generating") {
          node.status = "generating"
        }

        if (!isFile && node.children) {
          current = node.children
        }
      })
    }

    pages.forEach((p) => addNode(p.name, "done"))
    if (currentFile) addNode(currentFile, "generating")

    const sortNodes = (nodes: FileNode[]): void => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      nodes.forEach((n) => {
        if (n.children) sortNodes(n.children)
      })
    }
    sortNodes(root)
    return root
  }, [pages, currentFile])

  const tree = buildTree()

  const renderNode = (node: FileNode, depth: number): React.ReactNode => {
    const isExp = expanded[node.path] ?? true
    const Icon = node.type === "folder" ? (isExp ? FolderOpen : Folder) : FileCode
    const isGenerating = node.status === "generating"

    return (
      <div key={node.path}>
        <motion.div
          initial={isGenerating ? { opacity: 0, x: -8 } : false}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 text-xs rounded-md hover:bg-white/5 cursor-pointer select-none transition-colors",
            isGenerating && "bg-white/5",
            node.status === "done" && node.type === "file" && "text-zinc-400"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === "folder") {
              setExpanded((p) => ({ ...p, [node.path]: !isExp }))
            }
          }}
        >
          {node.type === "folder" && (
            <ChevronRight className={cn("h-3 w-3 transition-transform text-zinc-500", isExp && "rotate-90")} />
          )}
          {node.type === "file" && <span className="w-3" />}

          <Icon
            className={cn(
              "h-3.5 w-3.5",
              node.type === "folder" ? "text-zinc-500" : "text-zinc-400",
              isGenerating && "text-violet-400"
            )}
          />

          <span className={cn("truncate flex-1 font-mono", isGenerating ? "text-violet-300" : "text-zinc-400")}>
            {node.name}
          </span>

          {isGenerating && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
            </motion.div>
          )}
          {node.status === "done" && node.type === "file" && (
            <CheckCircle2 className="h-3 w-3 text-zinc-700" />
          )}
        </motion.div>
        {node.type === "folder" && isExp && node.children && (
          <div>{node.children.map((c) => renderNode(c, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="font-mono bg-black/20 rounded-xl border border-white/5 p-3 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
      <div className="text-[10px] text-zinc-500 mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold px-2">
        <Folder className="h-3 w-3" /> Project Structure
      </div>
      {tree.length === 0 ? (
        <div className="text-center py-8 text-zinc-600 text-xs italic">Waiting for files...</div>
      ) : (
        tree.map((n) => renderNode(n, 0))
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────
// Progress Bar
// ──────────────────────────────────────────────────────

function ProgressBar({ instruction, phase, activeFile }: { instruction: string; phase: AIPhase; activeFile?: string }) {
  const isActive = phase !== "idle" && phase !== "done"
  if (!isActive) return null

  const totalMatch = instruction.match(/\[\d+\]/g) || []
  const doneMatch = instruction.match(/\[Done\]/gi) || []
  const total = totalMatch.length + doneMatch.length
  const done = doneMatch.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 py-2.5 border-b border-white/5 bg-zinc-950/80"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
          {phase === "planning" ? "Planning..." : `${done}/${total} files`}
        </span>
        {activeFile && phase !== "planning" && (
          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">{activeFile}</span>
        )}
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────

interface AIWebsiteBuilderProps {
  projectId: string
  generatedPages: GeneratedPage[]
  setGeneratedPages: React.Dispatch<React.SetStateAction<GeneratedPage[]>>
  autoFixLogs?: string[] | null
}

const AIWebsiteBuilder = ({ projectId, generatedPages, setGeneratedPages, autoFixLogs }: AIWebsiteBuilderProps) => {
  // ── State ──
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [step, setStep] = useState<Step>("idle")
  const [aiPhase, setAIPhase] = useState<AIPhase>("idle")
  const [currentPlan, setCurrentPlan] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<string | undefined>(undefined)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url?: string; githubUrl?: string } | null>(null)
  const [showAutoDeploy, setShowAutoDeploy] = useState(false)
  const [instruction, setInstruction] = useState("")
  const [selectedModel, setSelectedModel] = useState(MODELS[0])
  const [planExpanded, setPlanExpanded] = useState(false)
  const [userPrompt, setUserPrompt] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [fixHistory, setFixHistory] = useState<Array<{ action: string; target: string; result: unknown; summary: string }>>([])

  // ── Effects ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, currentPlan, step, scrollToBottom])

  useEffect(() => {
    if (autoFixLogs && autoFixLogs.length > 0 && step === "idle") {
      startAutoFixSession(autoFixLogs)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFixLogs])

  // ── Auto-Fix ──

  const startAutoFixSession = async (logs: string[]): Promise<void> => {
    setStep("fixing")
    setAIPhase("fixing")
    setCurrentPlan("Analyzing logs...")
    setFixHistory([])
    setShowAutoDeploy(false)

    const logMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: "Deployment failed. Starting automated diagnosis and repair.",
      isErrorLog: true,
    }

    const visibleLogs = logs.slice(-20).join("\n")
    const logsDisplayMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "user",
      content: `Logs:\n\`\`\`\n${visibleLogs}\n\`\`\``,
    }

    setMessages((prev) => [...prev, logMessage, logsDisplayMessage])
    await processAutoFix(logs, [], 0)
  }

  const processAutoFix = async (
    logs: string[],
    history: Array<{ action: string; target: string; result: unknown; summary: string }>,
    iteration: number
  ): Promise<void> => {
    if (iteration >= 15) {
      setStep("idle")
      setAIPhase("idle")
      addSystemMessage("Auto-fix session stopped after maximum attempts. Please review manually.")
      return
    }

    try {
      const fileStructure = generatedPages.map((p) => p.name).join("\n")
      let fileContent = null
      let lastAction = null

      if (history.length > 0) {
        const lastItem = history[history.length - 1]
        lastAction = lastItem.action === "read" ? "take a look" : null
        if (lastItem.action === "read" && lastItem.result && (lastItem.result as { code?: string }).code) {
          fileContent = {
            filename: lastItem.target,
            code: (lastItem.result as { code: string }).code,
          }
        }
      }

      const fixedFiles = history
        .filter((h) => h.action === "write" || h.action === "fix")
        .map((h) => h.target)
        .filter((v, i, a) => a.indexOf(v) === i)

      const response = await fetch("/api/ai/auto-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs,
          fileStructure,
          fileContent,
          lastAction,
          history: history.map((h) => ({
            action: h.action,
            target: h.target,
            result: h.action === "read" ? "read_success" : "done",
            summary: h.summary,
          })),
          fixedFiles,
        }),
      })

      if (!response.ok) throw new Error("AI Fix request failed")
      const result = await response.json()

      if (result.explanation) {
        addAssistantMessage(result.explanation)
      }

      if (result.action === "done") {
        setStep("idle")
        setAIPhase("done")
        setShowAutoDeploy(true)
        addAssistantMessage("Issues fixed. Ready to deploy.")
        setTimeout(() => setAIPhase("idle"), 2000)
        return
      }

      let actionResult: unknown = { status: "success" }
      let actionSummary = ""

      if (result.action === "read") {
        setAIPhase("reading-context")
        setCurrentPlan(`Reading ${result.targetFile}...`)
        const page = generatedPages.find((p) => p.name === result.targetFile)
        if (page) {
          actionResult = { status: "success", code: page.code }
          actionSummary = `Read ${result.targetFile} (${page.code.length} bytes)`
        } else {
          actionResult = { status: "error", message: "File not found" }
          actionSummary = `Failed to read ${result.targetFile}`
          addSystemMessage(`Could not find file: ${result.targetFile}`)
        }
      } else if (result.action === "move") {
        setCurrentPlan(`Moving ${result.targetFile}...`)
        const page = generatedPages.find((p) => p.name === result.targetFile)
        if (page) {
          const newName = result.newPath
          setGeneratedPages((prev) => prev.map((p) => (p.name === result.targetFile ? { ...p, name: newName } : p)))
          await fetch(`/api/projects/${projectId}/pages?name=${encodeURIComponent(result.targetFile)}`, { method: "DELETE" })
          await fetch(`/api/projects/${projectId}/pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName, content: page.code, usedFor: page.usedFor }),
          })
          addAssistantMessage(`Moved ${result.targetFile} to ${result.newPath}`)
          actionSummary = `Moved ${result.targetFile} to ${result.newPath}`
        } else {
          actionResult = { status: "error", message: "File not found" }
        }
      } else if (result.action === "delete") {
        setCurrentPlan(`Deleting ${result.targetFile}...`)
        setGeneratedPages((prev) => prev.filter((p) => p.name !== result.targetFile))
        await fetch(`/api/projects/${projectId}/pages?name=${encodeURIComponent(result.targetFile)}`, { method: "DELETE" })
        addAssistantMessage(`Deleted ${result.targetFile}`)
        actionSummary = `Deleted ${result.targetFile}`
      } else if (result.action === "write") {
        setAIPhase("writing-file")
        setCurrentPlan(`Fixing ${result.targetFile}...`)
        setGeneratedPages((prev) => {
          const exists = prev.find((p) => p.name === result.targetFile)
          if (exists) {
            return prev.map((p) => (p.name === result.targetFile ? { ...p, code: result.code, timestamp: Date.now() } : p))
          }
          return [...prev, { name: result.targetFile, code: result.code, timestamp: Date.now(), usedFor: "Auto-fix" }]
        })
        await fetch(`/api/projects/${projectId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: result.targetFile, content: result.code, usedFor: "Auto-fix" }),
        })
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Updated ${result.targetFile}`,
            code: result.code,
            pageName: result.targetFile,
          },
        ])
        actionSummary = `Wrote to ${result.targetFile} (${result.code.length} bytes)`
      }

      const newHistory = [...history, { action: result.action, target: result.targetFile, result: actionResult, summary: actionSummary }]
      setFixHistory(newHistory)
      await processAutoFix(logs, newHistory, iteration + 1)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Auto-fix error"
      console.error("Auto fix loop error", message)
      setError(message)
      setStep("idle")
      setAIPhase("idle")
    }
  }

  // ── Generation Flow ──

  const startGeneration = async (): Promise<void> => {
    if (!input.trim()) return

    const currentInput = input.trim()
    setUserPrompt(currentInput)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setError(null)
    setStep("planning")
    setAIPhase("thinking")
    setCurrentPlan("Architecting solution...")
    setShowAutoDeploy(false)

    try {
      // Phase: Thinking -> Planning
      await delay(600)
      setAIPhase("planning")

      const planResponse = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!planResponse.ok) throw new Error("Failed to generate plan")
      const planData = await planResponse.json()
      const generatedInstruction = planData.instruction

      setInstruction(generatedInstruction)

      const planMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generatedInstruction,
        plan: "Architectural Strategy",
      }
      setMessages((prev) => [...prev, planMessage])

      // Transition to coding phase
      setAIPhase("reading-context")
      await delay(400)

      await processNextStep(generatedInstruction, [...messages, userMessage, planMessage], currentInput)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Planning failed"
      setError(message)
      setStep("idle")
      setAIPhase("idle")
    }
  }

  const processNextStep = async (
    currentInstruction: string,
    currentHistory: Message[],
    originalPrompt: string
  ): Promise<void> => {
    setStep("coding")
    setCurrentPlan("Generating next file...")

    const nextFileMatch = /\[\d+\]\s*([^\s:]+)/.exec(currentInstruction)
    const nextFile = nextFileMatch?.[1]
    if (nextFile) setActiveFile(nextFile)

    // Animate phase transitions
    setAIPhase("generating")
    await delay(300)

    try {
      const response = await fetch("/api/ai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: currentHistory,
          instruction: currentInstruction,
          model: selectedModel.id,
          userPrompt: originalPrompt,
          generatedPages: generatedPages.map((p) => ({ name: p.name, code: p.code })),
        }),
      })

      if (!response.ok) throw new Error("Generation failed")
      const data = await response.json()

      if (data.isComplete) {
        setAIPhase("finishing")
        await delay(500)
        setStep("done")
        setAIPhase("done")
        setCurrentPlan("All files generated.")
        setActiveFile(undefined)
        setTimeout(() => setAIPhase("idle"), 3000)
        return
      }

      // Writing file phase
      setAIPhase("writing-file")

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated ${data.pageName}`,
        code: data.code,
        pageName: data.pageName,
        isIntermediate: true,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (data.code && data.pageName) {
        setGeneratedPages((prev) => {
          const filtered = prev.filter((p) => p.name !== data.pageName)
          return [...filtered, { name: data.pageName, code: data.code, timestamp: Date.now(), usedFor: data.usedFor }]
        })

        await fetch(`/api/projects/${projectId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.pageName, content: data.code, usedFor: data.usedFor || "" }),
        })
      }

      setInstruction(data.updatedInstruction)

      // Brief pause before next file for visual feedback
      setAIPhase("reading-context")
      await delay(200)

      await processNextStep(data.updatedInstruction, [...currentHistory, assistantMessage], originalPrompt)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed"
      setError(message)
      setStep("idle")
      setAIPhase("idle")
      setActiveFile(undefined)
    }
  }

  // ── Deploy ──

  const handleDeploy = async (): Promise<void> => {
    setIsDeploying(true)
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (data.success) {
        setDeploySuccess(true)
        setDeployResult(data)
        setShowAutoDeploy(false)
      } else {
        setError(data.error)
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Deploy failed"
      setError(message)
    } finally {
      setIsDeploying(false)
    }
  }

  // ── Helpers ──

  const addSystemMessage = (content: string): void => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "system", content }])
  }

  const addAssistantMessage = (content: string): void => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content }])
  }

  const isProcessing = step === "planning" || step === "coding" || step === "fixing"

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm hidden md:inline-block tracking-tight">AI Editor</span>

          {/* Mobile Menu Trigger for File Tree */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-zinc-400">
                <Layout className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-zinc-950 border-r-white/10 w-3/4 max-w-sm pt-10">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Project Structure</h3>
              <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-2">
          {showAutoDeploy && (
            <Button
              size="sm"
              className="h-8 bg-white text-black hover:bg-zinc-200 animate-in fade-in zoom-in"
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              {isDeploying ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Rocket className="h-3 w-3 mr-2" />}
              Deploy Fixes
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                {selectedModel.name}
                <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-300">
              {MODELS.map((model) => (
                <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model)} className="hover:bg-white/5 focus:bg-white/5">
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-[10px] text-zinc-500">{model.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* LEFT: VISUALIZATION & STATUS (Desktop Only) */}
        <div className="hidden md:flex md:w-80 lg:w-96 border-r border-white/5 bg-black/20 p-4 flex-col gap-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Blueprint</h3>
            </div>

            <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />

            {/* Animated Phase Indicator */}
            <div className={cn(
              "rounded-xl p-4 transition-all duration-500 border",
              aiPhase === "idle" ? "bg-transparent border-transparent" : "bg-white/[0.03] border-white/10"
            )}>
              <PhaseIndicator phase={aiPhase} filename={activeFile} />
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {generatedPages.length > 0 && (
            <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
              <Button
                className="w-full text-xs h-9 bg-zinc-100 text-zinc-900 hover:bg-zinc-300 border-none"
                size="sm"
                onClick={handleDeploy}
                disabled={isDeploying || isProcessing}
              >
                {isDeploying ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Rocket className="h-3 w-3 mr-2" />}
                {deploySuccess ? "Deploy Again" : "Deploy to Cloudflare"}
              </Button>

              {deploySuccess && deployResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-1"
                >
                  <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Live
                  </p>
                  {deployResult.url && (
                    <a href={deployResult.url} target="_blank" rel="noopener noreferrer" className="text-xs text-white hover:underline block truncate opacity-80 hover:opacity-100">
                      {deployResult.url}
                    </a>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: CHAT & INPUT */}
        <div className="flex-1 flex flex-col h-full bg-zinc-950 relative z-10">
          {/* Progress Bar */}
          <AnimatePresence>
            <ProgressBar instruction={instruction} phase={aiPhase} activeFile={activeFile} />
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24 md:pb-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5"
                >
                  <Sparkles className="h-6 w-6 text-zinc-400" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-base font-medium text-zinc-300 mb-1"
                >
                  What shall we build?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-xs text-zinc-600 mb-6 max-w-xs"
                >
                  Describe your website and the AI will plan the architecture, generate connected TypeScript files, and deploy it.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex flex-wrap gap-2 justify-center max-w-md"
                >
                  {[
                    "A modern portfolio site with dark theme",
                    "SaaS landing page with pricing section",
                    "Restaurant site with menu and reservations",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={cn("flex flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}
              >
                {msg.isErrorLog ? (
                  <div className="w-full max-w-[90%] md:max-w-[80%] bg-red-500/10 border border-red-500/20 text-red-200/80 rounded-2xl px-5 py-4 text-xs font-mono flex items-start gap-3">
                    <Bug className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div className="overflow-x-auto whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                      msg.role === "user"
                        ? "bg-zinc-100 text-zinc-900 rounded-tr-sm font-medium"
                        : msg.role === "system"
                          ? "bg-zinc-900/50 border border-white/5 text-zinc-400 text-center w-full max-w-none text-xs py-2"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm backdrop-blur-sm"
                    )}
                  >
                    {/* Plan Message (Collapsible) */}
                    {msg.role === "assistant" && msg.plan ? (
                      <div>
                        <button
                          onClick={() => setPlanExpanded((p) => !p)}
                          className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors w-full"
                        >
                          <BrainCircuit className="h-3 w-3" />
                          <span>Architecture Plan</span>
                          <span className="text-zinc-600 font-normal normal-case">
                            ({(msg.content.match(/\[\d+\]/g) || []).length} files)
                          </span>
                          <ChevronRight className={cn("h-3 w-3 ml-auto transition-transform", planExpanded && "rotate-90")} />
                        </button>
                        <AnimatePresence>
                          {planExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 text-xs text-zinc-500 whitespace-pre-wrap border-t border-white/5 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar"
                            >
                              {msg.content}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : null}

                    {/* File Card */}
                    {!msg.plan && msg.code ? (
                      <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-1 -m-1 rounded-lg transition-colors">
                        <div className="h-10 w-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 text-zinc-400 group-hover:text-white group-hover:border-white/10 transition-all shrink-0">
                          <FileCode className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-zinc-200 group-hover:text-white transition-colors truncate">
                            {msg.pageName}
                          </p>
                          <p className="text-[10px] text-zinc-500">{(msg.code.length / 1024).toFixed(1)} KB</p>
                        </div>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 ml-auto shrink-0" />
                      </div>
                    ) : !msg.plan ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
            <div className="relative max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && startGeneration()}
                placeholder="Describe your website..."
                className="pr-12 h-14 rounded-2xl bg-zinc-900/50 border-white/5 focus-visible:ring-1 focus-visible:ring-white/20 text-base placeholder:text-zinc-600 shadow-lg"
                disabled={isProcessing}
              />
              <Button
                size="icon"
                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors"
                onClick={startGeneration}
                disabled={!input.trim() || isProcessing}
              >
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Utilities ──

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default AIWebsiteBuilder
