"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Bug,
  Menu,
  Info,
  Paperclip,
  Send,
  Save,
  BrainCircuit
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Updated Models List
const MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "gemini-3-flash", name: "Gemini 3 Flash (Preview)", provider: "Google" },
  { id: "deepseek-v3.2-exp", name: "DeepSeek V3", provider: "DeepSeek" },
]

// Gemini Icon Component
const GeminiIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 2C12.5 7.5 16.5 11.5 22 12C16.5 12.5 12.5 16.5 12 22C11.5 16.5 7.5 12.5 2 12C7.5 11.5 11.5 7.5 12 2Z"
      fill="url(#gemini-gradient)"
    />
    <defs>
      <linearGradient
        id="gemini-gradient"
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#4facfe" />
        <stop offset="1" stopColor="#00f2fe" />
      </linearGradient>
    </defs>
  </svg>
)

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
    <div className="font-mono bg-black/20 rounded-xl border border-white/5 p-3 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar">
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

// --- NEW PLAN DISPLAY COMPONENT ---
const PlanDisplay = ({ instruction, step, currentFile }: { instruction: string, step: Step, currentFile?: string }) => {
    const { mainPlan, files, pages } = useMemo(() => {
        const mainPlanMatch = instruction.match(/\[0\]\s*([\s\S]*?)(?=\[\d+\]|$)/);
        const mainPlan = mainPlanMatch ? mainPlanMatch[1].trim() : "";

        const files: { number: string, name: string, usage: string, isDone: boolean }[] = [];
        const pages: { name: string, usage: string }[] = [];

        const fileRegex = /\[(\d+|Done)\]\s*([^\s:\]]+)(?:\s*[:\-]?\s*(?:\[usedfor\](.*?)\[usedfor\])?)?/g;
        let match;
        while ((match = fileRegex.exec(instruction)) !== null) {
            if (match[1] === "0") continue;

            const isDone = match[1].toLowerCase() === "done";
            const name = match[2];
            const usage = match[3] || "";

            files.push({
                number: match[1],
                name,
                usage,
                isDone
            });

            // Extract "pages" for the "How pages is used" section
            // Heuristic: If it's in src/components or src/pages, consider it a "page" concept
            if (name.includes('src/components/') && !name.includes('ui/') && !name.includes('layout')) {
                const shortName = name.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || name;
                // Capitalize first letter
                const formattedName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
                pages.push({ name: formattedName, usage: usage });
            }
        }
        return { mainPlan, files, pages };
    }, [instruction]);

    // Show skeleton if planning and no instruction yet
    if (step === 'planning' && !instruction) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-6">
                    <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
                    <span className="text-zinc-400 text-sm font-medium">Thinking</span>
                </div>
                <div className="pl-6 border-l-2 border-zinc-800 space-y-8 opacity-50">
                     <div className="space-y-3">
                        <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                        <div className="h-16 w-full bg-zinc-900 rounded animate-pulse" />
                     </div>
                     <div className="space-y-3">
                        <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-3 w-3/4 bg-zinc-900 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-zinc-900 rounded animate-pulse" />
                        </div>
                     </div>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Thinking Header */}
            <div className="flex items-center gap-3 mb-6">
                <Brain className={cn("h-5 w-5", step === 'planning' ? "text-blue-400 animate-pulse" : "text-zinc-600")} />
                <span className="text-zinc-400 text-sm font-medium">Thinking</span>
            </div>

            {/* Plan Card */}
            <div className="relative pl-6 border-l-2 border-zinc-800 space-y-8">

                {/* 1. Main Plan */}
                <div className="relative group">
                    <div className="absolute -left-[31px] top-0 bg-zinc-900 rounded-full p-1 border border-zinc-800">
                        {mainPlan ? <CheckCircle2 className="h-4 w-4 text-blue-500" /> : <div className="h-4 w-4 rounded-full bg-zinc-800" />}
                    </div>
                    <h3 className="text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                        <Check className={cn("h-3 w-3", mainPlan ? "text-blue-500" : "text-zinc-600")} />
                        What is the main plan?
                    </h3>
                    <div className="text-zinc-500 text-xs leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                        {mainPlan || "Analyzing request..."}
                    </div>
                </div>

                {/* 2. Page Usage */}
                {pages.length > 0 && (
                    <div className="relative group">
                         <div className="absolute -left-[31px] top-0 bg-zinc-900 rounded-full p-1 border border-zinc-800">
                            <CheckCircle2 className="h-4 w-4 text-purple-500" />
                        </div>
                        <h3 className="text-zinc-300 text-sm font-medium mb-3 flex items-center gap-2">
                             <Check className="h-3 w-3 text-purple-500" />
                             How pages are used?
                        </h3>
                        <div className="space-y-2">
                            {pages.map((page, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                    <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 mt-0.5">
                                        {page.name}/
                                    </span>
                                    <span className="text-zinc-500 line-clamp-2">
                                        {page.usage}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Build List */}
                <div className="relative group">
                     <div className="absolute -left-[31px] top-0 bg-zinc-900 rounded-full p-1 border border-zinc-800">
                        {step === 'done' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full bg-zinc-800 animate-pulse" />}
                    </div>
                    <h3 className="text-zinc-300 text-sm font-medium mb-3 flex items-center gap-2">
                        <Check className={cn("h-3 w-3", step === 'done' ? "text-green-500" : "text-zinc-600")} />
                        What to build?
                    </h3>
                    <div className="space-y-1.5">
                        {files.map((file, idx) => (
                             <div key={idx} className="flex items-center gap-2 text-xs group/file">
                                 {file.isDone ? (
                                     <Check className="h-3 w-3 text-green-500 shrink-0" />
                                 ) : file.name === currentFile ? (
                                     <Loader2 className="h-3 w-3 text-blue-400 animate-spin shrink-0" />
                                 ) : (
                                     <div className="h-1.5 w-1.5 rounded-full bg-zinc-800 shrink-0" />
                                 )}
                                 <span className={cn(
                                     "font-mono transition-colors",
                                     file.isDone ? "text-zinc-500 line-through" :
                                     file.name === currentFile ? "text-blue-300" : "text-zinc-500 group-hover/file:text-zinc-400"
                                 )}>
                                     {file.name}
                                 </span>
                             </div>
                        ))}
                        {files.length === 0 && (
                            <span className="text-zinc-600 text-xs italic">Waiting for plan...</span>
                        )}
                    </div>
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

  const [planExpanded, setPlanExpanded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

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
          // Send all previously generated files so the AI has full cross-file context
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

  const { done, total, percent } = getProgress()

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans relative overflow-hidden">

      {/* MOBILE HEADER (Gemini Style) */}
      <div className="md:hidden flex items-center justify-between px-4 pt-6 pb-2 relative z-20">
         <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="text-zinc-400">
                 <Menu className="h-5 w-5" />
             </Button>
             <span className="text-lg font-medium text-white">Ok</span>
         </div>
         <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="text-zinc-400">
                 <Save className="h-5 w-5" />
             </Button>
             <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-medium">
                 {session?.user?.name?.[0] || 'D'}
             </div>
         </div>
      </div>

      {/* State of Art Badge */}
      <div className="md:hidden flex justify-center pb-4 relative z-20">
         <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 shadow-lg">
            <Sparkles className="h-3 w-3 text-blue-400 fill-blue-400" />
            <span className="text-xs font-medium text-zinc-300">State of the Art</span>
            <Info className="h-3 w-3 text-zinc-600" />
         </div>
      </div>

      {/* DESKTOP HEADER */}
      <div className="hidden md:flex items-center justify-between px-4 py-3 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm hidden md:inline-block tracking-tight">AI Editor</span>
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

          {/* MOBILE CONTENT AREA */}
          <div className="md:hidden flex-1 flex flex-col relative z-10 px-6 overflow-y-auto pb-32">

              {/* IDLE STATE */}
              {step === 'idle' && (
                <div className="flex-1 flex flex-col justify-center items-center text-center mt-20">
                   <h1 className="text-3xl font-medium tracking-tight text-foreground leading-tight max-w-xs mx-auto animate-in fade-in duration-500">
                     Hi <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold">{session?.user?.name?.split(' ')[0] || 'User'}</span>, What are we building?
                   </h1>
                </div>
              )}

              {/* ACTIVE STATE (Thinking/Building/Done) */}
              {(step === 'planning' || step === 'coding' || step === 'fixing' || step === 'done') && (
                 <div className="flex-1 mt-4">
                     <PlanDisplay instruction={instruction} step={step} currentFile={activeFile} />
                 </div>
              )}
          </div>

          {/* FLOATING INPUT CARD (Mobile) */}
          <div className="md:hidden absolute bottom-6 left-0 right-0 px-4 transition-all duration-700 ease-out z-30">
             <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-[2rem] p-3 shadow-2xl mx-auto max-w-md">
                <p className="text-[10px] text-zinc-500 ml-4 mb-2 font-bold tracking-widest uppercase opacity-80">WHAT TO BUILD?</p>
                <div className="flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                      <Paperclip className="h-5 w-5" />
                   </Button>
                   <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && startGeneration()}
                      placeholder=""
                      className="flex-1 bg-transparent border-none h-10 px-2 focus-visible:ring-0 text-white placeholder-zinc-600 text-base font-medium"
                      disabled={step === 'planning' || step === 'coding' || step === 'fixing'}
                   />
                   <Button
                      size="icon"
                      className={cn("h-10 w-10 rounded-full transition-all duration-300", input.trim() ? "bg-zinc-200 text-black hover:bg-white" : "bg-zinc-800 text-zinc-500")}
                      onClick={startGeneration}
                      disabled={!input.trim() || step === 'planning' || step === 'coding' || step === 'fixing'}
                   >
                      {step === 'planning' || step === 'coding' || step === 'fixing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                   </Button>
                </div>
             </div>
          </div>

          {/* LEFT: VISUALIZATION & STATUS (Desktop Only) */}
          <div className="hidden md:flex md:w-80 lg:w-96 border-r border-white/5 bg-black/20 p-4 flex-col gap-4 overflow-y-auto">
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Blueprint</h3>
                      {(step !== 'idle' && step !== 'done') && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
                  </div>

                  <FileTreeVisualizer pages={generatedPages} currentFile={activeFile} />

                  <div className={cn(
                      "rounded-xl p-4 space-y-2 transition-all duration-500 border",
                      step === 'idle' ? "bg-transparent border-transparent" : "bg-white/5 border-white/10"
                  )}>
                      <div className="flex items-center gap-3 text-zinc-200 text-xs font-medium">
                          <div className={cn("p-1.5 rounded-md bg-white/10", (step !== "idle" && step !== "done") && "animate-pulse")}>
                             <ActivityIcon step={step} />
                          </div>
                          <span>{step === 'idle' ? 'Ready to build' : step === 'planning' ? 'Thinking...' : step === 'coding' ? 'Creating...' : step === 'fixing' ? 'Fixing...' : step === 'done' ? 'Finished' : currentPlan}</span>
                      </div>
                      {activeFile && (
                          <div className="text-[10px] text-zinc-500 font-mono pl-9">
                              Writing: {activeFile}
                          </div>
                      )}
                  </div>
              </div>

              {generatedPages.length > 0 && (
                  <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                      <Button
                          className="w-full text-xs h-9 bg-zinc-100 text-zinc-900 hover:bg-zinc-300 border-none"
                          size="sm"
                          onClick={handleDeploy}
                          disabled={isDeploying || (step !== 'idle' && step !== 'done')}
                      >
                          {isDeploying ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Rocket className="h-3 w-3 mr-2" />}
                          {deploySuccess ? "Deploy Again" : "Deploy to Cloudflare"}
                      </Button>

                      {deploySuccess && deployResult && (
                          <div className="text-center space-y-1 animate-in fade-in slide-in-from-bottom-2">
                              <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="h-3 w-3 text-white" /> Live
                              </p>
                              {deployResult.url && (
                                  <a href={deployResult.url} target="_blank" className="text-xs text-white hover:underline block truncate opacity-80 hover:opacity-100">
                                      {deployResult.url}
                                  </a>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>

          {/* RIGHT: CHAT & INPUT (Desktop Only) */}
          <div className="hidden md:flex flex-1 flex-col h-full bg-background relative z-10">

              {/* Progress Bar */}
              {(step === 'coding' || step === 'planning') && (() => {
                const { done, total, percent } = getProgress()
                return (
                  <div className="px-4 py-2 border-b border-white/5 bg-background/80 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/80 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                      {step === 'planning' ? 'Planning...' : `${done}/${total} files`}
                    </span>
                    {activeFile && step === 'coding' && (
                      <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">
                        {activeFile}
                      </span>
                    )}
                  </div>
                )
              })()}

              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24 md:pb-4">
                  {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                            <Sparkles className="h-6 w-6 text-zinc-400" />
                          </div>
                          <h3 className="text-base font-medium text-zinc-300 mb-1">What shall we build?</h3>
                          <p className="text-xs text-zinc-600 mb-6 max-w-xs">Describe your website and the AI will plan the architecture, generate connected TypeScript files, and deploy it.</p>
                          <div className="flex flex-wrap gap-2 justify-center max-w-md">
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
                          </div>
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
                                "max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                                msg.role === 'user' ? "bg-zinc-100 text-zinc-900 rounded-tr-sm font-medium" :
                                msg.role === 'system' ? "bg-zinc-900/50 border border-white/5 text-zinc-400 text-center w-full max-w-none text-xs py-2" :
                                "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm backdrop-blur-sm"
                            )}>
                                {msg.role === 'assistant' && msg.plan ? (
                                    <div>
                                      <button
                                        onClick={() => setPlanExpanded(p => !p)}
                                        className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors w-full"
                                      >
                                        <BrainCircuit className="h-3 w-3" />
                                        <span>Architecture Plan</span>
                                        <span className="text-zinc-600 font-normal normal-case">
                                          ({(msg.content.match(/\[\d+\]/g) || []).length} files)
                                        </span>
                                        <ChevronRight className={cn("h-3 w-3 ml-auto transition-transform", planExpanded && "rotate-90")} />
                                      </button>
                                      {planExpanded && (
                                        <div className="mt-2 text-xs text-zinc-500 whitespace-pre-wrap border-t border-white/5 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                          {msg.content}
                                        </div>
                                      )}
                                    </div>
                                ) : null}

                                {!msg.plan && msg.code ? (
                                    <div className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-1 -m-1 rounded-lg transition-colors">
                                        <div className="h-10 w-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 text-zinc-400 group-hover:text-white group-hover:border-white/10 transition-all shrink-0">
                                            <FileCode className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono text-xs text-zinc-200 group-hover:text-white transition-colors truncate">{msg.pageName}</p>
                                            <p className="text-[10px] text-zinc-500">{(msg.code.length / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-zinc-600 ml-auto shrink-0" />
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

              {/* INPUT AREA (Desktop) */}
              <div className="p-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                  <div className="relative max-w-4xl mx-auto">
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
    if (step === 'planning') return <Brain className="h-4 w-4" />
    if (step === 'coding') return <Hammer className="h-4 w-4" />
    if (step === 'fixing') return <Wrench className="h-4 w-4" />
    if (step === 'done') return <Check className="h-4 w-4" />
    return <Sparkles className="h-4 w-4" />
}

export default AIWebsiteBuilder