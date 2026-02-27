import React, { useMemo } from "react"
import { Check, BrainCircuit, ListTodo, Route, Palette, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlanDisplayProps {
  plan: string
}

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
  const parsedPlan = useMemo(() => {
    // Helper to extract content between tags
    const extractSection = (tag: string, text: string) => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i")
      const match = text.match(regex)
      return match ? match[1].trim() : null
    }

    const mainPlanRaw = extractSection("main_plan", plan)
    const pageUsageRaw = extractSection("page_usage", plan)

    // Fallback: If tags aren't found, try to identify sections by common headers if possible,
    // or just return null to fallback to raw display
    if (!mainPlanRaw && !pageUsageRaw) return null

    // Parse Main Plan
    const mainPlan = {
      goal: mainPlanRaw?.match(/\*\*Business Goal:\*\* (.*)/)?.[1]?.trim(),
      design: mainPlanRaw?.match(/\*\*Design System:\*\* (.*)/)?.[1]?.trim(),
      flow: mainPlanRaw?.match(/\*\*User Flow:\*\* (.*)/)?.[1]?.trim(),
    }

    // Parse Page Usage
    const pageUsageLines = pageUsageRaw
      ? pageUsageRaw
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.startsWith("-"))
          .map(line => {
            const parts = line.replace(/^- /, "").split(":")
            if (parts.length < 2) return { name: parts[0], desc: "" }
            return {
              name: parts[0].replace(/\*\*/g, "").trim(),
              desc: parts.slice(1).join(":").trim()
            }
          })
      : []

    // Parse File List for count
    const fileCount = (plan.match(/\[\d+\]/g) || []).length

    return { mainPlan, pageUsageLines, fileCount }
  }, [plan])

  // If we couldn't parse the structured format, render nothing (or let parent handle raw)
  if (!parsedPlan) return (
      <div className="whitespace-pre-wrap text-xs text-zinc-400 font-mono">{plan}</div>
  )

  const { mainPlan, pageUsageLines, fileCount } = parsedPlan

  return (
    <div className="space-y-6 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-700">

      {/* Header */}
      <div className="flex items-center gap-2 text-zinc-500 mb-2">
        <BrainCircuit className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Architecture Strategy</span>
      </div>

      {/* Main Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Target className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Business Goal</h4>
          </div>
          <p className="text-sm text-zinc-300 leading-snug">{mainPlan.goal || "Not specified"}</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Palette className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">Design System</h4>
          </div>
          <p className="text-sm text-zinc-300 leading-snug">{mainPlan.design || "Modern Dark Luxe"}</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Route className="h-4 w-4" />
            <h4 className="text-xs font-semibold uppercase tracking-wider">User Flow</h4>
          </div>
          <p className="text-sm text-zinc-300 leading-snug">{mainPlan.flow || "Standard Flow"}</p>
        </div>
      </div>

      {/* Page Usage Checklist */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-500 border-b border-white/5 pb-2">
           <ListTodo className="h-4 w-4" />
           <span className="text-xs font-bold uppercase tracking-widest">Sitemap & Functionality</span>
        </div>

        <div className="grid gap-3">
          {pageUsageLines.map((page, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-emerald-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-zinc-200 block mb-0.5 bg-white/5 w-fit px-1.5 rounded text-xs font-mono border border-white/5">{page.name}</span>
                <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">{page.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
          <span>Generated {fileCount} implementation steps</span>
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span>Approved for execution</span>
          </div>
      </div>

    </div>
  )
}
