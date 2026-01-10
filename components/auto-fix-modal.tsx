"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Terminal, FileCode, ArrowRight, Trash2, Move, Rocket, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GeneratedPage } from "@/components/ai-website-builder"
import { cn } from "@/lib/utils"

interface AutoFixModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectDbId: string
  logs: string[]
  pages: GeneratedPage[]
  setPages: (pages: GeneratedPage[]) => void
  onRedeploy?: () => void
}

type FixStep = {
  status: 'pending' | 'processing' | 'completed' | 'error'
  message: string
  action?: string
  details?: string
}

export function AutoFixModal({ isOpen, onClose, projectId, projectDbId, logs, pages, setPages, onRedeploy }: AutoFixModalProps) {
  const [steps, setSteps] = useState<FixStep[]>([])
  const [isFixing, setIsFixing] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [displayLogs, setDisplayLogs] = useState<string[]>(logs)
  const [fixSuccessful, setFixSuccessful] = useState(false)

  // Update display logs when props change
  useEffect(() => {
    setDisplayLogs(logs)
  }, [logs])

  const addStep = (message: string, status: FixStep['status'] = 'pending') => {
    setSteps(prev => [...prev, { message, status }])
  }

  const updateLastStep = (updates: Partial<FixStep>) => {
    setSteps(prev => {
      const newSteps = [...prev]
      if (newSteps.length > 0) {
        newSteps[newSteps.length - 1] = { ...newSteps[newSteps.length - 1], ...updates }
      }
      return newSteps
    })
  }

  const startAutoFix = async () => {
    setIsFixing(true)
    setSteps([])
    setFixSuccessful(false)
    addStep("Fetching recent server logs...", "processing")

    try {
      // Fetch latest logs first
      let currentLogs = logs
      try {
        const fetchUrl = `https://micro1.sycord.com/api/logs?project_id=${projectId}&limit=50`
        console.log(`[AutoFix] Fetching logs from: ${fetchUrl}`)

        const logRes = await fetch(fetchUrl)
        console.log(`[AutoFix] Response status: ${logRes.status}`)

        if (logRes.ok) {
          const rawText = await logRes.text()
          console.log(`[AutoFix] Response body:`, rawText)

          try {
            const logData = JSON.parse(rawText)
            if (logData.success && Array.isArray(logData.logs)) {
              currentLogs = logData.logs
              setDisplayLogs(logData.logs)
              updateLastStep({ status: 'completed', details: "Logs retrieved successfully." })
            } else {
              console.warn("[AutoFix] Unexpected log data format:", logData)
              updateLastStep({ status: 'error', details: "Log format invalid, using cached logs." })
            }
          } catch (jsonErr) {
            console.error("[AutoFix] JSON parse error:", jsonErr)
            updateLastStep({ status: 'error', details: "Failed to parse logs, using cached logs." })
          }
        } else {
            console.error(`[AutoFix] Fetch failed with status: ${logRes.status}`)
            updateLastStep({ status: 'error', details: `Fetch failed (${logRes.status}), using cached logs.` })
        }
      } catch (e: any) {
        console.error("Failed to fetch logs during auto-fix", e)
        updateLastStep({ status: 'error', details: `Network error: ${e.message}` })
      }

      addStep("Analyzing deployment logs...", "processing")

      let resolved = false
      let iteration = 0
      let lastAction = null
      let fileContentToAnalyze = null
      const maxSafeIterations = 50 // Safety limit to prevent infinite loops
      const modifiedFiles = new Set<string>() // Track files that have been modified
      const actionHistory: string[] = [] // Track all actions taken

      // Local copy of pages to prevent closure staleness during the async loop
      let currentPages = [...pages]

      // Continue until AI reports 'done' - with safety limit
      while (!resolved && iteration < maxSafeIterations) {
        iteration++
        addStep(`AI iteration ${iteration}...`, "processing")

        // Prepare context using local state with modified files info
        const fileStructure = currentPages.map(p => {
          const prefix = modifiedFiles.has(p.name) ? '[MODIFIED] ' : ''
          return `${prefix}${p.name}`
        }).join('\n')

        // Build action history summary
        const historyContext = actionHistory.length > 0 
          ? `\n\n**PREVIOUS ACTIONS TAKEN:**\n${actionHistory.join('\n')}\n`
          : ''

        // Call AI
        const response = await fetch('/api/ai/auto-fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logs: currentLogs,
            fileStructure,
            fileContent: fileContentToAnalyze,
            lastAction,
            actionHistory: actionHistory
          })
        })

        if (!response.ok) throw new Error("Failed to consult AI")

        const result = await response.json()
        updateLastStep({ status: 'completed', details: result.explanation })

        if (result.action === 'done') {
            addStep("✓ Issues resolved! Ready to redeploy.", "completed")
            resolved = true
            setFixSuccessful(true)
            
            // Auto-save all modified pages to database
            if (modifiedFiles.size > 0) {
              addStep("Saving changes to database...", "processing")
              try {
                const savePromises = Array.from(modifiedFiles).map(async (fileName) => {
                  const page = currentPages.find(p => p.name === fileName)
                  if (page) {
                    const response = await fetch(`/api/projects/${projectDbId}/pages`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: page.name,
                        content: page.code,
                        usedFor: page.usedFor || 'Auto-fix'
                      })
                    })
                    if (!response.ok) throw new Error(`Failed to save ${fileName}`)
                  }
                })
                await Promise.all(savePromises)
                updateLastStep({ status: 'completed', details: `Saved ${modifiedFiles.size} file(s) to database.` })
              } catch (saveError: any) {
                updateLastStep({ status: 'error', details: `Save error: ${saveError.message}` })
              }
            }
            break
        }

        // Handle Actions
        if (result.action === 'read') {
            lastAction = 'take a look'
            addStep(`AI wants to check ${result.targetFile}...`, "processing")
            actionHistory.push(`- Checked file: ${result.targetFile}`)

            const page = currentPages.find(p => p.name === result.targetFile)
            if (page) {
                fileContentToAnalyze = { filename: page.name, code: page.code }
                updateLastStep({ status: 'completed', details: "File found, sending content to AI." })
            } else {
                updateLastStep({ status: 'error', details: "File not found." })
                // Continue loop, AI might try something else
                fileContentToAnalyze = null
            }

        } else if (result.action === 'move') {
            lastAction = 'move'
            addStep(`Moving ${result.targetFile} to ${result.newPath}...`, "processing")
            actionHistory.push(`- Moved file: ${result.targetFile} → ${result.newPath}`)

            const pageIndex = currentPages.findIndex(p => p.name === result.targetFile)
            if (pageIndex !== -1) {
                // Track the modification
                modifiedFiles.delete(result.targetFile)
                modifiedFiles.add(result.newPath)
                
                // Update local state
                const updatedPage = { ...currentPages[pageIndex], name: result.newPath }
                const newPages = [...currentPages]
                newPages[pageIndex] = updatedPage
                currentPages = newPages

                // Sync to React state
                setPages(currentPages)
                updateLastStep({ status: 'completed' })

                // Also update local fileContent if we were looking at it
                if (fileContentToAnalyze && fileContentToAnalyze.filename === result.targetFile) {
                    fileContentToAnalyze.filename = result.newPath
                }
            } else {
                updateLastStep({ status: 'error', details: "File to move not found." })
            }
            fileContentToAnalyze = null

        } else if (result.action === 'delete') {
            lastAction = 'delete'
            addStep(`Deleting ${result.targetFile}...`, "processing")
            actionHistory.push(`- Deleted file: ${result.targetFile}`)

            // Update local state
            currentPages = currentPages.filter(p => p.name !== result.targetFile)

            // Sync to React state
            setPages(currentPages)
            updateLastStep({ status: 'completed' })
            fileContentToAnalyze = null

        } else if (result.action === 'write') {
            lastAction = 'fix'
            addStep(`Applying fix to ${result.targetFile}...`, "processing")
            actionHistory.push(`- Fixed file: ${result.targetFile}`)

            // Track this file as modified
            modifiedFiles.add(result.targetFile)

            const pageIndex = currentPages.findIndex(p => p.name === result.targetFile)
            if (pageIndex !== -1) {
                // Update existing file
                const updatedPage = {
                    ...currentPages[pageIndex],
                    code: result.code,
                    timestamp: Date.now()
                }
                const newPages = [...currentPages]
                newPages[pageIndex] = updatedPage
                currentPages = newPages
            } else {
                // Create new file
                const newPage: GeneratedPage = {
                    name: result.targetFile,
                    code: result.code,
                    usedFor: "Auto-fix generated",
                    timestamp: Date.now()
                }
                currentPages = [...currentPages, newPage]
                updateLastStep({ status: 'completed', details: "Created new file." })
            }

            // Sync to React state
            setPages(currentPages)
            updateLastStep({ status: 'completed' })
            fileContentToAnalyze = null
        } else {
            updateLastStep({ status: 'completed', details: "AI is analyzing..." })
        }

        // Small delay for UX
        await new Promise(r => setTimeout(r, 800))
      }

      if (!resolved && iteration >= maxSafeIterations) {
        addStep("⚠️ Safety limit reached. Please review the changes and try again if needed.", "error")
      }

    } catch (error: any) {
        addStep(`Error: ${error.message}`, "error")
    } finally {
        setIsFixing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isFixing && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-[#0F0F10] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-blue-400" />
            AI Auto-Fix Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
           {/* Initial State / Start Button */}
           {steps.length === 0 ? (
               <div className="text-center space-y-4">
                   <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-6 text-left">
                       <h4 className="flex items-center gap-2 text-red-400 font-semibold mb-3 text-lg">
                           <AlertCircle className="h-5 w-5" />
                           Deployment Failed
                       </h4>
                       <div className="text-xs text-muted-foreground font-mono bg-black/60 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-64 custom-scrollbar border border-white/5">
                           {displayLogs.slice(-50).map((l, i) => (
                               <div key={i} className="leading-relaxed py-0.5 hover:bg-white/5">{l}</div>
                           ))}
                       </div>
                   </div>
                   <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                       <p className="text-sm text-blue-100 leading-relaxed">
                           🤖 Our AI agent will analyze your deployment logs and project structure to automatically identify and fix issues. This process continues until all problems are resolved.
                       </p>
                   </div>
                   <Button onClick={startAutoFix} size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20">
                       <Sparkles className="h-5 w-5 mr-2" />
                       Start Auto-Fix
                   </Button>
               </div>
           ) : (
               /* Steps Progress */
               <div className="space-y-4">
                   <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 bg-black/20 rounded-lg p-4 border border-white/5">
                       {steps.map((step, index) => (
                           <motion.div
                               key={index}
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="flex items-start gap-3 text-sm"
                           >
                               <div className="mt-0.5 flex-shrink-0">
                                   {step.status === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
                                   {step.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                                   {step.status === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
                                   {step.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-muted animate-pulse" />}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <p className={cn("font-medium leading-relaxed",
                                       step.status === 'processing' && "text-blue-400",
                                       step.status === 'error' && "text-red-400",
                                       step.status === 'completed' && "text-green-400"
                                   )}>
                                       {step.message}
                                   </p>
                                   {step.details && (
                                       <p className="text-xs text-muted-foreground mt-2 bg-white/5 p-2 rounded border border-white/5 leading-relaxed">
                                           {step.details}
                                       </p>
                                   )}
                               </div>
                           </motion.div>
                       ))}
                   </div>

                   {/* Action Buttons */}
                   <div className="flex gap-3 pt-2">
                       {fixSuccessful && onRedeploy && (
                           <Button 
                               onClick={() => {
                                   onRedeploy()
                                   onClose()
                               }} 
                               size="lg"
                               className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20"
                           >
                               <Rocket className="h-5 w-5 mr-2" />
                               Redeploy Now
                           </Button>
                       )}
                       {!isFixing && (
                           <>
                               {fixSuccessful && onRedeploy && (
                                   <Button onClick={onClose} variant="outline" size="lg" className="flex-1">
                                       Close
                                   </Button>
                               )}
                               {!fixSuccessful && (
                                   <Button onClick={onClose} variant="secondary" size="lg" className="w-full">
                                       Close
                                   </Button>
                               )}
                           </>
                       )}
                       {isFixing && (
                           <div className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-400">
                               <Loader2 className="h-4 w-4 animate-spin" />
                               <span>AI is working on fixes...</span>
                           </div>
                       )}
                   </div>
               </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
