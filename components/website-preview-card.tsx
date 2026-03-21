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
  LayoutList,
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

  // All action buttons navigate to the editor; deep-linking to specific editor
  // sections (header, theme, etc.) is handled by the editor itself via URL params.
  const editorUrl = `/dashboard/sites/${projectId}`

  // "Add Section" is shared by both panels (matching the reference UI design).
  const addSectionAction = { label: "Add Section", icon: Plus }

  const leftActions = [
    { label: "Edit Header", icon: Edit2 },
    { label: "Manage Posts", icon: LayoutList },
    addSectionAction,
  ]

  const rightActions = [
    addSectionAction,
    { label: "Theme", icon: Palette },
    { label: "Publish Changes", icon: Share2 },
  ]

  // Deduped list for mobile grid (Add Section appears only once)
  const mobileActions = [
    ...leftActions,
    ...rightActions.filter((r) => !leftActions.some((l) => l.label === r.label)),
  ]

  /* ── Browser chrome bar ─────────────────────────────────── */
  const browserChrome = (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-white/96">
      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] shrink-0" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] shrink-0" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] shrink-0" />
      <div className="flex-1 mx-2 h-5 bg-gray-100 rounded text-[10px] text-gray-400 flex items-center px-2 gap-1 overflow-hidden">
        <Globe className="h-3 w-3 text-gray-400 shrink-0" />
        <span className="truncate">{displayDomain}</span>
      </div>
    </div>
  )

  /* ── Website preview content ────────────────────────────── */
  const previewContent = isLive ? (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden"
      style={{ height: "264px", background: "#252527" }}
    >
      {frameLoading && !frameError && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "#252527" }}
        >
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
  ) : fallbackHtml ? (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden"
      style={{ height: "264px", background: "#252527" }}
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
      style={{ height: "264px", background: "#252527" }}
    >
      <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
      <p className="text-xs text-zinc-500 font-medium">Building Project…</p>
    </div>
  )

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1e4a28 0%, #0d2214 100%)" }}
    >
      <div className="p-4 sm:p-5">
        {/* ── DESKTOP: large overlapping side buttons + browser ── */}
        <div className="hidden sm:flex items-start gap-0">
          {/* Left action panel – starts below chrome bar, overlaps browser left edge */}
          <div
            className="flex flex-col gap-3 shrink-0 z-10 relative"
            style={{ marginTop: "36px", marginRight: "-40px" }}
          >
            {leftActions.map(({ label, icon: Icon }) => (
              <Link key={label} href={editorUrl} className="block">
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer
                    border-2 border-[#3aab60]/80 bg-[#1a4228]
                    shadow-xl shadow-black/50
                    transition-all duration-200
                    hover:bg-[#205030] hover:border-[#50c87a] hover:shadow-2xl hover:shadow-black/60"
                >
                  <Icon className="h-5 w-5 text-green-300 shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] font-bold text-white whitespace-nowrap">{label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Center: browser mockup */}
          <div className="flex-1 min-w-0 rounded-xl overflow-hidden shadow-2xl border border-white/15 z-0">
            {browserChrome}
            {previewContent}
          </div>

          {/* Right action panel – starts below chrome bar, overlaps browser right edge */}
          <div
            className="flex flex-col gap-3 shrink-0 z-10 relative"
            style={{ marginTop: "36px", marginLeft: "-40px" }}
          >
            {rightActions.map(({ label, icon: Icon }) => (
              <Link key={`right-${label}`} href={editorUrl} className="block">
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer
                    border-2 border-[#3aab60]/80 bg-[#1a4228]
                    shadow-xl shadow-black/50
                    transition-all duration-200
                    hover:bg-[#205030] hover:border-[#50c87a] hover:shadow-2xl hover:shadow-black/60"
                >
                  <Icon className="h-5 w-5 text-green-300 shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] font-bold text-white whitespace-nowrap">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── MOBILE: browser + compact action grid ── */}
        <div className="sm:hidden flex flex-col gap-3">
          <div className="rounded-xl overflow-hidden border border-white/15 shadow-xl">
            {browserChrome}
            {previewContent}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {mobileActions.map(({ label, icon: Icon }) => (
              <Link key={label} href={editorUrl}>
                <div
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer text-center
                    border-2 border-[#3aab60]/70 bg-[#1a4228]
                    hover:bg-[#205030] transition-all duration-200"
                >
                  <Icon className="h-4 w-4 text-green-300" />
                  <span className="text-[10px] font-bold text-white leading-tight">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer: project info + live badge + edit button ── */}
      <div
        className="flex items-center justify-between px-4 sm:px-5 pb-4 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 shrink-0">
            <IconComp className="h-4 w-4 text-green-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-none mb-0.5 truncate">
              {businessName}
            </p>
            <p className="text-[11px] text-green-300/60 truncate">
              {displayDomain} · {formattedDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {isLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/40 border border-green-700/40">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">
                Live
              </span>
            </div>
          )}
          <Link href={editorUrl}>
            <div
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-bold text-white
                bg-green-700 hover:bg-green-600 transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
