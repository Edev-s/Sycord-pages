"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  ListTodo,
  BrainCircuit,
  CheckCircle2,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  Code,
  AlertCircle,
  Bug,
  Layout,
  Menu,
  PanelRight,
  X
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
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// Updated Models List
const MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
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
    <div className="font-mono bg-transparent pt-2 overflow-y-auto custom-scrollbar">
      {tree.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-xs italic">
              No files yet
          </div>
      ) : tree.map(n => renderNode(n, 0))}
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  const [fixHistory, setFixHistory] = useState<any[]>([])
  const [isFilesOpen, setIsFilesOpen] = useState(false)

  useEffect(() => { scrollToBottom() }, [messages, currentPlan, step])

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

       // Get list of fixed files to pass to API
       const fixedFiles = history
          .filter(h => h.action === 'write' || h.action === 'fix')
          .map(h => h.target)
          .filter((v, i, a) => a.indexOf(v) === i) // Unique

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
          setShowAutoDeploy(true) // Offer auto-deploy
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "I have fixed the issues. Ready to deploy."
          }])
          return
       }

       let actionResult: any = { status: 'success' }
       let actionSummary = ""

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
             setGeneratedPages(prev => prev.map(p => p.name === result.targetFile ? { ...p, name: newName } : p))
             await fetch(`/api/projects/${projectId}/pages?name=${encodeURIComponent(result.targetFile)}`, { method: "DELETE" })
             await fetch(`/api/projects/${projectId}/pages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, content: page.code, usedFor: page.usedFor })
             })

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
          setGeneratedPages(prev => {
             const exists = prev.find(p => p.name === result.targetFile)
             if (exists) {
                return prev.map(p => p.name === result.targetFile ? { ...p, code: result.code, timestamp: Date.now() } : p)
             } else {
                return [...prev, { name: result.targetFile, code: result.code, timestamp: Date.now(), usedFor: 'Auto-fix' }]
             }
          })

          await fetch(`/api/projects/${projectId}/pages`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ name: result.targetFile, content: result.code, usedFor: 'Auto-fix' })
          })

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
    setInput("")
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

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm hidden md:inline-block tracking-tight">AI Editor</span>

            {(step !== 'idle' && step !== 'done') && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-zinc-300 animate-in fade-in">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{activeFile ? `Generating ${activeFile}...` : currentPlan}</span>
                </div>
            )}
        </div>

        <div className="flex items-center gap-2">
            {/* File Tree Trigger (Desktop + Mobile) */}
            <Sheet open={isFilesOpen} onOpenChange={setIsFilesOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-white gap-2">
                        <PanelRight className="h-4 w-4" />
                        <span className="hidden sm:inline">Project Files</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-zinc-950 border-l-white/10 w-80 p-0 sm:max-w-sm">
                    <SheetHeader className="p-4 border-b border-white/5">
                        <SheetTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-zinc-400" />
                            Project Structure
                        </SheetTitle>
                    </SheetHeader>
                    <div className="p-4">
                        <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />
                    </div>
                </SheetContent>
            </Sheet>

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
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                    {selectedModel.name}
                    <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-300">
                {MODELS.map(model => (
                    <DropdownMenuItem key={model.id} onClick={() => setSelectedModel(model)} className="hover:bg-white/5 focus:bg-white/5">
                    {model.name}
                    </DropdownMenuItem>
                ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

          {/* MAIN CHAT AREA (FULL WIDTH) */}
          <div className="flex-1 flex flex-col h-full bg-zinc-950 relative z-10">
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24 md:pb-4">
                  {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-8 select-none">
                          <Sparkles className="h-10 w-10 mb-4 text-white" />
                          <h3 className="text-base font-medium text-white">What shall we build?</h3>
                      </div>
                  )}

                  {messages.map(msg => (
                      <div key={msg.id} className={cn("flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto w-full", msg.role === 'user' ? "items-end" : "items-start")}>

                          {msg.isErrorLog ? (
                             <div className="w-full bg-red-500/10 border border-red-500/20 text-red-200/80 rounded-2xl px-5 py-4 text-xs font-mono flex items-start gap-3">
                                <Bug className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                                <div className="overflow-x-auto whitespace-pre-wrap">{msg.content}</div>
                             </div>
                          ) : (
                            <div className={cn(
                                "max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                                msg.role === 'user' ? "bg-zinc-100 text-zinc-900 rounded-tr-sm font-medium" :
                                msg.role === 'system' ? "bg-zinc-900/50 border border-white/5 text-zinc-400 text-center w-full max-w-none text-xs py-2" :
                                "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm backdrop-blur-sm"
                            )}>
                                {msg.role === 'assistant' && msg.plan && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                                        <BrainCircuit className="h-3 w-3" /> Strategy
                                    </div>
                                )}

                                {msg.code ? (
                                    <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-1 -m-1 rounded transition-colors" onClick={() => setIsFilesOpen(true)}>
                                        <div className="h-10 w-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 text-zinc-400 group-hover:text-white group-hover:border-white/10 transition-all">
                                            <FileCode className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-xs text-zinc-200 group-hover:text-white transition-colors">{msg.pageName}</p>
                                            <p className="text-[10px] text-zinc-500">{msg.code.length} bytes • Updated</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                )}
                            </div>
                          )}
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                  <div className="relative max-w-3xl mx-auto">
                      {(step !== 'idle' && step !== 'done') && (
                         <div className="absolute -top-12 left-0 right-0 flex justify-center md:hidden">
                            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 backdrop-blur rounded-full border border-white/10 text-[10px] text-zinc-300 animate-pulse shadow-lg">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>{activeFile ? `Generating ${activeFile}...` : currentPlan}</span>
                            </div>
                         </div>
                      )}

                      <Input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && startGeneration()}
                          placeholder="Describe changes or new features..."
                          className="pr-12 h-14 rounded-2xl bg-zinc-900/50 border-white/5 focus-visible:ring-1 focus-visible:ring-white/20 text-base placeholder:text-zinc-600 shadow-lg"
                          disabled={step === 'planning' || step === 'coding' || step === 'fixing'}
                      />
                      <Button
                          size="icon"
                          className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors"
                          onClick={startGeneration}
                          disabled={!input.trim() || step === 'planning' || step === 'coding' || step === 'fixing'}
                      >
                          {step === 'planning' || step === 'coding' || step === 'fixing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                      </Button>
                  </div>
              </div>
          </div>

      </div>
    </div>
  )
}

function ActivityIcon({ step }: { step: Step }) {
    if (step === 'planning') return <BrainCircuit className="h-4 w-4" />
    if (step === 'coding') return <Terminal className="h-4 w-4" />
    if (step === 'fixing') return <Bug className="h-4 w-4" />
    if (step === 'done') return <CheckCircle2 className="h-4 w-4" />
    return <Sparkles className="h-4 w-4" />
}

export default AIWebsiteBuilder
