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
  Database,
  ThumbsUp,
  ThumbsDown,
  Flag,
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
  { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite ⚡", provider: "Google", fast: true },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "deepseek-v3.2-exp", name: "DeepSeek V3", provider: "DeepSeek" },
]

// Log-analysis constants — keep in sync with dashboard page fetchLogs
const LOG_SUCCESS_PATTERNS = ['take a peek over at', 'deployment complete', 'pages.dev']
const LOG_ERROR_PATTERNS   = ['error', 'fail', 'exception']

// How long to wait after deploy before the first log check (build pipeline startup time)
const DEPLOY_LOG_CHECK_DELAY_MS = 8000

type Step = "idle" | "planning" | "needs_info" | "coding" | "fixing" | "done"

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

// --- GENERATION STEP ICONS (matching the reference UI) ---

const BrainIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 21h4M12 2v1M9 17v4M15 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9.5" cy="9" r="1" fill="currentColor"/>
    <circle cx="14.5" cy="9" r="1" fill="currentColor"/>
    <path d="M9.5 13c.83.83 2.17 1.5 2.5 1.5s1.67-.67 2.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const SearchWebIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6" cy="6" r="0.75" fill="currentColor"/>
    <circle cx="8.5" cy="6" r="0.75" fill="currentColor"/>
    <circle cx="11" cy="6" r="0.75" fill="currentColor"/>
    <path d="M7 15l2-2m0 0a3 3 0 1 0-4.24-4.24 3 3 0 0 0 4.24 4.24z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="translate(5,2)"/>
  </svg>
)

const CodeCreateIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 18l-4-6 4-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 6l4 6-4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.5 4l-5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const SaveCloudIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/** Step data for the generation pipeline — shown as a vertical list with icons */
interface ThinkingStep {
  id: string
  icon: 'thinking' | 'searching' | 'creating' | 'saving'
  label: string
  detail?: string
  status: 'pending' | 'active' | 'done'
}

const StepIcon = ({ type, className }: { type: ThinkingStep['icon'], className?: string }) => {
  switch (type) {
    case 'thinking': return <BrainIcon className={className} />
    case 'searching': return <SearchWebIcon className={className} />
    case 'creating': return <CodeCreateIcon className={className} />
    case 'saving': return <SaveCloudIcon className={className} />
  }
}

const ThinkingStepRow = ({ step }: { step: ThinkingStep }) => (
  <div className="flex items-start gap-3 py-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className={cn(
      "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-300",
      step.status === 'active' ? "bg-white/10 border-white/10 text-zinc-200" : "bg-white/[0.04] border-white/[0.06] text-zinc-500"
    )}>
      {step.status === 'active' ? (
        <StepIcon type={step.icon} className="h-4.5 w-4.5 animate-pulse" />
      ) : step.status === 'done' ? (
        <StepIcon type={step.icon} className="h-4.5 w-4.5" />
      ) : (
        <StepIcon type={step.icon} className="h-4.5 w-4.5 opacity-40" />
      )}
    </div>
    <div className="flex-1 min-w-0 pt-1">
      <p className={cn(
        "text-sm font-medium transition-colors duration-300",
        step.status === 'active' ? "text-zinc-300" : step.status === 'done' ? "text-zinc-500" : "text-zinc-600"
      )}>
        {step.label}
      </p>
      {step.detail && (
        <p className={cn(
          "text-xs mt-0.5 leading-relaxed transition-colors duration-300",
          step.status === 'active' ? "text-zinc-500" : "text-zinc-600"
        )}>
          {step.detail}
        </p>
      )}
    </div>
  </div>
)

// --- SITEMAP COMPONENT ---

interface SitemapNode {
  page: string
  path: string
  leadsTo?: string[]
  description?: string
}

