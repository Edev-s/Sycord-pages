"use client"

import { Menu, Globe } from "lucide-react"

interface SiteCard {
  id: string
  previewUrl?: string
  label?: string
}

interface SitePreviewDashboardProps {
  siteName?: string
  domain?: string
  isLive?: boolean
  userInitial?: string
  primaryPreviewUrl?: string
  secondaryPreviewUrl?: string
  quickCards?: SiteCard[]
  onMenuClick?: () => void
  onAvatarClick?: () => void
}

export function SitePreviewDashboard({
  siteName = "Ok",
  domain = "Domain.com",
  isLive = true,
  userInitial = "D",
  primaryPreviewUrl,
  secondaryPreviewUrl,
  quickCards = [{id:"a"},{id:"b"},{id:"c"}],
  onMenuClick,
  onAvatarClick,
}: SitePreviewDashboardProps) {
  return (
    <div
      className="flex flex-col min-h-screen font-sans select-none"
      style={{ background: "var(--dash-bg)" }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-5 py-[18px]"
        style={{ borderBottom: "1px solid var(--dash-border)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="transition-opacity hover:opacity-70 active:opacity-50"
            style={{ color: "var(--dash-muted)" }}
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <span className="text-[17px] font-medium" style={{ color: "var(--dash-text)" }}>
            {siteName}
          </span>
        </div>

        <button
          onClick={onAvatarClick}
          aria-label="User profile"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold transition-opacity hover:opacity-85"
          style={{ background: "var(--dash-orange)", color: "var(--dash-text)" }}
        >
          {userInitial.charAt(0).toUpperCase()}
        </button>
      </header>

      {/* ── Scrollable body ── */}
      <main className="flex-1 flex flex-col gap-[18px] px-4 pt-6 pb-10 overflow-y-auto">

        {/* Primary preview card */}
        <div
          className="relative w-full rounded-[20px] overflow-hidden"
          style={{
            background: "var(--dash-card)",
            aspectRatio: "4 / 3",
          }}
        >
          {primaryPreviewUrl ? (
            <img
              src={primaryPreviewUrl}
              alt={`${domain} website preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full" aria-hidden="true" />
          )}

          {/* "Your site is now live!" banner */}
          {isLive && (
            <div className="absolute bottom-0 left-0 flex items-end" style={{ width: "70%" }}>
              {/* Rotated diamond icon */}
              <div
                className="relative flex-shrink-0 z-10"
                style={{ marginBottom: "-2px", marginLeft: "-4px" }}
                aria-hidden="true"
              >
                <div
                  className="w-8 h-8 rotate-45 rounded-[5px]"
                  style={{ background: "var(--dash-green)" }}
                />
              </div>

              {/* Banner pill */}
              <div
                className="flex-1 flex items-center py-[13px] px-4 -ml-3 rounded-tr-[18px]"
                style={{ background: "var(--dash-green)" }}
              >
                <span
                  className="text-[13px] font-bold leading-tight text-pretty"
                  style={{ color: "var(--dash-text)" }}
                >
                  Your site is now live!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Domain row */}
        <div className="flex items-center gap-3 px-1">
          {/* Favicon square */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--dash-surface)" }}
          >
            <Globe size={15} style={{ color: "var(--dash-muted)" }} aria-hidden="true" />
          </div>

          <span
            className="flex-1 text-[14px] font-semibold"
            style={{ color: "var(--dash-text)" }}
          >
            {domain}
          </span>

          {/* Pill action button placeholder */}
          <div
            className="h-9 w-28 rounded-full"
            style={{ background: "var(--dash-surface)" }}
            aria-hidden="true"
          />
        </div>

        {/* Secondary preview card */}
        <div
          className="w-full rounded-[20px]"
          style={{
            background: "var(--dash-card)",
            aspectRatio: "16 / 9",
          }}
        >
          {secondaryPreviewUrl ? (
            <img
              src={secondaryPreviewUrl}
              alt="Secondary website preview"
              className="w-full h-full object-cover rounded-[20px]"
            />
          ) : (
            <div className="w-full h-full" aria-hidden="true" />
          )}
        </div>

        {/* Quick-action card grid */}
        <div className="grid grid-cols-3 gap-3">
          {quickCards.map((card) => (
            <div
              key={card.id}
              className="rounded-[18px] overflow-hidden"
              style={{
                background: "var(--dash-card)",
                aspectRatio: "1 / 1",
              }}
            >
              {card.previewUrl ? (
                <img
                  src={card.previewUrl}
                  alt={card.label ?? "Site thumbnail"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
