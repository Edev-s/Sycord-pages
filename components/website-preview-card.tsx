"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Loader2,
  Globe,
  Edit2,
  Package,
  Sparkles,
  Zap,
  Plus,
  Palette,
  Share2,
  FileText,
} from "lucide-react"
import Link from "next/link"

interface WebsitePreviewCardProps {
  fallbackHtml?: string;
  domain: string
  isLive: boolean
  deploymentId?: string
  projectId?: string
  businessName?: string
  createdAt?: string
  onDelete?: (id: string) => void
  style?: string
}

export function WebsitePreviewCard({
  fallbackHtml,
  domain,
  isLive,
  deploymentId,
  projectId,
  businessName = "Website",
  createdAt = new Date().toISOString(),
  onDelete,
  style = "default",
}: WebsitePreviewCardProps) {
  const [frameLoading, setFrameLoading] = useState(true)
  const [frameError, setFrameError] = useState(false)
  const [iframeScale, setIframeScale] = useState(0.26)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fullUrl = domain.startsWith("http") ? domain : `https://${domain}`
  const displayDomain = domain.replace(/^https?:\/\//, "")
  const formattedDate = new Date(createdAt).toLocaleDateString("hu-HU")
  const IconComp = style === "browse" ? Sparkles : style === "ai" ? Zap : Package

  const updateScale = useCallback(() => {
    if (wrapperRef.current) {
      setIframeScale(wrapperRef.current.offsetWidth / 1440)
    }
  }, [])

  useEffect(() => {
    updateScale()
    const ro = new ResizeObserver(updateScale)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [updateScale])

  const editorUrl = `/dashboard/sites/${projectId}`

  const leftActions = [
    { label: "Edit Header", icon: Edit2 },
    { label: "Manage Pages", icon: FileText },
    { label: "Add Section", icon: Plus },
  ]

  const rightActions = [
    { label: "Theme", icon: Palette },
    { label: "Add Block", icon: Plus },
    { label: "Publish Changes", icon: Share2 },
  ]

  // Unique combined list for mobile (deduped by label)
  const allActionsUnique = [
    ...leftActions,
    ...rightActions.filter((r) => !leftActions.some((l) => l.label === r.label)),
  ]

  /* ── Browser mockup wrapper ──────────────────────────────── */
  const BrowserChrome = () => (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white/95">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] shrink-0" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] shrink-0" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] shrink-0" />
      <div className="flex-1 mx-2 h-5 bg-gray-100 rounded text-[10px] text-gray-400 flex items-center px-2 gap-1 overflow-hidden">
        <Globe className="h-3 w-3 text-gray-400 shrink-0" />
        <span className="truncate">{displayDomain}</span>
      </div>
    </div>
  )

  /* ── Action button (desktop side panel) ─────────────────── */
  const ActionButton = ({ label, icon: Icon }: { label: string; icon: React.ElementType }) => (
    <Link href={editorUrl} className="block">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer
        border border-[#3d7a52]/70 bg-[#1f4a2e]/80 hover:bg-[#2a5c3a]
        backdrop-blur-sm transition-all duration-200 hover:border-[#4d8a62]
        hover:shadow-lg hover:shadow-green-900/30">
        <Icon className="h-4 w-4 text-green-300 shrink-0" />
        <span className="text-[12px] font-medium text-green-100 whitespace-nowrap">{label}</span>
      </div>
    </Link>
  )

  /* ── Preview iframe region ───────────────────────────────── */
  const PreviewRegion = () => {
    if (!isLive) {
      return fallbackHtml ? (
        <div
          ref={wrapperRef}
          className="relative overflow-hidden"
          style={{ aspectRatio: "16/10", background: "#252527" }}
        >
          <iframe
            srcDoc={fallbackHtml}
            title={`Preview of ${displayDomain}`}
            className="absolute inset-0 border-0 block pointer-events-none select-none"
            style={{
              width: "1440px",
              height: "900px",
              transformOrigin: "top left",
              transform: `scale(${iframeScale})`,
            }}
            sandbox="allow-scripts"
            tabIndex={-1}
          />
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3"
          style={{ aspectRatio: "16/10", background: "#252527" }}
        >
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Building Project…</p>
        </div>
      )
    }

    return (
      <div
        ref={wrapperRef}
        className="relative overflow-hidden"
        style={{ aspectRatio: "16/10", background: "#252527" }}
      >
        {frameLoading && !frameError && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "#252527" }}>
            <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
          </div>
        )}
        {frameError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Globe className="h-6 w-6 text-zinc-700" />
            <p className="text-xs text-zinc-500">Preview unavailable</p>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <iframe
              src={fullUrl}
              title={`Preview of ${displayDomain}`}
              className="border-0 block"
              style={{
                width: "1440px",
                height: "900px",
                transformOrigin: "top left",
                transform: `scale(${iframeScale})`,
              }}
              onLoad={() => setFrameLoading(false)}
              onError={() => { setFrameError(true); setFrameLoading(false) }}
              sandbox="allow-same-origin allow-scripts allow-forms"
              tabIndex={-1}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="relative rounded-2xl p-3 sm:p-4 flex flex-col gap-3"
      style={{ background: "linear-gradient(135deg, #1a3a25 0%, #0f2418 100%)" }}
    >
      {/* ── Desktop: left buttons | browser mockup | right buttons ── */}
      <div className="hidden sm:flex items-start gap-3">
        {/* Left action panel */}
        <div className="flex flex-col gap-2 shrink-0 pt-8">
          {leftActions.map((action) => (
            <ActionButton key={action.label} {...action} />
          ))}
        </div>

        {/* Center: browser mockup */}
        <div className="flex-1 min-w-0 rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <BrowserChrome />
          <PreviewRegion />
        </div>

        {/* Right action panel */}
        <div className="flex flex-col gap-2 shrink-0 pt-8">
          {rightActions.map((action) => (
            <ActionButton key={action.label} {...action} />
          ))}
        </div>
      </div>

      {/* ── Mobile: browser mockup + action grid below ── */}
      <div className="sm:hidden flex flex-col gap-3">
        <div className="rounded-xl overflow-hidden shadow-xl border border-white/10">
          <BrowserChrome />
          <PreviewRegion />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {allActionsUnique.map(({ label, icon: Icon }) => (
            <Link key={label} href={editorUrl}>
              <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-pointer text-center
                border border-[#3d7a52]/70 bg-[#1f4a2e]/80 hover:bg-[#2a5c3a] transition-all duration-200">
                <Icon className="h-4 w-4 text-green-300" />
                <span className="text-[9px] font-medium text-green-200 leading-tight">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Footer: project info + live badge + edit button ── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 shrink-0">
            <IconComp className="h-3.5 w-3.5 text-green-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-white leading-none mb-0.5 truncate">{businessName}</p>
            <p className="text-[10px] text-green-300/60 truncate">{displayDomain} · {formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/40 border border-green-700/40">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Live</span>
            </div>
          )}
          <Link href={editorUrl}>
            <div className="flex items-center gap-1.5 px-3 h-7 rounded-full text-[11px] font-semibold text-white
              bg-green-700 hover:bg-green-600 transition-colors cursor-pointer">
              <Edit2 className="h-3 w-3" />
              Edit
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
