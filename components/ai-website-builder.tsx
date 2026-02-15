"use client"

import { useState, useRef, useEffect } from "react"
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
  CheckCircle2,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  Bug,
  Layout,
  Brain
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

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
    <div className="font-mono bg-black/20 rounded-xl border border-white/5 p-3 h-full overflow-y-auto custom-scrollbar">
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

  const [instruction, setInstruction] = useState<string>("")
  const [planExpanded, setPlanExpanded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  const [fixHistory, setFixHistory] = useState<any[]>([])

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
          // Removed explicit model selection, API now enforces it
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

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden">

      {/* MINIMAL HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-200">AI Editor</span>

            {/* Status Indicator */}
            {(step !== 'idle' && step !== 'done') && (
                <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                    <span className="text-[10px] text-blue-300 font-mono uppercase tracking-wider">{step}</span>
                </div>
            )}
        </div>

        <div className="flex items-center gap-2">
            {/* File Tree Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-white">
                  <Layout className="h-4 w-4 mr-2" /> Files
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-zinc-950 border-l-white/10 w-80 pt-10">
                 <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />
              </SheetContent>
            </Sheet>

            {/* Deploy Button */}
            {generatedPages.length > 0 && (
                <Button
                    size="sm"
                    className={cn(
                        "h-8 transition-all",
                        deploySuccess ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white text-black hover:bg-zinc-200"
                    )}
                    onClick={handleDeploy}
                    disabled={isDeploying || (step !== 'idle' && step !== 'done')}
                >
                    {isDeploying ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : deploySuccess ? <CheckCircle2 className="h-3 w-3 mr-2" /> : <Rocket className="h-3 w-3 mr-2" />}
                    {deploySuccess ? "Live" : "Deploy"}
                </Button>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* CHAT AREA (Full Width) */}
          <div className="flex-1 flex flex-col h-full bg-zinc-950 relative z-10">

              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24 md:pb-4 max-w-5xl mx-auto w-full">
                  {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none opacity-50">
                          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <Sparkles className="h-8 w-8 text-zinc-500" />
                          </div>
                          <h3 className="text-lg font-medium text-zinc-300 mb-2">Gemini 3 Pro Preview</h3>
                          <p className="text-sm text-zinc-500 max-w-sm">
                            Powered by RAG & Database. Describe your website to begin generation.
                          </p>
                      </div>
                  )}

                  {messages.map(msg => (
                      <div key={msg.id} className={cn("flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500", msg.role === 'user' ? "items-end" : "items-start")}>
                          {msg.isErrorLog ? (
                             <div className="w-full max-w-[90%] md:max-w-[80%] bg-red-500/10 border border-red-500/20 text-red-200/80 rounded-2xl px-5 py-4 text-xs font-mono flex items-start gap-3">
                                <Bug className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                                <div className="overflow-x-auto whitespace-pre-wrap">{msg.content}</div>
                             </div>
                          ) : (
                            <div className={cn(
                                "max-w-[90%] md:max-w-[80%] rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-sm",
                                msg.role === 'user' ? "bg-zinc-100 text-zinc-900 rounded-tr-sm font-medium" :
                                msg.role === 'system' ? "bg-zinc-900/50 border border-white/5 text-zinc-500 text-center w-full max-w-none text-xs py-2" :
                                "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm backdrop-blur-sm"
                            )}>
                                {msg.role === 'assistant' && msg.plan ? (
                                    <div>
                                      <button
                                        onClick={() => setPlanExpanded(p => !p)}
                                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors w-full"
                                      >
                                        <Brain className="h-3 w-3" />
                                        <span>Architecture Plan</span>
                                        <ChevronRight className={cn("h-3 w-3 ml-auto transition-transform", planExpanded && "rotate-90")} />
                                      </button>
                                      {planExpanded && (
                                        <div className="mt-4 text-xs text-zinc-500 whitespace-pre-wrap border-t border-white/5 pt-4 font-mono">
                                          {msg.content}
                                        </div>
                                      )}
                                    </div>
                                ) : null}

                                {!msg.plan && msg.code ? (
                                    <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors">
                                        <div className="h-10 w-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 text-zinc-400 group-hover:text-white group-hover:border-white/10 transition-all shrink-0">
                                            <FileCode className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono text-xs text-zinc-200 group-hover:text-white transition-colors truncate">{msg.pageName}</p>
                                            <p className="text-[10px] text-zinc-500">{(msg.code.length / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <CheckCircle2 className="h-4 w-4 text-green-500/50 ml-auto shrink-0" />
                                    </div>
                                ) : !msg.plan ? (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                ) : null}
                            </div>
                          )}
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                  <div className="relative max-w-3xl mx-auto">
                      <Input
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && startGeneration()}
                          placeholder="What shall we build with Gemini 3 Pro?"
                          className="pr-14 h-16 rounded-2xl bg-zinc-900/50 border-white/5 focus-visible:ring-1 focus-visible:ring-white/20 text-base placeholder:text-zinc-600 shadow-xl pl-6"
                          disabled={step === 'planning' || step === 'coding' || step === 'fixing'}
                      />
                      <Button
                          size="icon"
                          className="absolute right-3 top-3 h-10 w-10 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors shadow-lg"
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

export default AIWebsiteBuilder