const SitemapVisualizer = ({ nodes }: { nodes: SitemapNode[] }) => {
  if (!nodes || nodes.length === 0) return null

  return (
    <div className="mt-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
        <Globe className="h-3 w-3" /> Sitemap
      </div>
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-1">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="h-6 w-6 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0">
              <Globe className="h-3 w-3 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{node.page}</p>
              <p className="text-[10px] text-zinc-600 truncate">{node.path}</p>
            </div>
            {node.leadsTo && node.leadsTo.length > 0 && (
              <div className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600">{node.leadsTo.join(", ")}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// --- ENV VAR / INTEGRATION COMPONENTS ---

interface EnvVar {
  key: string
  value: string
  integration?: string | null
}

const INTEGRATION_OPTIONS = [
  {
    id: "mongodb",
    name: "MongoDB",
    envKey: "MONGODB_URI",
    placeholder: "mongodb+srv://user:pass@cluster.mongodb.net/db",
    logo: "https://www.mongodb.com/assets/images/global/favicon.ico",
    color: "#00684A",
    description: "NoSQL document database",
  },
  {
    id: "supabase",
    name: "Supabase",
    envKey: "SUPABASE_URL",
    placeholder: "https://abc.supabase.co",
    logo: "https://supabase.com/favicon/favicon-32x32.png",
    color: "#3ECF8E",
    description: "Open source Firebase alternative",
  },
  {
    id: "stripe",
    name: "Stripe",
    envKey: "STRIPE_SECRET_KEY",
    placeholder: "sk_live_...",
    logo: "https://stripe.com/favicon.ico",
    color: "#635BFF",
    description: "Payment processing",
  },
  {
    id: "firebase",
    name: "Firebase",
    envKey: "FIREBASE_API_KEY",
    placeholder: "AIzaSy...",
    logo: "https://www.gstatic.com/devrel-devsite/prod/v0e0f589edd85502a40d78d7d0825db8ea5ef3b99ab4070381ee86977c9168730/firebase/images/favicon.png",
    color: "#FFCA28",
    description: "Google cloud platform for apps",
  },
]

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
            "rounded-[2.5rem] p-2 relative shadow-lg transition-all duration-300 border border-white/[0.06] bg-[#1c1c1c] flex items-center gap-2",
            disabled ? "opacity-80 pointer-events-none" : "focus-within:border-white/10"
        )}>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all shrink-0 ml-1" disabled={disabled}>
                <Paperclip className="h-5 w-5" />
            </Button>

            <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                placeholder="Describe the website you want"
                className="flex-1 border-none bg-transparent dark:bg-transparent h-14 text-base text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 px-0 shadow-none"
                disabled={disabled}
                autoFocus={!disabled}
            />

            <Button
                size="icon"
                className={cn(
                    "h-11 w-11 rounded-full transition-all active:scale-95 shrink-0 flex items-center justify-center bg-transparent border-none mr-1 shadow-none",
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

const AppwriteConnectionCard = ({
    projectId,
    onConnect,
}: {
    projectId: string
    onConnect: () => void
}) => {
    const [isConnecting, setIsConnecting] = useState(false)
    const [connectError, setConnectError] = useState<string | null>(null)
    const [endpoint, setEndpoint] = useState(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
    const [appwriteProjectId, setAppwriteProjectId] = useState(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    const [apiKey, setApiKey] = useState("")

    const envPreFilled = !!(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)

    const handleConnect = async () => {
        if (!endpoint.trim() || !appwriteProjectId.trim()) {
            setConnectError("Endpoint and Project ID are required")
            return
        }
        setIsConnecting(true)
        setConnectError(null)
        try {
            const res = await fetch(`/api/projects/${projectId}/appwrite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appwriteEndpoint: endpoint.trim(),
                    appwriteProjectId: appwriteProjectId.trim(),
                    appwriteApiKey: apiKey.trim() || null,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Failed to save Appwrite connection")
            }

            onConnect()
        } catch (err: unknown) {
            const error = err as { message?: string }
            setConnectError(error?.message || "Connection failed. Please try again.")
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center py-6 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center gap-3 mb-2">
                <Database className="h-5 w-5 text-[#f02e65]" />
                <h3 className="text-base font-medium text-zinc-100">Connect to Appwrite</h3>
            </div>
            <p className="text-xs text-zinc-500 text-center max-w-xs -mt-2">
                This project needs a backend to store data. Connect your Appwrite project to enable databases, auth, and functions.
            </p>

            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#1c1c1c] border border-white/5 w-full max-w-sm">
                <div className="flex items-center gap-3 mb-1">
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="4" fill="#FD366E"/>
                        <path d="M18.29 10.04c-.2-.25-.51-.39-.83-.39h-4.43l1.72-4.53a.88.88 0 00-.81-1.18.88.88 0 00-.82.55l-2.1 5.55H7.5c-.32 0-.63.14-.83.39a1.04 1.04 0 00-.2.9l1.44 5.76c.1.38.44.65.83.65h6.53c.39 0 .73-.27.83-.65l1.44-5.77c.07-.31 0-.64-.2-.89l-.05.01z" fill="white"/>
                    </svg>
                    <span className="font-semibold text-white">Appwrite</span>
                </div>

                {envPreFilled ? (
                    <p className="text-[11px] text-zinc-500">Pre-configured from environment</p>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="Endpoint (e.g. https://cloud.appwrite.io/v1)"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                        <input
                            type="text"
                            placeholder="Project ID"
                            value={appwriteProjectId}
                            onChange={(e) => setAppwriteProjectId(e.target.value)}
                            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                        <input
                            type="password"
                            placeholder="API Key (optional)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                    </>
                )}

                <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full bg-[#FD366E] text-white hover:bg-[#e0305f] rounded-full px-6 py-2 h-9 font-medium border-none mt-1"
                >
                    {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
                </Button>
            </div>

            {connectError && (
                <p className="text-xs text-red-400 text-center max-w-xs">{connectError}</p>
            )}

            <p className="text-[10px] text-zinc-600 text-center max-w-xs">
                Learn more at{" "}
                <a href="https://appwrite.io/docs" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">
                    appwrite.io/docs
                </a>
            </p>
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

  // Thinking steps — shown during generation with icons matching the reference UI
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])

  // Sitemap — parsed from the generation plan
  const [sitemap, setSitemap] = useState<SitemapNode[]>([])

  // Per-message feedback: 'like' | 'dislike' | 'report' | null
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'like' | 'dislike' | 'report' | null>>({})

  /** Helper: add or update a thinking step */
  const upsertStep = (id: string, updates: Partial<ThinkingStep>) => {
    setThinkingSteps(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], ...updates }
        return copy
      }
      return [...prev, { id, icon: 'thinking', label: '', status: 'pending', ...updates } as ThinkingStep]
    })
  }

  /** Parse sitemap nodes from the plan instruction text */
  const parseSitemap = (planText: string) => {
    const nodes: SitemapNode[] = []
    // Look for page structure section
    const pageSection = planText.match(/## 4\. Page Structure([\s\S]*?)(?:## 5|$)/i)
    if (pageSection) {
      const lines = pageSection[1].split('\n')
      for (const line of lines) {
        const match = line.match(/[-*]\s*\*\*([^*]+)\*\*\/?:?\s*(.*)/)
        if (match) {
          const pageName = match[1].replace(/\/$/, '').trim()
          const desc = match[2].trim()
          const path = '/' + pageName.toLowerCase().replace(/\s+/g, '-')
          // Extract navigation links mentioned in description
          const linkMatches = desc.match(/(?:link|lead|navigate|redirect|go)\s+to\s+([^.,]+)/gi) || []
          const leadsTo = linkMatches.map(l => l.replace(/.*to\s+/i, '').trim())
          nodes.push({ page: pageName, path, description: desc, leadsTo })
        }
      }
    }
    // Fallback: extract from [N] file markers that look like pages
    if (nodes.length === 0) {
      const fileMatches = planText.matchAll(/\[\d+\]\s*(src\/components\/[\w-]+\.ts)\s*:\s*\[usedfor\](.*?)\[usedfor\]/g)
      for (const m of fileMatches) {
        const name = m[1].replace('src/components/', '').replace('.ts', '')
        const desc = m[2]
        if (name !== 'header' && name !== 'footer') {
          nodes.push({ page: name.charAt(0).toUpperCase() + name.slice(1), path: '/' + name, description: desc })
        }
      }
    }
    setSitemap(nodes)
  }

  const giveFeedback = (msgId: string, kind: 'like' | 'dislike' | 'report') => {
    setMessageFeedback(prev => ({
      ...prev,
      [msgId]: prev[msgId] === kind ? null : kind,
    }))
  }


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

  // Ref for auto-scrolling to the bottom of the chat
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step !== 'idle') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, step])

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

    // Initialize thinking steps
    setThinkingSteps([
      { id: 'think', icon: 'thinking', label: 'thinking', status: 'active' },
    ])
    setSitemap([])

    try {
      const planResponse = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!planResponse.ok) throw new Error("Failed to generate plan")
      const planData = await planResponse.json()
      const generatedInstruction = planData.instruction

      // Mark thinking as done with descriptive detail like the reference UI
      const businessGoal = generatedInstruction.match(/## 1\. Business Goal\s*(.*?)(?:\n|$)/)?.[1]?.trim()
      upsertStep('think', {
        status: 'done',
        detail: businessGoal
          ? `I successfully created the plan for ${businessGoal.substring(0, 60)}. Now I proceed to create the frontend`
          : 'I successfully analysed the request. Now I proceed to create the app'
      })

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
          setThinkingSteps([])
          return
      }

      // Web search — only when the plan indicates backend / data needs
      const needsSearch = /database|backend|api|server|mongo|auth|payment|stripe|supabase/i.test(generatedInstruction)
      if (needsSearch) {
        upsertStep('search', { icon: 'searching', label: 'searching web for', detail: input.trim().substring(0, 60), status: 'active' })
        try {
          await fetch("/api/ai/web-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: input.trim(), type: "general" }),
          })
        } catch { /* non-critical */ }
        upsertStep('search', { status: 'done' })
      }

      // Parse sitemap from plan
      parseSitemap(generatedInstruction)

      setInstruction(generatedInstruction)

      const planMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generatedInstruction,
        plan: "Architectural Strategy",
      }
      setMessages(prev => [...prev, planMessage])

      // Start coding step
      upsertStep('code', { icon: 'creating', label: 'creating code for frontend', status: 'pending' })

      processNextStep(generatedInstruction, [...messages, userMessage, planMessage])
    } catch (err: any) {
      setError(err.message || "Planning failed")
      setStep("idle")
      setThinkingSteps([])
    }
  }

  const processNextStep = async (currentInstruction: string, currentHistory: Message[]) => {
    setStep("coding")
    setCurrentPlan("Generating next file...")

    // Update thinking step: coding is now active
    upsertStep('code', { status: 'active' })

    // Pattern matches: [N] filename.ext [usedfor]description[/usedfor]
    // e.g. [1] index.html [usedfor]Main entry point[usedfor]
    const nextFileMatch = /\[\d+\]\s*([^\s:]+)(?:[:\-]?\s*\[usedfor\](.*?)\[usedfor\])?/.exec(currentInstruction)
    if (nextFileMatch) {
      setActiveFile(nextFileMatch[1])
      setActiveFileUsedFor(nextFileMatch[2]?.trim() || undefined)
      upsertStep('code', { detail: `creating ${nextFileMatch[1]}` })
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
        upsertStep('code', { status: 'done', label: 'creating code for frontend', detail: undefined })
        upsertStep('save', { icon: 'saving', label: 'saving', status: 'active' })
        setStep("done")
        setCurrentPlan("All files generated.")
        setActiveFile(undefined)
        setActiveFileUsedFor(undefined)
        // Mark saving as done after a brief delay
        setTimeout(() => upsertStep('save', { status: 'done' }), 800)
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
      setThinkingSteps([])
    }
  }

  const checkDeployLogs = async (repoId: string, attempt = 0) => {
    // Give up after ~40 seconds (8 attempts × 5 s)
    if (attempt >= 8) return

    try {
      const res = await fetch(`https://micro1.sycord.com/api/logs?project_id=${repoId}`)
      if (!res.ok) {
        setTimeout(() => checkDeployLogs(repoId, attempt + 1), 5000)
        return
      }
      const data = await res.json()
      if (!data.success || !Array.isArray(data.logs) || data.logs.length === 0) {
        setTimeout(() => checkDeployLogs(repoId, attempt + 1), 5000)
        return
      }

      const combinedLower = data.logs.join('\n').toLowerCase()

      const isSuccess = LOG_SUCCESS_PATTERNS.some(p => combinedLower.includes(p))
      if (isSuccess) return // Build was fine

      const hasError = data.logs.some((log: string) => {
        const logLower = log.toLowerCase()
        return LOG_ERROR_PATTERNS.some(p => logLower.includes(p))
      })

      if (hasError) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I detected a build error in the deployment logs. Starting automatic repair…',
        }])
        startAutoFixSession(data.logs)
        return
      }

      // No conclusive result yet — keep polling
      setTimeout(() => checkDeployLogs(repoId, attempt + 1), 5000)
    } catch {
      setTimeout(() => checkDeployLogs(repoId, attempt + 1), 5000)
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
              // After deploy succeeds, wait for the build then check logs for errors
              if (data.repoId) {
                  setTimeout(() => checkDeployLogs(data.repoId), DEPLOY_LOG_CHECK_DELAY_MS)
              }
          } else {
              setError(data.error)
          }
      } catch(e: any) {
          setError(e.message)
      } finally {
          setIsDeploying(false)
      }
  }

  return (
    <div className="flex flex-col h-full bg-transparent text-zinc-100 font-sans relative">
        {/* Model selector — pinned to top */}
        <div className="w-full flex items-center justify-end px-4 py-2 z-20 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 rounded-full text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-white/5 px-3 gap-1.5 border border-white/[0.06]">
                {(selectedModel as any).fast ? <Zap className="h-3 w-3 text-yellow-500" /> : <Sparkles className="h-3 w-3 text-zinc-600" />}
                <span>{selectedModel.name}</span>
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1c1c1c] border-white/10 min-w-[220px]">
              {MODELS.map(m => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={cn("text-xs", selectedModel.id === m.id ? "text-white bg-white/10" : "text-zinc-400")}
                >
                  <span className="flex items-center gap-2">
                    {(m as any).fast ? <Zap className="h-3 w-3 text-yellow-500" /> : <Sparkles className="h-3 w-3 text-zinc-600" />}
                    {m.name}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Background Accents - idle only */}
        {step === 'idle' && (
            <>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            </>
        )}

        {/* Scrollable chat area */}
        <div
            className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pb-32"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <div className="max-w-2xl mx-auto w-full px-4 md:px-0 min-h-full flex flex-col">

                {/* IDLE STATE */}
                {step === 'idle' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
                        <GeminiBadge />
                        <div className="mt-4 space-y-1">
                            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white">
                                Hi {userName},
                            </h1>
                            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-500">
                                What are we building?
                            </h2>
                        </div>
                    </div>
                )}

                {/* CHAT / GENERATING STATE */}
                {step !== 'idle' && (
                    <div className="flex flex-col pt-8 pb-4">

                        {/* Messages — plain text, no bubbles, Gemini-style */}
                        {messages
                            .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.plan && !m.isIntermediate))
                            .map((msg, i) => (
                                <div
                                    key={msg.id || i}
                                    className={cn(
                                        "py-2.5",
                                        msg.role === 'user' ? "flex justify-end" : "flex flex-col items-start"
                                    )}
                                >
                                    <p className={cn(
                                        "text-sm leading-relaxed max-w-[82%]",
                                        msg.role === 'user' ? "text-zinc-200 text-right" : "text-zinc-400"
                                    )}>
                                        {msg.content}
                                    </p>

                                    {/* Feedback buttons — assistant messages only */}
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <button
                                                onClick={() => giveFeedback(msg.id, 'like')}
                                                title="Like"
                                                className={cn(
                                                    "transition-colors",
                                                    messageFeedback[msg.id] === 'like'
                                                        ? "text-zinc-200"
                                                        : "text-zinc-700 hover:text-zinc-400"
                                                )}
                                            >
                                                <ThumbsUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => giveFeedback(msg.id, 'dislike')}
                                                title="Dislike"
                                                className={cn(
                                                    "transition-colors",
                                                    messageFeedback[msg.id] === 'dislike'
                                                        ? "text-zinc-200"
                                                        : "text-zinc-700 hover:text-zinc-400"
                                                )}
                                            >
                                                <ThumbsDown className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => giveFeedback(msg.id, 'report')}
                                                title="Report problem"
                                                className={cn(
                                                    "transition-colors",
                                                    messageFeedback[msg.id] === 'report'
                                                        ? "text-red-400"
                                                        : "text-zinc-700 hover:text-zinc-400"
                                                )}
                                            >
                                                <Flag className="h-3.5 w-3.5" />
                                            </button>
                                            {messageFeedback[msg.id] === 'report' && (
                                                <span className="text-[11px] text-zinc-600">Reported</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        }

                        {/* ── Thinking Steps — icon-based like the reference UI ── */}

                        {thinkingSteps.length > 0 && (step === 'planning' || step === 'coding' || step === 'fixing' || step === 'done') && (
                            <div className="mt-3 space-y-0 animate-in fade-in duration-300">
                                {thinkingSteps.map(s => (
                                    <ThinkingStepRow key={s.id} step={s} />
                                ))}
                            </div>
                        )}

                        {/* Sitemap visualization (parsed from plan) */}
                        {sitemap.length > 0 && (step === 'coding' || step === 'done') && (
                            <SitemapVisualizer nodes={sitemap} />
                        )}

                        {/* Progress bar for coding */}
                        {(step === 'coding' || step === 'fixing') && progress.total > 0 && (
                            <div className="mt-2 px-1 space-y-1 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between text-[11px] text-zinc-600">
                                    <span>{progress.done} of {progress.total} files</span>
                                    <span>{progress.percent}%</span>
                                </div>
                                <div className="h-[2px] bg-zinc-800/80 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-zinc-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${progress.percent}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'done' && (
                            <div className="py-3 mt-2 flex items-center gap-2.5 animate-in fade-in duration-300">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                <span className="text-sm text-zinc-400">Website ready</span>
                            </div>
                        )}

                        {/* Done Actions */}
                        {step === 'done' && (
                            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        size="lg"
                                        className="w-full h-12 text-sm font-semibold bg-white text-black hover:bg-zinc-200 rounded-xl"
                                        onClick={handleDeploy}
                                        disabled={isDeploying}
                                    >
                                        {isDeploying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                                        {deploySuccess ? "Deployed!" : "Deploy to Cloudflare"}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="w-full h-12 text-sm font-medium bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-white rounded-xl"
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
                            <div className="mt-4 flex items-start gap-2.5">
                                <Bug className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-red-400">{error}</p>
                                    <button
                                        className="text-xs text-red-500/60 hover:text-red-400 mt-1 underline-offset-2 underline"
                                        onClick={() => setStep('idle')}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Scroll anchor — keeps status row visible at bottom */}
                        <div ref={chatBottomRef} />
                    </div>
                )}
            </div>
        </div>

        {/* Input Bar — always at bottom */}
        <div className="w-full relative z-20">
            <InputBar
                input={input}
                setInput={setInput}
                onSend={startGeneration}
                disabled={step !== 'idle' && step !== 'needs_info'}
            />
        </div>
    </div>
  )
}

export default AIWebsiteBuilder
