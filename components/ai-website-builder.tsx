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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 3.0 Flash (Latest)", provider: "Google" },
  { id: "deepseek-v3.2-exp", name: "DeepSeek", provider: "DeepSeek" },
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
  const [currentPlan, setCurrentPlan] = useState("") // UI Status Text
  const [error, setError] = useState<string | null>(null)

  // Deployment State
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url?: string; githubUrl?: string; message?: string } | null>(null)

  // Instruction State (The "Plan" text)
  const [instruction, setInstruction] = useState<string>("")

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState(MODELS[0])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentPlan, step])

  // Start the process
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
      // Step 1: Generate Plan / Instruction
      const planResponse = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!planResponse.ok) throw new Error("Failed to generate plan")

      const planData = await planResponse.json()
      const generatedInstruction = planData.instruction

      if (!generatedInstruction) throw new Error("No instruction generated")

      setInstruction(generatedInstruction)

      // Add Plan to chat history
      const planMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generatedInstruction,
        plan: "Architectural Strategy",
        isIntermediate: false
      }

      const newHistory = [...messages, userMessage, planMessage]
      setMessages(newHistory)

      // Step 2: Start generating files based on instruction
      processNextStep(generatedInstruction, newHistory)

    } catch (err: any) {
      setError(err.message || "An error occurred during planning")
      setStep("idle")
    }
  }

  // Recursive step processor
  const processNextStep = async (currentInstruction: string, currentHistory: Message[]) => {
    setStep("coding")
    setCurrentPlan("Generating next file...")

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

      if (!response.ok) throw new Error("Failed to generate file")

      const data = await response.json()

      if (data.isComplete) {
        setStep("done")
        setCurrentPlan("All files generated successfully!")
        return
      }

      // We have a new file
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated ${data.pageName}`,
        code: data.code,
        pageName: data.pageName,
        isIntermediate: true
      }

      const newHistory = [...currentHistory, assistantMessage]
      setMessages(prev => [...prev, assistantMessage])

      // Update Pages State
      if (data.code && data.pageName) {
        setGeneratedPages(prev => {
          const existing = prev.findIndex(p => p.name === data.pageName)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = { name: data.pageName, code: data.code, timestamp: Date.now() }
            return updated
          }
          return [...prev, { name: data.pageName, code: data.code, timestamp: Date.now() }]
        })

        // Auto-save to DB
        await fetch(`/api/projects/${projectId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.pageName, // Keep extension to support .ts, .css, etc.
            content: data.code
          })
        })
      }

      // Update Instruction State
      setInstruction(data.updatedInstruction)

      // Recurse
      processNextStep(data.updatedInstruction, newHistory)

    } catch (err: any) {
      setError(err.message || "Error generating file")
      setStep("idle")
    }
  }

  const handleDeployCode = async () => {
    if (isDeploying) return
    
    setIsDeploying(true)
    setDeployProgress(0)
    setDeploySuccess(false)
    setDeployResult(null)
    setError(null)

    // Progress simulation constants
    const PROGRESS_INTERVAL_MS = 400
    const PROGRESS_INCREMENT = 10
    const MAX_SIMULATED_PROGRESS = 80

    try {
      // Simulate progress for UX while actual deployment happens
      // Progress increases steadily until reaching the maximum simulated value
      const progressInterval = setInterval(() => {
        setDeployProgress(prev => {
          const nextProgress = prev + PROGRESS_INCREMENT
          if (nextProgress >= MAX_SIMULATED_PROGRESS) {
            clearInterval(progressInterval)
            return MAX_SIMULATED_PROGRESS
          }
          return nextProgress
        })
      }, PROGRESS_INTERVAL_MS)

      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Deployment failed")
      }

      const result = await response.json()
      
      // Complete the progress bar
      setDeployProgress(100)
      setDeploySuccess(true)
      setDeployResult({
        url: result.cloudflareUrl || result.url,
        githubUrl: result.githubUrl,
        message: result.message || `Successfully deployed ${result.filesCount} file(s)`
      })

      // Reset success state after 5 seconds
      const SUCCESS_DISPLAY_DURATION_MS = 5000
      setTimeout(() => {
        setDeploySuccess(false)
        setDeployProgress(0)
      }, SUCCESS_DISPLAY_DURATION_MS)

    } catch (err: any) {
      setError(err.message || "Deployment failed")
      setDeployProgress(0)
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans">
      {/* Header / Model Selector */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10 supports-[backdrop-filter]:bg-background/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
             <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-semibold leading-none tracking-tight">AI Architect</span>
             <span className="text-[10px] text-muted-foreground font-medium">Auto-pilot active</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Model Chooser */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-full px-4 border-border/50 bg-background/50 hover:bg-background/80 transition-all">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                <span className="text-xs font-medium">{selectedModel.name}</span>
                <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {MODELS.map(model => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className="gap-2 text-xs py-2 cursor-pointer"
                >
                  {model.id === selectedModel.id && <Check className="h-3 w-3 text-primary" />}
                  <span className={cn(model.id === selectedModel.id ? "ml-0" : "ml-5", "flex-1")}>
                     {model.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">{model.provider}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        {messages.length === 0 && step === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-30 space-y-4">
            <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">Describe your vision. AI will build the entire site.</p>
          </div>
        )}

        {messages.map((message, idx) => (
          <div key={message.id} className="space-y-6">
            {/* User Message */}
            {message.role === "user" && (
              <div className="flex justify-end">
                <div className="max-w-2xl bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-5 py-3.5 text-sm shadow-md shadow-primary/5">
                  <p className="leading-relaxed">{message.content}</p>
                </div>
              </div>
            )}

            {/* Assistant/Plan Message (Text Only) */}
            {message.role === "assistant" && !message.code && (
               <div className="flex justify-start w-full">
                 <div className="max-w-2xl w-full space-y-2">
                    {message.plan === "Architectural Strategy" && (
                        <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
                            <BrainCircuit className="h-3 w-3" /> Architectural Strategy
                        </div>
                    )}
                    <div className="bg-muted/30 rounded-2xl px-5 py-4 text-sm leading-relaxed border border-border/30 backdrop-blur-sm whitespace-pre-wrap font-mono text-xs">
                       {message.content}
                    </div>
                 </div>
               </div>
            )}

            {/* Assistant Message (Code/Completed) */}
            {message.role === "assistant" && message.code && (
              <div className="flex justify-start w-full">
                <div className="w-full max-w-3xl space-y-4">
                  <Card className={cn(
                      "border-border/30 shadow-sm bg-card/30 backdrop-blur-md overflow-hidden transition-all duration-300",
                      message.isIntermediate ? 'opacity-70 scale-[0.98]' : 'hover:border-primary/20'
                  )}>
                    <CardHeader className="pb-3 px-4 py-3 bg-muted/20 border-b border-border/10">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <span className="font-mono text-xs">{message.pageName || "Unknown"}</span>
                        </div>
                        {message.isIntermediate && (
                           <div className="text-[10px] text-muted-foreground flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full">
                             <ListTodo className="h-3 w-3" />
                             Processing...
                           </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="bg-black/40 font-mono text-[10px] text-muted-foreground p-4 max-h-32 overflow-hidden relative leading-relaxed">
                        <div className="opacity-60">{message.code.substring(0, 300)}...</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-4 text-xs text-muted-foreground flex items-center gap-1">
                            <Terminal className="h-3 w-3" /> {message.code.length} bytes
                        </div>
                      </div>
                    </CardContent>
                    {!message.isIntermediate && (
                      <CardFooter className="p-0 bg-muted/10 border-t border-border/10 flex flex-col">
                        <div className="w-full relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full gap-2 h-9 text-xs font-medium rounded-none rounded-b-lg transition-all",
                              deploySuccess && "bg-green-500/20 text-green-400",
                              isDeploying && "cursor-not-allowed"
                            )}
                            onClick={handleDeployCode}
                            disabled={isDeploying}
                          >
                            {isDeploying ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Deploying to GitHub...
                              </>
                            ) : deploySuccess ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Deployed Successfully!
                              </>
                            ) : (
                              <>
                                <Rocket className="h-3.5 w-3.5" />
                                Deploy to GitHub
                              </>
                            )}
                          </Button>
                          {(isDeploying || deploySuccess) && (
                            <div className="absolute bottom-0 left-0 right-0 h-1">
                              <Progress 
                                value={deployProgress} 
                                className={cn(
                                  "h-1 rounded-none rounded-b-lg",
                                  deploySuccess ? "[&>div]:bg-green-500" : ""
                                )} 
                              />
                            </div>
                          )}
                        </div>
                        {deploySuccess && (deployResult?.url || deployResult?.githubUrl) && (
                          <div className="w-full px-3 py-2 text-[10px] text-center text-muted-foreground border-t border-border/10 flex flex-col gap-1">
                            {deployResult?.url && (
                              <a 
                                href={deployResult.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View Live Site →
                              </a>
                            )}
                            {deployResult?.githubUrl && (
                              <a 
                                href={deployResult.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary hover:underline"
                              >
                                View on GitHub
                              </a>
                            )}
                          </div>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Live Status Area */}
        {(step === "planning" || step === "coding") && (
          <div className="flex justify-start w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4">
            <div className="w-full space-y-4 bg-muted/10 p-4 rounded-xl border border-dashed border-border/30">
              <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                <div className="relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary animate-ping absolute inset-0 opacity-75"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-primary relative"></div>
                </div>
                {currentPlan}
              </div>

              {/* Optional: Show raw instruction preview if debugging */}
              {/* <div className="text-[10px] text-muted-foreground font-mono mt-2 opacity-50 whitespace-pre-wrap max-h-20 overflow-hidden">
                 {instruction}
              </div> */}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border/50">
        <div className="relative max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                startGeneration()
              }
            }}
            placeholder={step === "idle" || step === "done" ? "Describe your website vision..." : "AI Architect is working..."}
            disabled={step === "planning" || step === "coding"}
            className="pr-12 h-12 rounded-2xl bg-muted/40 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/50 text-[16px] md:text-base"
          />
          <Button
            size="icon"
            disabled={!input.trim() || step === "planning" || step === "coding"}
            onClick={startGeneration}
            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            {step === "planning" || step === "coding" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AIWebsiteBuilder
