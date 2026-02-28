"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2,
  Bot,
  Check,
  ChevronDown,
  Sparkles,
  FileCode,
  ArrowRight,
  Rocket,
  Brain,
  Hammer,
  Wrench,
  CheckCircle2,
  Folder,
  FolderOpen,
  ChevronRight,
  Code,
  Bug,
  Layout,
  Paperclip,
  Send,
  Info,
  Circle,
  Zap,
  Cloud,
  Globe
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

// Updated Models List
const MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "gemini-3-flash", name: "Gemini 3 Flash (Preview)", provider: "Google" },
  { id: "deepseek-v3.2-exp", name: "DeepSeek V3", provider: "DeepSeek" },
]

type Step = "idle" | "planning" | "coding" | "fixing" | "done"

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

// --- FILE TREE COMPONENT (VISUALIZATION) ---
interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  status: 'pending' | 'generating' | 'done'
}

const FileTreeVisualizer = ({ pages, currentFile }: { pages: GeneratedPage[], currentFile?: string }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'root': true, 'src': true })

  // Build tree from pages
  const buildTree = () => {
    const root: FileNode[] = []
    const addNode = (path: string, status: 'done' | 'generating') => {
      const parts = path.split('/')
      let current = root
      let currentPath = ''

      parts.forEach((part, i) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const isFile = i === parts.length - 1
        let node = current.find(n => n.name === part)

        if (!node) {
          node = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
            status: isFile ? status : 'done'
          }
          current.push(node)
        } else if (isFile && status === 'generating') {
           node.status = 'generating'
        }

        if (!isFile && node.children) {
          current = node.children
        }
      })
    }

    pages.forEach(p => addNode(p.name, 'done'))
    if (currentFile) addNode(currentFile, 'generating')

    const sortNodes = (nodes: FileNode[]) => {
        nodes.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
            return a.name.localeCompare(b.name)
        })
        nodes.forEach(n => { if(n.children) sortNodes(n.children) })
    }
    sortNodes(root)
    return root
  }

  const tree = buildTree()

  const renderNode = (node: FileNode, depth: number) => {
    const isExp = expanded[node.path] ?? true
    const Icon = node.type === 'folder' ? (isExp ? FolderOpen : Folder) : FileCode
    const isGenerating = node.status === 'generating'

    return (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 text-xs rounded-md hover:bg-white/5 cursor-pointer select-none transition-colors",
            isGenerating && "bg-white/5 animate-pulse",
            node.status === 'done' && node.type === 'file' && "text-zinc-400"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
              if (node.type === 'folder') {
                  setExpanded(p => ({...p, [node.path]: !isExp}))
              }
          }}
        >
          {node.type === 'folder' && (
              <ChevronRight className={cn("h-3 w-3 transition-transform text-zinc-500", isExp && "rotate-90")} />
          )}
          {node.type === 'file' && <span className="w-3" />}

          <Icon className={cn(
              "h-3.5 w-3.5",
              node.type === 'folder' ? "text-zinc-500" : "text-zinc-400",
              isGenerating && "text-white"
          )} />

          <span className={cn("truncate flex-1 font-mono", isGenerating ? "text-white" : "text-zinc-400")}>{node.name}</span>

          {isGenerating && <Loader2 className="h-3 w-3 animate-spin text-white" />}
        </div>
        {node.type === 'folder' && isExp && node.children && (
            <div>{node.children.map(c => renderNode(c, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="font-mono bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
      <div className="text-[10px] text-zinc-500 mb-3 flex items-center gap-2 uppercase tracking-wider font-semibold px-2">
         <Folder className="h-3 w-3" /> Project Structure
      </div>
      {tree.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-xs italic">
              Waiting for files...
          </div>
      ) : tree.map(n => renderNode(n, 0))}
    </div>
  )
}

// --- NEW UI COMPONENTS ---

const GeminiIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 2C13.5 6.5 17.5 10.5 22 12C17.5 13.5 13.5 17.5 12 22C10.5 17.5 6.5 13.5 2 12C6.5 10.5 10.5 6.5 12 2Z"
            fill="url(#gemini-gradient)"
        />
        <defs>
            <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4facfe" />
                <stop offset="50%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>
        </defs>
    </svg>
)

const GeminiBadge = () => (
    <div className="absolute top-0 left-0 right-0 flex items-center justify-center animate-in fade-in zoom-in duration-700 delay-100 z-50 pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm transition-all hover:bg-zinc-800/80 cursor-default">
            <GeminiIcon className="h-4 w-4" />
            <span className="text-xs font-medium text-zinc-300">State of the Art</span>
            <Info className="h-3 w-3 text-zinc-600 ml-1" />
        </div>
    </div>
)

const InputBar = ({ input, setInput, onSend, disabled }: { input: string, setInput: (v: string) => void, onSend: () => void, disabled: boolean }) => (
    <div className="w-full max-w-2xl mx-auto px-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 z-50">
        <div className={cn(
            "rounded-[2rem] p-2 relative shadow-2xl transition-all duration-300 border border-white/5 bg-zinc-900/40 backdrop-blur-xl flex items-center gap-3",
            disabled ? "opacity-80 pointer-events-none" : "focus-within:border-white/10 focus-within:bg-zinc-900/60"
        )}>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all shrink-0 ml-1" disabled={disabled}>
                <Paperclip className="h-5 w-5" />
            </Button>

            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                placeholder="Describe the website you want"
                className="flex-1 border-none bg-transparent h-12 text-base text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 px-0 shadow-none"
                disabled={disabled}
                autoFocus
            />

            <Button
                size="icon"
                className={cn(
                    "h-10 w-10 rounded-full transition-all active:scale-95 shrink-0 flex items-center justify-center bg-transparent border-none mr-1 shadow-none",
                    input.trim() && !disabled ? "text-zinc-400 hover:text-white hover:bg-white/10" : "text-zinc-700 hover:bg-transparent"
                )}
                onClick={onSend}
                disabled={!input.trim() || disabled}
            >
               {disabled ? <Loader2 className="h-5 w-5 animate-spin text-zinc-700" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
    </div>
)

const ThinkingCard = ({ planContent, isActive, isDone }: { planContent: string, isActive: boolean, isDone: boolean }) => {
    const getSection = (title: string) => {
        const regex = new RegExp(`## \\d+\\. ${title}[\\s\\S]*?(?=##|$)`, 'i')
        const match = planContent.match(regex)
        return match ? match[0].replace(/## \d+\. .*?\n/, '').trim() : null
    }

    const businessGoal = getSection("Business Goal") || getSection("Goal")
    const rawSnippet = !businessGoal ? planContent.slice(0, 150) + "..." : null

    return (
        <div className={cn("flex gap-4 group transition-all duration-500", (isActive || isDone) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
            <div className="flex flex-col items-center gap-2 pt-1">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm backdrop-blur-md",
                    isDone ? "bg-white/5 text-zinc-500 border border-white/10" : isActive ? "bg-white/10 text-zinc-300 border border-white/20" : "bg-white/5 text-zinc-700 border border-white/10"
                )}>
                    {isActive ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
                </div>
                {(isActive || !isDone) && <div className={cn("w-0.5 flex-1 my-1 rounded-full transition-colors duration-500", isActive ? "bg-white/10" : "bg-white/5")} />}
            </div>
            <div className="flex-1 pb-8 min-w-0">
                <h3 className={cn("text-sm font-medium mb-3 transition-colors duration-300", isActive ? "text-zinc-300" : "text-zinc-400")}>
                    {isActive ? "Thinking..." : "Thinking"}
                </h3>

                {(isActive || isDone) && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 shadow-sm backdrop-blur-xl">
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-3 w-3" /> The Plan
                                </h4>
                                {businessGoal ? (
                                    <p className="text-sm text-zinc-300 leading-relaxed font-light">{businessGoal}</p>
                                ) : (
                                    <div className="text-sm text-zinc-300 leading-relaxed font-light flex items-center gap-2 opacity-70">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>{rawSnippet ? rawSnippet : "Analyzing request..."}</span>
                                    </div>
                                )}
                            </div>
                            {getSection("Design System") && (
                                 <div className="pt-4 border-t border-white/5 space-y-1.5">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Layout className="h-3 w-3" /> Design System
                                    </h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{getSection("Design System")}</p>
                                 </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const ProgressCard = ({ isActive, isDone, progress, activeFile }: { isActive: boolean, isDone: boolean, progress: { done: number, total: number, percent: number }, activeFile?: string }) => {
    return (
        <div className={cn("flex gap-4 group transition-all duration-500 delay-100", (isActive || isDone) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
             <div className="flex flex-col items-center gap-2 pt-1">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm backdrop-blur-md",
                    isDone ? "bg-white/5 text-zinc-500 border border-white/10" : isActive ? "bg-white/10 text-zinc-300 border border-white/20" : "bg-white/5 text-zinc-700 border border-white/10"
                )}>
                   {isActive ? <Zap className="h-4 w-4 animate-pulse" /> : <Zap className="h-4 w-4" />}
                </div>
                 {(isActive || !isDone) && <div className={cn("w-0.5 flex-1 my-1 rounded-full transition-colors duration-500", isActive ? "bg-white/10" : "bg-white/5")} />}
            </div>
            <div className="flex-1 pb-8 min-w-0">
                 <h3 className={cn("text-sm font-medium mb-3 transition-colors duration-300", isActive ? "text-zinc-300" : "text-zinc-400")}>
                    {isActive ? "Building your plan" : "Building your plan"}
                </h3>

                {(isActive || isDone) && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 shadow-sm backdrop-blur-xl">
                         <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                                <span>{isDone ? "Generation complete" : `Generating files... (${progress.done}/${progress.total})`}</span>
                                <span>{progress.percent}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                            {activeFile && !isDone && (
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono bg-black/20 py-1.5 px-3 rounded-lg border border-white/5">
                                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                                    <span className="truncate">Writing {activeFile}...</span>
                                </div>
                            )}
                         </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const SavingCard = ({ isActive, isDone }: { isActive: boolean, isDone: boolean }) => {
    return (
        <div className={cn("flex gap-4 group transition-all duration-500 delay-200", (isActive || isDone) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
             <div className="flex flex-col items-center gap-2 pt-1">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm backdrop-blur-md",
                    isDone ? "bg-white/5 text-zinc-500 border border-white/10" : isActive ? "bg-white/10 text-zinc-300 border border-white/20" : "bg-white/5 text-zinc-700 border border-white/10"
                )}>
                   {isDone ? <Check className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
                </div>
            </div>
            <div className="flex-1 pb-4 min-w-0">
                 <h3 className={cn("text-sm font-medium mb-1 transition-colors duration-300", isActive ? "text-zinc-300" : "text-zinc-400")}>
                    {isDone ? "Saved" : "Saving"}
                </h3>
                 <div className="flex items-center gap-2">
                     <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", isDone ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                     <span className="text-xs text-zinc-500">{isDone ? "All changes saved to cloud" : "Syncing changes..."}</span>
                 </div>
            </div>
        </div>
    )
}


interface AIWebsiteBuilderProps {
  projectId: string
  generatedPages: GeneratedPage[]
  setGeneratedPages: React.Dispatch<React.SetStateAction<GeneratedPage[]>>
  autoFixLogs?: string[] | null
}

const AIWebsiteBuilder = ({ projectId, generatedPages, setGeneratedPages, autoFixLogs }: AIWebsiteBuilderProps) => {
  const { data: session } = useSession()
  const userName = session?.user?.name?.split(' ')[0] || "there"

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [step, setStep] = useState<Step>("idle")
  const [currentPlan, setCurrentPlan] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [activeFile, setActiveFile] = useState<string | undefined>(undefined)

  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url?: string; githubUrl?: string } | null>(null)
  const [showAutoDeploy, setShowAutoDeploy] = useState(false)

  const [instruction, setInstruction] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState(MODELS[0])

  const [fixHistory, setFixHistory] = useState<any[]>([])

  // Compute file-level progress from instruction
  const getProgress = () => {
    if (!instruction) return { done: 0, total: 0, percent: 0 }
    const totalMatch = instruction.match(/\[\d+\]/g) || []
    const doneMatch = instruction.match(/\[Done\]/gi) || []
    const total = totalMatch.length + doneMatch.length
    const done = doneMatch.length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    return { done, total, percent }
  }

  const progress = getProgress()

  useEffect(() => {
    if (autoFixLogs && autoFixLogs.length > 0 && step === 'idle') {
      startAutoFixSession(autoFixLogs)
    }
  }, [autoFixLogs])

  const startAutoFixSession = async (logs: string[]) => {
    setStep("fixing")
    setCurrentPlan("Analyzing logs...")
    setFixHistory([])
    setShowAutoDeploy(false)

    const logMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: "Deployment failed. Starting automated diagnosis and repair session.",
      isErrorLog: true
    }

    const visibleLogs = logs.slice(-20).join('\n')
    const logsDisplayMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "user",
      content: `Logs:\n\`\`\`\n${visibleLogs}\n\`\`\``
    }

    setMessages(prev => [...prev, logMessage, logsDisplayMessage])

    await processAutoFix(logs, [], 0)
  }

  const processAutoFix = async (logs: string[], history: any[], iteration: number) => {
    if (iteration >= 15) {
       setStep("idle")
       setMessages(prev => [...prev, {
         id: Date.now().toString(),
         role: "system",
         content: "Auto-fix session stopped after maximum attempts. Please review manually."
       }])
       return
    }

    try {
       const fileStructure = generatedPages.map(p => p.name).join('\n')
       let fileContent = null
       let lastAction = null

       if (history.length > 0) {
         const lastItem = history[history.length - 1]
         lastAction = lastItem.action === 'read' ? 'take a look' : null
         if (lastItem.action === 'read' && lastItem.result && lastItem.result.code) {
           fileContent = {
             filename: lastItem.target,
             code: lastItem.result.code
           }
         }
       }

       const fixedFiles = history
          .filter(h => h.action === 'write' || h.action === 'fix')
          .map(h => h.target)
          .filter((v, i, a) => a.indexOf(v) === i)

       const response = await fetch('/api/ai/auto-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs,
            fileStructure,
            fileContent,
            lastAction,
            history: history.map(h => ({
                action: h.action,
                target: h.target,
                result: h.action === 'read' ? 'read_success' : (h.result.status || 'done'),
                summary: h.summary
            })),
            fixedFiles
          })
       })

       if (!response.ok) throw new Error("AI Fix request failed")
       const result = await response.json()

       if (result.explanation) {
         setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: result.explanation
         }])
       }

       if (result.action === 'done') {
          setStep("idle")
          setShowAutoDeploy(true)
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "I have fixed the issues. Ready to deploy."
          }])
          return
       }

       let actionResult: any = { status: 'success' }
       let actionSummary = ""

       // Helper function to handle file updates
       const updateFile = async (name: string, code: string, usedFor: string) => {
            setGeneratedPages(prev => {
                const exists = prev.find(p => p.name === name)
                if (exists) {
                    return prev.map(p => p.name === name ? { ...p, code, timestamp: Date.now() } : p)
                } else {
                    return [...prev, { name, code, timestamp: Date.now(), usedFor }]
                }
            })
            await fetch(`/api/projects/${projectId}/pages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, content: code, usedFor })
            })
       }

       if (result.action === 'read') {
          setCurrentPlan(`Reading ${result.targetFile}...`)
          const page = generatedPages.find(p => p.name === result.targetFile)
          if (page) {
             actionResult = { status: 'success', code: page.code }
             actionSummary = `Read ${result.targetFile} (${page.code.length} bytes)`
          } else {
             actionResult = { status: 'error', message: 'File not found' }
             actionSummary = `Failed to read ${result.targetFile}`
             setMessages(prev => [...prev, {
               id: Date.now().toString(),
               role: "system",
               content: `Could not find file: ${result.targetFile}`
             }])
          }
       }
       else if (result.action === 'move') {
          setCurrentPlan(`Moving ${result.targetFile}...`)
          const page = generatedPages.find(p => p.name === result.targetFile)
          if (page) {
             const newName = result.newPath
             await updateFile(newName, page.code, page.usedFor || '')
             await fetch(`/api/projects/${projectId}/pages?name=${encodeURIComponent(result.targetFile)}`, { method: "DELETE" })
             setGeneratedPages(prev => prev.filter(p => p.name !== result.targetFile))

             setMessages(prev => [...prev, {
               id: Date.now().toString(),
               role: "assistant",
               content: `Moved ${result.targetFile} to ${result.newPath}`
             }])
             actionSummary = `Moved ${result.targetFile} to ${result.newPath}`
          } else {
             actionResult = { status: 'error', message: 'File not found' }
          }
       }
       else if (result.action === 'delete') {
          setCurrentPlan(`Deleting ${result.targetFile}...`)
          setGeneratedPages(prev => prev.filter(p => p.name !== result.targetFile))
          await fetch(`/api/projects/${projectId}/pages?name=${encodeURIComponent(result.targetFile)}`, { method: "DELETE" })
          setMessages(prev => [...prev, {
             id: Date.now().toString(),
             role: "assistant",
             content: `Deleted ${result.targetFile}`
          }])
          actionSummary = `Deleted ${result.targetFile}`
       }
       else if (result.action === 'write') {
          setCurrentPlan(`Fixing ${result.targetFile}...`)
          await updateFile(result.targetFile, result.code, 'Auto-fix')

          setMessages(prev => [...prev, {
             id: Date.now().toString(),
             role: "assistant",
             content: `Updated ${result.targetFile}`,
             code: result.code,
             pageName: result.targetFile
          }])
          actionSummary = `Wrote to ${result.targetFile} (Length: ${result.code.length})`
       }

       const newHistory = [...history, {
          action: result.action,
          target: result.targetFile,
          result: actionResult,
          summary: actionSummary
       }]

       setFixHistory(newHistory)
       await processAutoFix(logs, newHistory, iteration + 1)

    } catch (e: any) {
       console.error("Auto fix loop error", e)
       setError(e.message)
       setStep("idle")
    }
  }

  const startGeneration = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    // setInput("")

    setError(null)
    setStep("planning")
    setCurrentPlan("Architecting solution...")
    setShowAutoDeploy(false)

    try {
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
      setMessages(prev => [...prev, planMessage])

      processNextStep(generatedInstruction, [...messages, userMessage, planMessage])
    } catch (err: any) {
      setError(err.message || "Planning failed")
      setStep("idle")
    }
  }

  const processNextStep = async (currentInstruction: string, currentHistory: Message[]) => {
    setStep("coding")
    setCurrentPlan("Generating next file...")

    const nextFileMatch = /\[\d+\]\s*([^\s:]+)/.exec(currentInstruction)
    if (nextFileMatch) setActiveFile(nextFileMatch[1])

    try {
      const response = await fetch("/api/ai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: currentHistory,
          instruction: currentInstruction,
          model: selectedModel.id,
          generatedPages: generatedPages.map(p => ({ name: p.name, code: p.code })),
        }),
      })

      if (!response.ok) throw new Error("Generation failed")
      const data = await response.json()

      if (data.isComplete) {
        setStep("done")
        setCurrentPlan("All files generated.")
        setActiveFile(undefined)
        return
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated ${data.pageName}`,
        code: data.code,
        pageName: data.pageName,
        isIntermediate: true
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.code && data.pageName) {
        setGeneratedPages(prev => {
           const filtered = prev.filter(p => p.name !== data.pageName)
           return [...filtered, {
             name: data.pageName,
             code: data.code,
             timestamp: Date.now(),
             usedFor: data.usedFor
           }]
        })

        await fetch(`/api/projects/${projectId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.pageName,
            content: data.code,
            usedFor: data.usedFor || ''
          })
        })
      }

      setInstruction(data.updatedInstruction)
      processNextStep(data.updatedInstruction, [...currentHistory, assistantMessage])

    } catch (err: any) {
      setError(err.message)
      setStep("idle")
      setActiveFile(undefined)
    }
  }

  const handleDeploy = async () => {
      setIsDeploying(true)
      try {
          const res = await fetch("/api/deploy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId })
          })
          const data = await res.json()
          if(data.success) {
              setDeploySuccess(true)
              setDeployResult(data)
              setShowAutoDeploy(false)
          } else {
              setError(data.error)
          }
      } catch(e: any) {
          setError(e.message)
      } finally {
          setIsDeploying(false)
      }
  }

  // Plan content extraction
  const planMessage = messages.find(m => m.role === 'assistant' && m.plan)
  const planContent = planMessage?.content || ""

  return (
    <div className="flex flex-col h-full bg-transparent text-zinc-100 font-sans relative overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
             {/* Background Accents - Blue only, as requested */}
             {step === 'idle' && (
                 <>
                     <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                     <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                 </>
             )}

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10 flex flex-col">
                 {/* IDLE STATE */}
                {step === 'idle' && (
                    <div className="flex flex-col items-center justify-start pt-20 text-center max-w-2xl w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 h-full">
                        <GeminiBadge />
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-2 text-white">
                                Hi {userName},
                            </h1>
                            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-500 mb-6">
                                What are we building?
                            </h2>
                        </div>
                    </div>
                )}

                {/* GENERATING/DONE STATE */}
                {(step !== 'idle') && (
                    <div className="max-w-2xl mx-auto space-y-2 w-full flex-1 flex flex-col justify-center">
                         {/* 1. Thinking */}
                        <ThinkingCard
                            planContent={planContent}
                            isActive={step === 'planning'}
                            isDone={step === 'coding' || step === 'done' || step === 'fixing'}
                        />

                        {/* 2. Building */}
                        {(step === 'coding' || step === 'fixing' || step === 'done') && (
                            <ProgressCard
                                isActive={step === 'coding' || step === 'fixing'}
                                isDone={step === 'done'}
                                progress={progress}
                                activeFile={activeFile}
                            />
                        )}

                        {/* 3. Saving */}
                         {(step === 'coding' || step === 'done') && (
                            <SavingCard
                                isActive={step === 'coding'}
                                isDone={step === 'done'}
                            />
                         )}

                         {/* Done Actions */}
                        {step === 'done' && (
                            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                 <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 mb-6 backdrop-blur-md">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="font-medium">Website generation complete!</span>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-base font-semibold bg-white text-black hover:bg-zinc-200 rounded-xl"
                                        onClick={handleDeploy}
                                        disabled={isDeploying}
                                    >
                                        {isDeploying ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Rocket className="h-5 w-5 mr-2" />}
                                        {deploySuccess ? "Deployed!" : "Deploy to Cloudflare"}
                                    </Button>
                                     <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full h-14 text-base font-medium bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl backdrop-blur-sm"
                                        onClick={() => {
                                            setStep('idle')
                                            setInput("")
                                            setMessages([])
                                        }}
                                    >
                                        Create Another
                                    </Button>
                                 </div>
                            </div>
                        )}

                         {/* Error Display */}
                        {error && (
                             <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start gap-3 backdrop-blur-md">
                                <Bug className="h-5 w-5 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="font-medium text-sm">Error</h4>
                                    <p className="text-xs opacity-90">{error}</p>
                                    <Button
                                        variant="link"
                                        className="text-red-400 p-0 h-auto text-xs mt-2"
                                        onClick={() => setStep('idle')}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Bar - Always visible, fixed at bottom */}
            <div className="w-full relative z-20">
                <InputBar
                    input={input}
                    setInput={setInput}
                    onSend={startGeneration}
                    disabled={step !== 'idle'}
                />
            </div>
        </div>
    </div>
  )
}

export default AIWebsiteBuilder
