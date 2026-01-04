"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  Bot,
  Check,
  ChevronDown,
  Terminal,
  Sparkles,
  FileCode,
  ArrowRight,
  Rocket,
  BrainCircuit,
  CheckCircle2,
  Folder,
  FolderOpen,
  ChevronRight,
  AlertCircle,
  Send
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const MODELS = [
  { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-exp-1206", name: "Gemini Exp 1206", provider: "Google" },
  { id: "deepseek-v3.2-exp", name: "DeepSeek V3", provider: "DeepSeek" },
]

type Step = "idle" | "planning" | "coding" | "done"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  code?: string
  plan?: string
  pageName?: string
  isIntermediate?: boolean
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'root': true, 'src': true, 'public': true, 'src/components': true })

  // Build tree from pages
  const buildTree = () => {
    const root: FileNode[] = []
    const addNode = (path: string, status: 'done' | 'generating', usedFor?: string) => {
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

    pages.forEach(p => addNode(p.name, 'done', p.usedFor))
    if (currentFile) addNode(currentFile, 'generating')

    // Sort: folders first, then alphabetically
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

    // Find usedFor metadata from pages
    const pageData = pages.find(p => p.name === node.path)

    return (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 py-1 sm:py-1.5 px-1.5 sm:px-2 text-[11px] sm:text-xs rounded hover:bg-white/5 cursor-pointer select-none transition-colors group",
            isGenerating && "bg-blue-500/10 text-blue-400 animate-pulse",
            node.status === 'done' && node.type === 'file' && "text-green-400/80"
          )}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => {
              if (node.type === 'folder') {
                  setExpanded(p => ({...p, [node.path]: !isExp}))
              }
          }}
        >
          {node.type === 'folder' && (
              <ChevronRight className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform text-muted-foreground shrink-0", isExp && "rotate-90")} />
          )}
          {node.type === 'file' && <span className="w-2.5 sm:w-3 shrink-0" />}

          <Icon className={cn(
              "h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0",
              node.type === 'folder' ? "text-yellow-500/80" : "text-blue-400/80",
              isGenerating && "text-blue-400"
          )} />

          <span className="truncate flex-1 min-w-0">{node.name}</span>

          {isGenerating && <Loader2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-blue-400 shrink-0" />}
          {node.status === 'done' && node.type === 'file' && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500/50 shrink-0" />}
          
          {/* Show usedFor tooltip on hover for files */}
          {pageData?.usedFor && (
              <span className="hidden group-hover:inline-block text-[9px] text-muted-foreground bg-black/60 px-1 py-0.5 rounded truncate max-w-[80px]" title={pageData.usedFor}>
                  {pageData.usedFor}
              </span>
          )}
        </div>
        {node.type === 'folder' && isExp && node.children && (
            <div>{node.children.map(c => renderNode(c, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="font-mono bg-black/40 rounded-lg border border-white/5 p-2 sm:p-3 min-h-[120px] sm:min-h-[200px] max-h-[200px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
      <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 flex items-center gap-1.5 sm:gap-2 uppercase tracking-wider font-semibold px-1 sm:px-2">
         <Folder className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Project Structure
      </div>
      {tree.length === 0 ? (
          <div className="text-center py-4 sm:py-8 text-muted-foreground text-[10px] sm:text-xs italic opacity-50">
              Waiting for files...
          </div>
      ) : tree.map(n => renderNode(n, 0))}
    </div>
  )
}


interface AIWebsiteBuilderProps {
  projectId: string
  generatedPages: GeneratedPage[]
  setGeneratedPages: React.Dispatch<React.SetStateAction<GeneratedPage[]>>
}

const AIWebsiteBuilder = ({ projectId, generatedPages, setGeneratedPages }: AIWebsiteBuilderProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [step, setStep] = useState<Step>("idle")
  const [currentPlan, setCurrentPlan] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Track which file is currently being worked on
  const [activeFile, setActiveFile] = useState<string | undefined>(undefined)

  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url?: string; githubUrl?: string } | null>(null)

  const [instruction, setInstruction] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState(MODELS[1])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => { scrollToBottom() }, [messages, currentPlan, step])

  const startGeneration = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setError(null)
    setStep("planning")
    setCurrentPlan("Architecting solution...")

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

    // Attempt to guess next file from instruction for UI feedback (optional, regex parse)
    // [1] src/main.ts
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
           // Replace or Add
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
    <div className="flex flex-col h-full bg-background text-foreground font-sans relative min-h-0">

      {/* HEADER - Improved mobile responsiveness */}
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <span className="font-semibold text-xs sm:text-sm hidden sm:inline-block">AI Architect</span>
        </div>

        <div className="flex items-center gap-2">
            {/* Generation Progress Indicator on Mobile */}
            {(step === 'planning' || step === 'coding') && (
                <div className="flex items-center gap-1.5 text-xs text-primary sm:hidden">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="max-w-[80px] truncate">{step === 'planning' ? 'Planning...' : 'Coding...'}</span>
                </div>
            )}
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 rounded-full border-white/10 bg-white/5 hover:bg-white/10">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 mr-1.5 sm:mr-2 animate-pulse" />
                    <span className="text-[10px] sm:text-xs max-w-[60px] sm:max-w-none truncate">{selectedModel.name}</span>
                    <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1 sm:ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {MODELS.map(model => (
                    <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model)}>
                       {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      {/* Error Display */}
      {error && (
          <div className="px-3 sm:px-4 py-2 bg-destructive/10 border-b border-destructive/20 shrink-0">
              <div className="flex items-center gap-2 text-destructive text-xs sm:text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{error}</span>
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto h-6 px-2 text-xs"
                      onClick={() => setError(null)}
                  >
                      Dismiss
                  </Button>
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

          {/* LEFT: VISUALIZATION & STATUS - Better mobile layout */}
          <div className={cn(
              "md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 overflow-y-auto shrink-0",
              step === 'idle' && generatedPages.length === 0 ? "hidden md:flex" : "flex max-h-[35vh] sm:max-h-[40vh] md:max-h-full"
          )}>
              <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blueprint</h3>
                      <div className="flex items-center gap-2">
                          {generatedPages.length > 0 && (
                              <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                                  {generatedPages.length} files
                              </span>
                          )}
                          {step !== 'idle' && step !== 'done' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                      </div>
                  </div>

                  {/* Dynamic File Tree with improved mobile styling */}
                  <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />

                  {/* Status Card - More compact on mobile */}
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-primary text-[11px] sm:text-xs font-medium">
                          <ActivityIcon step={step} />
                          <span className="truncate">{step === 'idle' ? 'Ready to build' : currentPlan}</span>
                      </div>
                      {activeFile && (
                          <div className="text-[9px] sm:text-[10px] text-muted-foreground font-mono bg-black/40 px-2 py-1 rounded truncate">
                              Writing: {activeFile}
                          </div>
                      )}
                  </div>
              </div>

              {/* Deployment Card - Compact on mobile */}
              {generatedPages.length > 0 && (
                  <div className="mt-auto pt-3 sm:pt-4 border-t border-white/5">
                      <Button
                          className="w-full text-[11px] sm:text-xs h-8 sm:h-9"
                          size="sm"
                          onClick={handleDeploy}
                          disabled={isDeploying || step === 'planning' || step === 'coding'}
                          variant={deploySuccess ? "outline" : "default"}
                      >
                          {isDeploying ? <Loader2 className="h-3 w-3 animate-spin mr-1.5 sm:mr-2" /> : <Rocket className="h-3 w-3 mr-1.5 sm:mr-2" />}
                          {deploySuccess ? "Deploy Again" : "Deploy to Cloudflare"}
                      </Button>

                      {deploySuccess && deployResult && (
                          <div className="mt-2 text-center space-y-1 animate-in fade-in">
                              <p className="text-[9px] sm:text-[10px] text-green-400 flex items-center justify-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Deployed!
                              </p>
                              {deployResult.url && (
                                  <a href={deployResult.url} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs text-primary hover:underline block truncate">
                                      {deployResult.url}
                                  </a>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>

          {/* RIGHT: CHAT & INPUT - Better mobile experience */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6 custom-scrollbar">
                  {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
                          <div className="relative mb-6">
                              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                              </div>
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-2">What shall we build?</h3>
                          <p className="text-xs sm:text-sm max-w-md text-muted-foreground mb-6">
                              Describe your vision and I'll create a complete Vite + TypeScript project ready for Cloudflare Pages.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                              <button 
                                  onClick={() => setInput("A modern portfolio for a photographer with dark theme and image gallery")}
                                  className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-muted-foreground"
                              >
                                  📷 Photographer portfolio
                              </button>
                              <button 
                                  onClick={() => setInput("A landing page for a SaaS startup with pricing section and features")}
                                  className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-muted-foreground"
                              >
                                  🚀 SaaS landing page
                              </button>
                              <button 
                                  onClick={() => setInput("A personal blog with minimalist design and code syntax highlighting")}
                                  className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-muted-foreground"
                              >
                                  ✍️ Developer blog
                              </button>
                              <button 
                                  onClick={() => setInput("A restaurant website with menu, location map and reservation form")}
                                  className="text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-muted-foreground"
                              >
                                  🍽️ Restaurant site
                              </button>
                          </div>
                      </div>
                  )}

                  {messages.map(msg => (
                      <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                          <div className={cn(
                              "max-w-[90%] sm:max-w-[85%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed",
                              msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted/30 border border-white/5 rounded-tl-sm backdrop-blur-sm"
                          )}>
                              {msg.role === 'assistant' && msg.plan && (
                                  <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-primary mb-2 uppercase tracking-wider">
                                      <BrainCircuit className="h-3 w-3" /> Strategy
                                  </div>
                              )}

                              {msg.code ? (
                                  <div className="flex items-center gap-2 sm:gap-3">
                                      <div className="h-7 w-7 sm:h-8 sm:w-8 bg-black/40 rounded flex items-center justify-center border border-white/10 shrink-0">
                                          <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                                      </div>
                                      <div className="min-w-0">
                                          <p className="font-mono text-[11px] sm:text-xs truncate">{msg.pageName}</p>
                                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">{msg.code.length} bytes</p>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                              )}
                          </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>

              {/* INPUT - Better mobile touch targets */}
              <div className="p-3 sm:p-4 border-t border-white/10 bg-background/80 backdrop-blur-md shrink-0">
                  <div className="relative max-w-3xl mx-auto">
                      <Input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && startGeneration()}
                          placeholder="Describe your vision..."
                          className="pr-11 sm:pr-12 h-11 sm:h-12 rounded-xl bg-white/5 border-white/10 focus-visible:ring-primary/50 text-sm"
                          disabled={step === 'planning' || step === 'coding'}
                      />
                      <Button
                          size="icon"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
                          onClick={startGeneration}
                          disabled={!input.trim() || step === 'planning' || step === 'coding'}
                      >
                          {step === 'planning' || step === 'coding' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                  </div>
              </div>
          </div>

      </div>
    </div>
  )
}

function ActivityIcon({ step }: { step: Step }) {
    if (step === 'planning') return <BrainCircuit className="h-4 w-4 animate-pulse" />
    if (step === 'coding') return <Terminal className="h-4 w-4 animate-pulse" />
    if (step === 'done') return <CheckCircle2 className="h-4 w-4" />
    return <Sparkles className="h-4 w-4" />
}

export default AIWebsiteBuilder
