"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Send,
  Bot,
  User,
  Check,
  ChevronDown,
  Terminal,
  Cpu,
  Sparkles,
  FileCode,
  ArrowRight,
  Rocket,
  File,
  Layers,
  ListTodo,
  BrainCircuit,
  MessageSquare
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const MODELS = [
  { id: "gemini-2.5-flash-lite", name: "Google", provider: "Google" },
  { id: "deepseek-v3.2-exp", name: "DeepSeek", provider: "DeepSeek" },
]

const SYSTEM_PROMPT = `You are an expert web developer creating beautiful, production-ready HTML websites.

CRITICAL: You MUST generate valid, complete HTML code that can be rendered directly in a browser.

MARKER INSTRUCTIONS:
When providing code, wrap it EXACTLY like this with NO backticks:
[1]
<!DOCTYPE html>
<html>
...your complete HTML code...
</html>
[1<page_name>]

Replace <page_name> with the specific name of the file you are generating (e.g., index.html, style.css).

IMAGES:
Use REAL photos from LoremFlickr for high-quality placeholders.
Format: https://loremflickr.com/{width}/{height}/{keyword}
Example: https://loremflickr.com/800/600/fashion,clothing

PRODUCTION STANDARDS:
1.  **Functionality**: All features must work in a static environment.
    -   **Login**: Simulate login using localStorage. (e.g., save 'isLoggedIn' token).
    -   **Cart**: Save items to localStorage. Update header cart count.
    -   **Navigation**: Check localStorage state (e.g., show 'Logout' if logged in).
2.  **Interactivity**: Use vanilla JavaScript to handle clicks, form submissions, and UI updates. Add event listeners in <script>.
3.  **Forms**: Add 'submit' event listeners to all forms. Prevent default submission and handle logic (e.g. redirect to next page).
4.  **Styling (HeroUI Aesthetic)**:
    -   Use Tailwind CSS.
    -   **Radius**: Use 'rounded-2xl' or 'rounded-3xl' for cards and buttons.
    -   **Shadows**: Use 'shadow-lg' or 'shadow-xl' for depth.
    -   **Glassmorphism**: Use 'backdrop-blur-md bg-white/80' for headers/modals.
    -   **Typography**: Use 'font-sans', 'tracking-tight' for headings.
    -   **Spacing**: Use generous padding ('p-8', 'py-12', 'gap-8').
    -   **Gradients**: Use subtle gradients for backgrounds or text ('bg-gradient-to-r').

ESSENTIAL REQUIREMENTS:
1. Write ALL code in pure HTML/CSS/JS - NO REACT, NO JSX.
2. Use Tailwind CSS classes for styling (include CDN).
3. Make it fully responsive (mobile-first).
4. NO backticks inside markers.
`

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
  const [currentPlan, setCurrentPlan] = useState("") // Displayed text status
  const [deployedCode, setDeployedCode] = useState<string | null>(null)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState(MODELS[0])

  // Task List State
  const [plannedFiles, setPlannedFiles] = useState<string[]>([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [isBuilding, setIsBuilding] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentPlan, step])

  // Main Orchestration Function
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
      // Step 1: Brainstorm / Plan Files
      const planResponse = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!planResponse.ok) throw new Error("Failed to generate plan")

      const planData = await planResponse.json()
      let files = []
      let thoughtProcess = ""

      try {
        // Clean potential markdown before parsing
        let rawJson = planData.plan
        if (rawJson.includes("```")) {
           rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim()
        }
        const parsed = JSON.parse(rawJson)
        files = parsed.files || []
        thoughtProcess = parsed.thoughtProcess || "Planning structure..."

        if (!Array.isArray(files) || files.length === 0) throw new Error("Invalid file list")
      } catch (e) {
        console.warn("Plan parsing failed, defaulting to index.html", e)
        files = ["index.html"]
        thoughtProcess = "I will start by creating the main index page."
      }

      setPlannedFiles(files)
      setCurrentFileIndex(0)
      setIsBuilding(true)

      // Add the architectural plan to chat
      const planMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: thoughtProcess,
        plan: "Architectural Strategy",
        isIntermediate: false
      }

      const newHistory = [...messages, userMessage, planMessage]
      setMessages(newHistory)

      // Start the loop
      processNextFile(files, 0, newHistory, thoughtProcess)

    } catch (err: any) {
      setError(err.message || "An error occurred during planning")
      setStep("idle")
    }
  }

  // Recursive function to process files one by one
  const processNextFile = async (files: string[], index: number, currentHistory: Message[], architecturalContext: string) => {
    if (index >= files.length) {
      setIsBuilding(false)
      setStep("done")
      setCurrentPlan("All files generated successfully!")
      return
    }

    const filename = files[index]
    setStep("coding")
    setCurrentPlan(`Generating ${filename} (${index + 1}/${files.length})...`)

    try {
      const codeResponse = await fetch("/api/ai/generate-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: currentHistory,
          systemPrompt: SYSTEM_PROMPT,
          // Pass the specific file task + the global architectural context
          plan: `CURRENT TASK: Generate code for file '${filename}'.\n\nARCHITECTURAL CONTEXT: ${architecturalContext}\n\nEnsure '${filename}' implements the features described in the context and integrates with other files.`,
          model: selectedModel.id, // Pass selected model
        }),
      })

      if (!codeResponse.ok) throw new Error(`Failed to generate ${filename}`)

      const codeData = await codeResponse.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: codeData.content, // Often empty/short if code is extracted
        code: codeData.code,
        pageName: codeData.pageName || filename,
        isIntermediate: index < files.length - 1
      }

      // Update history
      const newHistory = [...currentHistory, assistantMessage]
      setMessages(prev => [...prev, assistantMessage])

      // Update generated pages state
      if (codeData.code) {
        const finalName = codeData.pageName || filename
        setGeneratedPages(prev => {
          const existing = prev.findIndex(p => p.name === finalName)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = { name: finalName, code: codeData.code, timestamp: Date.now() }
            return updated
          }
          return [...prev, { name: finalName, code: codeData.code, timestamp: Date.now() }]
        })

        // Auto-save to database
        const saveRes = await fetch(`/api/projects/${projectId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: finalName.replace(".html", ""),
            content: codeData.code
          })
        })

        if (saveRes.ok) {
          console.log("[v0] Page auto-saved to DB")

          // Trigger Auto-Deployment if this is a substantial file update
          console.log("[v0] Triggering auto-deployment...")
          try {
            const deployRes = await fetch("/api/cloudflare/deploy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId })
            })

            if (deployRes.ok) {
                console.log("[v0] Auto-deployment successful")
                // Force a reload of the preview if iframe exists on the page
                const iframe = document.querySelector('iframe[title="Live Preview"]') as HTMLIFrameElement
                if (iframe) {
                    // Force refresh by appending/updating a timestamp parameter
                    const currentSrc = new URL(iframe.src)
                    currentSrc.searchParams.set('t', Date.now().toString())
                    iframe.src = currentSrc.toString()
                }
            } else {
                console.error("[v0] Auto-deployment failed", await deployRes.text())
            }
          } catch (deployErr) {
             console.error("[v0] Auto-deployment error:", deployErr)
          }
        }
      }

      // Next iteration
      setCurrentFileIndex(index + 1)
      processNextFile(files, index + 1, newHistory, architecturalContext)

    } catch (err: any) {
      setError(err.message || `Error generating ${filename}`)
      setIsBuilding(false)
      setStep("idle")
    }
  }

  const handleDeployCode = async () => {
    if (generatedPages.length === 0) return

    try {
      const deployUrl = `/api/projects/${encodeURIComponent(projectId)}/deploy-code`
      const response = await fetch(deployUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: generatedPages.map(p => ({ name: p.name, content: p.code }))
        }),
      })

      if (!response.ok) throw new Error("Deploy failed")

      // Determine which code was "deployed" for the UI feedback
      const latestCode = generatedPages[generatedPages.length - 1]?.code
      setDeployedCode(latestCode)

      setDeploySuccess(true)
      setTimeout(() => setDeploySuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to deploy code")
    }
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans">
      {/* Header / Model Selector - Redesigned to Circled Input Style */}
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
          {/* Task Progress Indicator */}
          {isBuilding && (
             <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-muted rounded-full text-xs animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{currentFileIndex + 1} / {plannedFiles.length}</span>
             </div>
          )}

          {/* Model Chooser - Circled/Pill Style */}
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
                    <div className="bg-muted/30 rounded-2xl px-5 py-4 text-sm leading-relaxed border border-border/30 backdrop-blur-sm">
                       {message.content}
                    </div>
                 </div>
               </div>
            )}

            {/* Assistant Message (Code/Completed) */}
            {message.role === "assistant" && message.code && (
              <div className="flex justify-start w-full">
                <div className="w-full max-w-3xl space-y-4">
                  {/* Deploy Card - Optimized Style */}
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
                      <CardFooter className="p-2 bg-muted/10 border-t border-border/10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full gap-2 hover:bg-primary/10 hover:text-primary h-8 text-xs font-medium"
                          onClick={handleDeployCode}
                          disabled={deployedCode === message.code}
                        >
                          {deployedCode === message.code ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Deployed
                            </>
                          ) : (
                            <>
                              <Rocket className="h-3.5 w-3.5" />
                              Push to Staging
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Live Status Area (While working) */}
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

              {/* Task List Visualization */}
              {plannedFiles.length > 0 && (
                 <div className="pl-6 space-y-1.5 border-l-2 border-border/30 ml-1.5">
                    {plannedFiles.map((file, i) => (
                       <div key={file} className={cn(
                           "flex items-center gap-2 text-xs transition-colors duration-300",
                           i === currentFileIndex ? "text-primary font-medium" :
                           i < currentFileIndex ? "text-muted-foreground line-through opacity-50" : "text-muted-foreground opacity-30"
                       )}>
                          {i < currentFileIndex ? <Check className="h-3 w-3" /> :
                           i === currentFileIndex ? <Loader2 className="h-3 w-3 animate-spin" /> :
                           <div className="w-3 h-3 rounded-full border border-current opacity-20" />}
                          {file}
                       </div>
                    ))}
                 </div>
              )}
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
            className="pr-12 h-12 rounded-2xl bg-muted/40 border-border/40 focus-visible:ring-1 focus-visible:ring-primary/50 text-base"
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
