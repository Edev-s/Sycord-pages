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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Updated Models List to include "Gemini 3 Flash" (mapped to 2.0 or 1.5 in backend) as requested
const MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-3-flash", name: "Gemini 3 Flash (Preview)", provider: "Google" }, // Added for user
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
            status: isFile ? status : 'done' // Folders are always 'done' if they exist
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

    // Sort
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
            "flex items-center gap-2 py-1 px-2 text-xs rounded hover:bg-white/5 cursor-pointer select-none transition-colors",
            isGenerating && "bg-blue-500/10 text-blue-400 animate-pulse",
            node.status === 'done' && node.type === 'file' && "text-green-400/80"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
              if (node.type === 'folder') {
                  setExpanded(p => ({...p, [node.path]: !isExp}))
              }
          }}
        >
          {node.type === 'folder' && (
              <ChevronRight className={cn("h-3 w-3 transition-transform text-muted-foreground", isExp && "rotate-90")} />
          )}
          {node.type === 'file' && <span className="w-3" />}

          <Icon className={cn(
              "h-3.5 w-3.5",
              node.type === 'folder' ? "text-yellow-500/80" : "text-blue-400/80",
              isGenerating && "text-blue-400"
          )} />

          <span className="truncate flex-1">{node.name}</span>

          {isGenerating && <Loader2 className="h-3 w-3 animate-spin text-blue-400" />}
          {node.status === 'done' && node.type === 'file' && <Check className="h-3 w-3 text-green-500/50" />}
        </div>
        {node.type === 'folder' && isExp && node.children && (
            <div>{node.children.map(c => renderNode(c, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="font-mono bg-black/40 rounded-lg border border-white/5 p-3 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2 uppercase tracking-wider font-semibold px-2">
         <Folder className="h-3 w-3" /> Project Structure
      </div>
      {tree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs italic opacity-50">
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
  autoFixLogs?: string[] | null
}

const AIWebsiteBuilder = ({ projectId, generatedPages, setGeneratedPages, autoFixLogs }: AIWebsiteBuilderProps) => {
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
  const [selectedModel, setSelectedModel] = useState(MODELS[0]) // Default to Gemini 2.0 Flash

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  // Track auto-fix history locally
  const [fixHistory, setFixHistory] = useState<any[]>([])

  useEffect(() => { scrollToBottom() }, [messages, currentPlan, step])

  // Trigger Auto Fix if logs are provided
  useEffect(() => {
    if (autoFixLogs && autoFixLogs.length > 0 && step === 'idle') {
      startAutoFixSession(autoFixLogs)
    }
  }, [autoFixLogs])

  const startAutoFixSession = async (logs: string[]) => {
    setStep("fixing")
    setCurrentPlan("Analyzing logs...")
    setFixHistory([]) // Reset history for new session

    const logMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: "Deployment failed with the following logs. Starting automated diagnosis and repair...",
      isErrorLog: true
    }

    // Show only last 20 logs in chat to avoid clutter
    const visibleLogs = logs.slice(-20).join('\n')
    const logsDisplayMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "user",
      content: `Here are the error logs:\n\`\`\`\n${visibleLogs}\n\`\`\``
    }

    setMessages(prev => [...prev, logMessage, logsDisplayMessage])

    // Start the fix loop
    await processAutoFix(logs, [], 0)
  }

  const processAutoFix = async (logs: string[], history: any[], iteration: number) => {
    if (iteration >= 5) {
       setStep("idle")
       setMessages(prev => [...prev, {
         id: Date.now().toString(),
         role: "system",
         content: "Auto-fix session stopped after maximum attempts. Please review manually."
       }])
       return
    }

    try {
       // Prepare context
       const fileStructure = generatedPages.map(p => p.name).join('\n')

       // Find if we need to send file content (based on last history item)
       let fileContent = null
       let lastAction = null

       if (history.length > 0) {
         const lastItem = history[history.length - 1]
         lastAction = lastItem.action === 'read' ? 'take a look' : null // Map back to prompt keyword
         if (lastItem.action === 'read' && lastItem.result && lastItem.result.code) {
           fileContent = {
             filename: lastItem.target,
             code: lastItem.result.code
           }
         }
       }

       const response = await fetch('/api/ai/auto-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs,
            fileStructure,
            fileContent,
            lastAction,
            history: history.map(h => ({ action: h.action, target: h.target, result: h.result.status || 'done' })) // Send simplified history
          })
       })

       if (!response.ok) throw new Error("AI Fix request failed")
       const result = await response.json()

       // Add Assistant Message explaining what it's doing
       if (result.explanation) {
         setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: result.explanation
         }])
       }

       if (result.action === 'done') {
          setStep("idle")
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "I believe I have fixed the issues. Please try deploying again."
          }])
          return
       }

       // Execute Action
       let actionResult: any = { status: 'success' }

       if (result.action === 'read') {
          setCurrentPlan(`Reading ${result.targetFile}...`)
          const page = generatedPages.find(p => p.name === result.targetFile)
          if (page) {
             actionResult = { status: 'success', code: page.code }
             // We don't necessarily show the whole file in chat, maybe just a note
          } else {
             actionResult = { status: 'error', message: 'File not found' }
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
             // Sync DB - Delete old, Create new (or just update if API supported move, but recreate is safer for now)
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
       }
       else if (result.action === 'write') {
          setCurrentPlan(`Fixing ${result.targetFile}...`)
          // Update State
          setGeneratedPages(prev => {
             const exists = prev.find(p => p.name === result.targetFile)
             if (exists) {
                return prev.map(p => p.name === result.targetFile ? { ...p, code: result.code, timestamp: Date.now() } : p)
             } else {
                return [...prev, { name: result.targetFile, code: result.code, timestamp: Date.now(), usedFor: 'Auto-fix' }]
             }
          })

          // Update DB
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
       }

       // Update History
       const newHistory = [...history, {
          action: result.action,
          target: result.targetFile,
          result: actionResult
       }]

       setFixHistory(newHistory)

       // Next Iteration
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
    <div className="flex flex-col h-full bg-background text-foreground font-sans relative">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10 bg-background/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm hidden md:inline-block">AI Architect</span>
        </div>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-full border-white/10 bg-white/5 hover:bg-white/10">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                <span className="text-xs">{selectedModel.name}</span>
                <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
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

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* LEFT: VISUALIZATION & STATUS (Hidden on small mobile when idle, visible when active) */}
          <div className={cn(
              "md:w-1/3 border-r border-white/10 bg-black/20 p-4 flex flex-col gap-4 overflow-y-auto",
              step === 'idle' && generatedPages.length === 0 ? "hidden md:flex" : "flex h-1/2 md:h-full order-1 md:order-1"
          )}>
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blueprint</h3>
                      {step !== 'idle' && step !== 'done' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  </div>

                  {/* Dynamic File Tree */}
                  <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />

                  {/* Integrated Status Indicator (Less like a popup) */}
                  <div className={cn(
                      "rounded-lg p-3 space-y-2 transition-all duration-300",
                      step === 'idle' ? "bg-transparent" : "bg-primary/5 border border-primary/10"
                  )}>
                      <div className="flex items-center gap-2 text-primary text-xs font-medium">
                          <ActivityIcon step={step} />
                          <span>{step === 'idle' ? 'Ready to build' : currentPlan}</span>
                      </div>
                      {activeFile && (
                          <div className="text-[10px] text-muted-foreground font-mono bg-black/40 px-2 py-1 rounded">
                              Writing: {activeFile}
                          </div>
                      )}
                  </div>
              </div>

              {/* Deployment Card */}
              {generatedPages.length > 0 && (
                  <div className="mt-auto pt-4 border-t border-white/5">
                      <Button
                          className="w-full text-xs"
                          size="sm"
                          onClick={handleDeploy}
                          disabled={isDeploying || step === 'planning' || step === 'coding' || step === 'fixing'}
                          variant={deploySuccess ? "outline" : "default"}
                      >
                          {isDeploying ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Rocket className="h-3 w-3 mr-2" />}
                          {deploySuccess ? "Deploy Again" : "Deploy to Cloudflare"}
                      </Button>

                      {deploySuccess && deployResult && (
                          <div className="mt-2 text-center space-y-1 animate-in fade-in">
                              <p className="text-[10px] text-green-400 flex items-center justify-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Deployed!
                              </p>
                              {deployResult.url && (
                                  <a href={deployResult.url} target="_blank" className="text-xs text-primary hover:underline block truncate">
                                      {deployResult.url}
                                  </a>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>

          {/* RIGHT: CHAT & INPUT */}
          <div className="flex-1 flex flex-col h-1/2 md:h-full order-2 md:order-2">
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
                          <Sparkles className="h-12 w-12 mb-4" />
                          <h3 className="text-lg font-medium">What shall we build?</h3>
                          <p className="text-sm max-w-xs mt-2">e.g., "A modern portfolio for a photographer with a dark theme and gallery grid."</p>
                      </div>
                  )}

                  {messages.map(msg => (
                      <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
                          {msg.role === 'assistant' && msg.plan && generatedPages.length > 0 && (
                            <div className="md:hidden w-full mb-2 bg-black/20 rounded-lg border border-white/10 p-2 overflow-hidden">
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 px-1">
                                    Project Structure
                                </div>
                                <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />
                            </div>
                          )}

                          {msg.isErrorLog ? (
                             <div className="w-full max-w-[85%] bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl px-4 py-3 text-sm flex items-start gap-3">
                                <Bug className="h-5 w-5 shrink-0" />
                                <div>{msg.content}</div>
                             </div>
                          ) : (
                            <div className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-sm" :
                                msg.role === 'system' ? "bg-muted text-muted-foreground rounded-2xl text-center w-full max-w-none text-xs" :
                                "bg-muted/30 border border-white/5 rounded-tl-sm backdrop-blur-sm"
                            )}>
                                {msg.role === 'assistant' && msg.plan && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2 uppercase tracking-wider">
                                        <BrainCircuit className="h-3 w-3" /> Strategy
                                    </div>
                                )}

                                {msg.code ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-black/40 rounded flex items-center justify-center border border-white/10">
                                            <FileCode className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-xs">{msg.pageName}</p>
                                            <p className="text-[10px] text-muted-foreground">{msg.code.length} bytes</p>
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

              {/* INPUT */}
              <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-md">
                  <div className="relative max-w-3xl mx-auto">
                      <Input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && startGeneration()}
                          placeholder="Describe your vision..."
                          className="pr-12 h-12 rounded-xl bg-white/5 border-white/10 focus-visible:ring-primary/50"
                          disabled={step === 'planning' || step === 'coding' || step === 'fixing'}
                      />
                      <Button
                          size="icon"
                          className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg"
                          onClick={startGeneration}
                          disabled={!input.trim() || step === 'planning' || step === 'coding' || step === 'fixing'}
                      >
                          {step === 'planning' || step === 'coding' || step === 'fixing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
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
    if (step === 'fixing') return <Bug className="h-4 w-4 animate-pulse" />
    if (step === 'done') return <CheckCircle2 className="h-4 w-4" />
    return <Sparkles className="h-4 w-4" />
}

export default AIWebsiteBuilder
