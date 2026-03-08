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
  Globe,
  Database
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

// Updated Models List — gemini-3.1-pro-preview is the default
const MODELS = [
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Preview)", provider: "Google" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "deepseek-v3.2-exp", name: "DeepSeek V3", provider: "DeepSeek" },
]

type Step = "idle" | "planning" | "needs_info" | "firebase_auth" | "coding" | "fixing" | "done"

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
    <div className="w-full max-w-2xl mx-auto px-4 pb-6 md:pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 z-50 fixed bottom-0 left-0 right-0 md:static">
        <div className={cn(
            "rounded-[2rem] p-1.5 relative shadow-lg transition-all duration-300 border border-white/5 bg-[#1c1c1c] flex items-center gap-2",
            disabled ? "opacity-80 pointer-events-none" : "focus-within:border-white/10"
        )}>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all shrink-0 ml-1" disabled={disabled}>
                <Paperclip className="h-5 w-5" />
            </Button>

            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                placeholder="Describe the website you want"
                className="flex-1 border-none bg-transparent dark:bg-transparent h-12 text-base text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 px-0 shadow-none"
                disabled={disabled}
                autoFocus={!disabled}
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

const ThinkingCard = ({ isActive, isDone }: { isActive: boolean, isDone: boolean }) => {
    if (!isActive && !isDone) return null;

    return (
        <div className="flex flex-col items-center justify-center py-6 gap-3 group transition-all duration-500 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-center text-zinc-300">
                <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className={cn("text-sm font-medium transition-colors duration-300", isActive ? "text-zinc-200" : "text-zinc-400")}>
                Thinking
            </h3>
            {isActive && (
                <p className="text-xs text-zinc-500 animate-pulse">Architecting your website structure…</p>
            )}
        </div>
    )
}

interface ProgressCardProps {
  isActive: boolean
  isDone: boolean
  progress: { percent: number; done: number; total: number }
  currentFile?: string
  currentFileUsedFor?: string
}

