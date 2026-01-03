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
  const [deployResult, setDeployResult] = useState<{ url?: string | null; githubUrl?: string | null; message?: string; debug?: string } | null>(null)
  const [deployStatus, setDeployStatus] = useState<string>("")

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

  // Debug: Log whenever deployment state changes
  useEffect(() => {
    console.log("[Deploy] DEBUG useEffect: deploySuccess changed to:", deploySuccess)
    console.log("[Deploy] DEBUG useEffect: deployResult changed to:", JSON.stringify(deployResult, null, 2))
    if (deploySuccess && deployResult) {
      console.log("[Deploy] DEBUG useEffect: BOTH deploySuccess AND deployResult are truthy - banner should be visible!")
    }
  }, [deploySuccess, deployResult])

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
    setDeployStatus("Preparing files...")

    try {
      // Step 1: Uploading to GitHub (0-40%)
      setDeployStatus("Uploading to GitHub...")
      setDeployProgress(10)
      
      console.log("[Deploy] DEBUG: Starting deployment for projectId:", projectId)
      
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      console.log("[Deploy] DEBUG: Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[Deploy] DEBUG: Error response text:", errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || "Deployment failed")
      }

      // Step 2: Parse response and check Cloudflare deployment status
      setDeployProgress(50)
      setDeployStatus("Deploying to Cloudflare...")
      
      const responseText = await response.text()
      console.log("[Deploy] DEBUG: Raw response text:", responseText)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[Deploy] DEBUG: Failed to parse JSON:", parseError)
        throw new Error("Failed to parse deployment response")
      }
      
      console.log("[Deploy] DEBUG: Parsed API Response:", JSON.stringify(result, null, 2))
      console.log("[Deploy] DEBUG: cloudflareUrl =", result.cloudflareUrl)
      console.log("[Deploy] DEBUG: url =", result.url)
      console.log("[Deploy] DEBUG: githubUrl =", result.githubUrl)
      console.log("[Deploy] DEBUG: message =", result.message)
      
      // Step 3: Complete
      setDeployProgress(100)
      
      if (result.cloudflareUrl) {
        setDeployStatus("Deployed to Cloudflare Pages!")
        console.log("[Deploy] DEBUG: Setting status to Cloudflare Pages")
      } else if (result.githubUrl) {
        setDeployStatus("Deployed to GitHub!")
        console.log("[Deploy] DEBUG: Setting status to GitHub (no cloudflareUrl)")
      } else {
        setDeployStatus("Deployment complete")
        console.log("[Deploy] DEBUG: No URL found in response")
      }
      
      const deployResultData = {
        url: result.cloudflareUrl || result.url || null,
        githubUrl: result.githubUrl || null,
        message: result.message || `Successfully deployed ${result.filesCount || 0} file(s)`,
        debug: JSON.stringify(result) // Store raw response for debug display
      }
      console.log("[Deploy] DEBUG: Final deployResultData:", JSON.stringify(deployResultData, null, 2))
      
      console.log("[Deploy] DEBUG: About to call setDeploySuccess(true)")
      setDeploySuccess(true)
      console.log("[Deploy] DEBUG: About to call setDeployResult with:", deployResultData)
      setDeployResult(deployResultData)
      console.log("[Deploy] DEBUG: State updates called - deploySuccess and deployResult should now be set")
      
      // Force a small delay to ensure React has time to process the state updates
      await new Promise(resolve => setTimeout(resolve, 100))
      console.log("[Deploy] DEBUG: After delay - UI should now show deployment result")

      // Reset only the progress bar animation after 10 seconds
      // Keep deployResult and deploySuccess to show the URL persistently
      const SUCCESS_DISPLAY_DURATION_MS = 10000
      setTimeout(() => {
        setDeployProgress(0)
        setDeployStatus("")
        // Don't reset deploySuccess or deployResult - keep showing the URL
        console.log("[Deploy] DEBUG: Progress bar reset, but keeping deploySuccess and deployResult")
      }, SUCCESS_DISPLAY_DURATION_MS)

    } catch (err: any) {
      console.error("[Deploy] DEBUG: Error caught:", err.message)
      setError(err.message || "Deployment failed")
      setDeployProgress(0)
      setDeployStatus("")
    } finally {
      setIsDeploying(false)
      console.log("[Deploy] DEBUG: Finally block - isDeploying set to false")
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

      {/* DEPLOYMENT SUCCESS BANNER - Always visible at top when deployed */}
      {deploySuccess && deployResult && (
        <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/30">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-center gap-2 text-green-500 font-semibold">
              <CheckCircle2 className="h-5 w-5" />
              <span>✓ Deployed Successfully!</span>
            </div>
            {deployResult.url ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Your site is live at:</span>
                <a 
                  href={deployResult.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-bold text-lg break-all"
                >
                  🌐 {deployResult.url}
                </a>
              </div>
            ) : (
              <div className="text-center text-xs text-yellow-600 bg-yellow-500/10 p-2 rounded">
                ⚠️ Deployed but no Cloudflare URL received. Debug: {deployResult.debug?.substring(0, 200)}...
              </div>
            )}
            {deployResult.githubUrl && (
              <a 
                href={deployResult.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary hover:underline text-xs text-center"
              >
                View source on GitHub →
              </a>
            )}
          </div>
        </div>
      )}

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
                                {deployStatus || "Deploying..."}
                              </>
                            ) : deploySuccess ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {deployStatus || "Deployed Successfully!"}
                              </>
                            ) : (
                              <>
                                <Rocket className="h-3.5 w-3.5" />
                                Deploy to Cloudflare
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
                          <div className="w-full px-3 py-3 text-[11px] text-center border-t border-border/10 flex flex-col gap-2 bg-green-500/5">
                            {deployResult?.url && (
                              <div className="flex flex-col gap-1">
                                <span className="text-green-500 font-medium flex items-center justify-center gap-1">
                                  ✓ Deployed Successfully
                                </span>
                                <a 
                                  href={deployResult.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline font-medium break-all"
                                >
                                  🌐 {deployResult.url}
                                </a>
                              </div>
                            )}
                            {deployResult?.githubUrl && (
                              <a 
                                href={deployResult.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary hover:underline text-[10px]"
                              >
                                View source on GitHub
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

        {/* Deployment Result - Always visible when deployed */}
        {deploySuccess && deployResult && (
          <div className="w-full max-w-3xl mx-auto p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex flex-col gap-2 text-center">
              <div className="flex items-center justify-center gap-2 text-green-500 font-semibold">
                <CheckCircle2 className="h-5 w-5" />
                <span>Deployed Successfully!</span>
              </div>
              {deployResult.url && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Your site is live at:</span>
                  <a 
                    href={deployResult.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium text-sm break-all"
                  >
                    🌐 {deployResult.url}
                  </a>
                </div>
              )}
              {deployResult.githubUrl && (
                <a 
                  href={deployResult.githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary hover:underline text-xs mt-1"
                >
                  View source on GitHub →
                </a>
              )}
              {deployResult.message && (
                <p className="text-xs text-muted-foreground mt-1">{deployResult.message}</p>
              )}
              {/* Debug section - shows raw API response */}
              {deployResult.debug && (
                <details className="mt-3 text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                    🔍 Debug: View raw API response
                  </summary>
                  <pre className="mt-2 p-2 bg-black/20 rounded text-[10px] overflow-auto max-h-40 text-left font-mono">
                    {deployResult.debug}
                  </pre>
                </details>
              )}
              {!deployResult.url && (
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-600">
                  ⚠️ No Cloudflare URL received. Check browser console for debug logs.
                </div>
              )}
            </div>
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