const ProgressCard = ({ isActive, isDone, progress, currentFile, currentFileUsedFor }: ProgressCardProps) => {
    if (!isActive && !isDone) return null;

    return (
        <div className="flex flex-col items-center justify-center py-6 gap-5 group transition-all duration-500 delay-100 animate-in fade-in slide-in-from-bottom-2 w-full">
            <div className="flex items-center gap-2 text-zinc-300">
                <Hammer className="h-5 w-5" />
                <h3 className="text-base font-medium">Building</h3>
            </div>

            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                {isActive ? (
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                ) : (
                    <CheckCircle2 className="h-6 w-6 text-zinc-400" />
                )}

                {/* Current file being generated */}
                {currentFile && isActive && (
                    <div className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">
                            <Code className="h-3 w-3" />
                            Now generating
                        </div>
                        <p className="text-sm font-mono font-semibold text-white truncate">{currentFile}</p>
                        {currentFileUsedFor && (
                            <p className="text-xs text-zinc-400 leading-relaxed">{currentFileUsedFor}</p>
                        )}
                    </div>
                )}

                <div className="text-center space-y-2 w-full">
                    <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                        <span>{progress.done} of {progress.total} files</span>
                        <span>{progress.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-zinc-400 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress.percent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

const SavingCard = ({ isActive, isDone }: { isActive: boolean, isDone: boolean }) => {
    if (!isActive && !isDone) return null;

    return (
        <div className="flex flex-col items-center justify-center py-6 gap-3 group transition-all duration-500 delay-200 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-center text-zinc-300">
               {isDone ? <Check className="h-6 w-6" /> : <Cloud className="h-6 w-6 animate-pulse" />}
            </div>
            <h3 className={cn("text-sm font-medium transition-colors duration-300", isActive ? "text-zinc-200" : "text-zinc-300")}>
               {isDone ? "Saved to cloud" : "Saving"}
            </h3>
        </div>
    )
}


const WebsitePreviewCardSkeleton = () => {
    return (
        <div className="w-full aspect-video rounded-2xl bg-[#1c1c1c] border border-white/5 shadow-2xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-xl flex flex-col items-center justify-center">
            {/* Browser Header */}
            <div className="w-full h-8 bg-[#2c2c2e] border-b border-white/5 flex items-center px-4 gap-1.5 shrink-0 absolute top-0 left-0 right-0">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600/50" />
            </div>
            {/* Inner rounded rectangle similar to the image */}
            <div className="w-[85%] h-[65%] mt-8 rounded-xl bg-[#2a2a2a] border border-white/5 flex items-center justify-center relative overflow-hidden">
            </div>
        </div>
    )
}

const HexagonIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 2L20.6603 7V17L12 22L3.33975 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="4" fill="currentColor"/>
    </svg>
)

const FirebaseConnectionCard = ({ onConnect }: { onConnect: () => void }) => {
    return (
        <div className="flex flex-col items-center justify-center py-6 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center gap-3 mb-2">
                <HexagonIcon className="h-5 w-5 text-[#f97316]" />
                <h3 className="text-base font-medium text-zinc-100">Let's connect you to a database</h3>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1c1c1c] border border-white/5 w-full max-w-sm">
                <div className="flex items-center gap-3">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.603 21.056c.23.125.503.125.732 0l8.913-4.838a.333.333 0 0 0 .15-.357L17.765 2.112a.333.333 0 0 0-.585-.145l-4.717 6.945-2.03-3.61a.333.333 0 0 0-.585.003L2.618 15.86a.333.333 0 0 0 .154.357l8.831 4.839Z" fill="#FFCA28"/>
                        <path d="m11.969 21.056 8.913-4.838a.333.333 0 0 0 .15-.357L17.765 2.112a.333.333 0 0 0-.585-.145L11.969 21.056Z" fill="#FFA000"/>
                        <path d="M11.969 21.056 2.618 15.86a.333.333 0 0 1-.154-.357L8.985 3.033a.333.333 0 0 1 .585-.003L11.969 21.056Z" fill="#F57C00"/>
                        <path d="M11.969 21.056 12.463 8.91l-2.03-3.61a.333.333 0 0 0-.585.003l-7.23 10.558 8.831 4.839a.5.5 0 0 0 .52 0Z" fill="#FF8A65"/>
                    </svg>
                    <span className="font-semibold text-white">Firebase</span>
                </div>
                <Button
                    onClick={onConnect}
                    className="bg-[#3c3c3e] text-white hover:bg-[#4c4c4e] rounded-full px-6 py-2 h-9 font-medium border-none"
                >
                    Connect
                </Button>
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
  const [activeFileUsedFor, setActiveFileUsedFor] = useState<string | undefined>(undefined)

  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url?: string; githubUrl?: string } | null>(null)
  const [showAutoDeploy, setShowAutoDeploy] = useState(false)

  const [instruction, setInstruction] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState(MODELS[0])

  const [fixHistory, setFixHistory] = useState<any[]>([])
  const [requiresDatabase, setRequiresDatabase] = useState(false)


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

      // Check if AI needs more info
      const questionMatch = generatedInstruction.match(/\[QUESTION\]\s*(.*)/i)
      if (questionMatch) {
          const questionText = questionMatch[1].trim()
          setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: questionText
          }])
          setStep("needs_info")
          setInput("")
          return
      }

      // Check if database is required
      if (generatedInstruction.includes("## REQUIRES_DATABASE: true")) {
          setRequiresDatabase(true)
          setStep("firebase_auth")
          // We will wait for user to authenticate
      } else {
          setRequiresDatabase(false)
      }

      setInstruction(generatedInstruction)

      const planMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generatedInstruction,
        plan: "Architectural Strategy",
      }
      setMessages(prev => [...prev, planMessage])

      if (!generatedInstruction.includes("## REQUIRES_DATABASE: true")) {
          processNextStep(generatedInstruction, [...messages, userMessage, planMessage])
      }
    } catch (err: any) {
      setError(err.message || "Planning failed")
      setStep("idle")
    }
  }

  const processNextStep = async (currentInstruction: string, currentHistory: Message[]) => {
    setStep("coding")
    setCurrentPlan("Generating next file...")

    // Pattern matches: [N] filename.ext [usedfor]description[/usedfor]
    // e.g. [1] index.html [usedfor]Main entry point[usedfor]
    const nextFileMatch = /\[\d+\]\s*([^\s:]+)(?:[:\-]?\s*\[usedfor\](.*?)\[usedfor\])?/.exec(currentInstruction)
    if (nextFileMatch) {
      setActiveFile(nextFileMatch[1])
      setActiveFileUsedFor(nextFileMatch[2]?.trim() || undefined)
    }

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
        setActiveFileUsedFor(undefined)
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
      setActiveFileUsedFor(undefined)
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

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10 flex flex-col" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                    <div className="max-w-2xl mx-auto space-y-6 w-full flex-1 flex flex-col justify-start pb-20 pt-6">

                         {/* Preview Box Skeleton */}
                         {(step === 'coding' || step === 'fixing' || step === 'planning' || step === 'needs_info' || step === 'firebase_auth' || step === 'done') && (
                             <WebsitePreviewCardSkeleton />
                         )}

                         <div className="flex flex-col items-center justify-center w-full">
                            {step === 'planning' && (
                                <ThinkingCard isActive={true} isDone={false} />
                            )}

                            {(step === 'coding' || step === 'fixing') && (
                                <ProgressCard isActive={true} isDone={false} progress={progress} currentFile={activeFile} currentFileUsedFor={activeFileUsedFor} />
                            )}

                            {step === 'firebase_auth' && (
                                <FirebaseConnectionCard onConnect={() => {
                                    setStep("planning")
                                    if (instruction) {
                                        processNextStep(instruction, [...messages])
                                    }
                                }} />
                            )}

                            {step === 'done' && (
                                <SavingCard isActive={false} isDone={true} />
                            )}
                         </div>

                         {/* Chat History View */}
                         {(step === 'coding' || step === 'done' || step === 'fixing' || step === 'needs_info' || step === 'firebase_auth') && (
                             <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                 {messages.filter(m => m.role === 'user' || (m.role === 'assistant' && !m.plan && !m.isIntermediate)).map((msg, i) => (
                                     <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                                         <div className={cn(
                                             "px-4 py-3 rounded-2xl max-w-[85%] text-sm",
                                             msg.role === 'user'
                                                ? "bg-white/15 text-white rounded-br-sm"
                                                : "bg-zinc-900/70 border border-white/10 text-zinc-200 rounded-bl-sm"
                                         )}>
                                             {msg.content}
                                         </div>
                                     </div>
                                 ))}
                             </div>
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
                    disabled={step !== 'idle' && step !== 'needs_info'}
                />
            </div>
        </div>
    </div>
  )
}

export default AIWebsiteBuilder
