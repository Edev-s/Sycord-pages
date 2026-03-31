"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import {
  Check,
  X,
  Loader2,
  RotateCcw,
  Terminal,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  CloudCog,
  Link as LinkIcon,
} from "lucide-react"

const VPS_STEPS = [
  { id: "connect", label: "Test SSH Connection", description: "Verify SSH access to VPS" },
  { id: "install-server", label: "Deploy Webhook Server", description: "Install lightweight GitHub webhook deploy server on VPS" },
  { id: "install-cloudflared", label: "Install Cloudflared", description: "Install the Cloudflare Tunnel client (cloudflared)" },
  { id: "get-tunnel-url", label: "Authenticate Cloudflare", description: "Generate Cloudflare auth link — open it in your browser to authorize" },
  { id: "create-tunnel", label: "Create Tunnel", description: "Create tunnel 'sycord-server' and route server.sycord.com" },
  { id: "start-tunnel", label: "Start Tunnel Service", description: "Enable cloudflared as a system service and start it" },
] as const

type VpsStep = typeof VPS_STEPS[number]["id"]
type VpsStepStatus = "idle" | "running" | "done" | "error"

export default function SetupPage() {
  const [vpsStatus, setVpsStatus] = useState<{
    connected: boolean
    vpsIp?: string
    deployServer?: string
    cloudflared?: string
    tunnelInfo?: string
    error?: string
  } | null>(null)
  const [vpsStatusLoading, setVpsStatusLoading] = useState(false)

  const [stepStatuses, setStepStatuses] = useState<Record<VpsStep, VpsStepStatus>>({
    "connect": "idle",
    "install-server": "idle",
    "install-cloudflared": "idle",
    "get-tunnel-url": "idle",
    "create-tunnel": "idle",
    "start-tunnel": "idle",
  })
  const [stepOutputs, setStepOutputs] = useState<Record<VpsStep, string>>({
    "connect": "",
    "install-server": "",
    "install-cloudflared": "",
    "get-tunnel-url": "",
    "create-tunnel": "",
    "start-tunnel": "",
  })
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchVpsStatus()
  }, [])

  const fetchVpsStatus = async () => {
    setVpsStatusLoading(true)
    try {
      const res = await fetch("/api/admin/vps")
      setVpsStatus(await res.json())
    } catch {
      setVpsStatus({ connected: false, error: "Failed to reach API" })
    } finally {
      setVpsStatusLoading(false)
    }
  }

  const runStep = async (stepId: VpsStep) => {
    setStepStatuses(s => ({ ...s, [stepId]: "running" }))
    setStepOutputs(o => ({ ...o, [stepId]: "" }))
    try {
      const res = await fetch("/api/admin/vps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepId }),
      })
      const data = await res.json()
      if (data.success === false || data.error) {
        setStepStatuses(s => ({ ...s, [stepId]: "error" }))
        setStepOutputs(o => ({ ...o, [stepId]: data.error || data.output || "Unknown error" }))
        toast.error(data.error || "Step failed")
      } else {
        setStepStatuses(s => ({ ...s, [stepId]: "done" }))
        setStepOutputs(o => ({ ...o, [stepId]: data.output || "Done" }))
        if (stepId === "get-tunnel-url") {
          if (data.authUrl) setAuthUrl(data.authUrl)
          else if (data.alreadyAuthenticated) toast.success("Already authenticated with Cloudflare.")
        }
        toast.success(`${VPS_STEPS.find(s => s.id === stepId)?.label} — done`)
      }
    } catch (e: any) {
      setStepStatuses(s => ({ ...s, [stepId]: "error" }))
      setStepOutputs(o => ({ ...o, [stepId]: e.message }))
      toast.error(e.message)
    }
  }

  const completedCount = Object.values(stepStatuses).filter(s => s === "done").length
  const totalSteps = VPS_STEPS.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
              <span className="text-lg font-semibold text-foreground">Sycord</span>
            </Link>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 text-primary border-primary/20 font-semibold">
              VPS Setup
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchVpsStatus}
            disabled={vpsStatusLoading}
            className="h-8 text-xs"
          >
            {vpsStatusLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
            <CloudCog className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">VPS & Cloudflare Tunnel Setup</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Connect your VPS to <code className="bg-accent px-1.5 py-0.5 rounded text-xs">server.sycord.com</code> via Cloudflare Tunnel
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="text-xs text-muted-foreground">{completedCount}/{totalSteps} steps complete</div>
            <div className="flex gap-1">
              {VPS_STEPS.map(step => (
                <div
                  key={step.id}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    stepStatuses[step.id] === "done" ? "bg-green-500" :
                    stepStatuses[step.id] === "error" ? "bg-destructive" :
                    stepStatuses[step.id] === "running" ? "bg-primary animate-pulse" :
                    "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* VPS Status */}
        {vpsStatus !== null && (
          <Card className="border-border mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${vpsStatus.connected ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"}`} />
                <span className="text-sm font-semibold text-foreground">
                  {vpsStatus.connected ? `VPS Connected · ${vpsStatus.vpsIp}` : "VPS Unreachable"}
                </span>
              </div>
              {vpsStatus.connected && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-accent/30 rounded-md p-2 border border-border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Deploy Server</p>
                    <p className="font-mono font-medium text-foreground">{vpsStatus.deployServer || "—"}</p>
                  </div>
                  <div className="bg-accent/30 rounded-md p-2 border border-border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Cloudflared</p>
                    <p className="font-mono font-medium text-foreground">{vpsStatus.cloudflared || "—"}</p>
                  </div>
                  <div className="bg-accent/30 rounded-md p-2 border border-border text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Tunnel</p>
                    <p className="font-mono font-medium text-foreground truncate">{vpsStatus.tunnelInfo ? "active" : "none"}</p>
                  </div>
                </div>
              )}
              {vpsStatus.error && <p className="text-xs text-destructive mt-2 font-mono">{vpsStatus.error}</p>}
            </CardContent>
          </Card>
        )}

        {/* Auth URL Banner */}
        {authUrl && (
          <Card className="border-blue-500/30 bg-blue-500/5 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <LinkIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Cloudflare Auth Required</p>
                  <p className="text-xs text-muted-foreground mb-3">Click the link below and sign into your Cloudflare account to authorize the tunnel. Come back and continue when done.</p>
                  <a
                    href={authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs bg-blue-500 text-white hover:bg-blue-600 px-3 py-1.5 rounded-md transition-colors font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Cloudflare Auth Link
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {VPS_STEPS.map((step, index) => {
            const status = stepStatuses[step.id]
            const output = stepOutputs[step.id]
            const prevStep = index > 0 ? VPS_STEPS[index - 1] : null
            const prevDone = prevStep ? stepStatuses[prevStep.id] === "done" : true

            return (
              <Card
                key={step.id}
                className={`border-border transition-colors ${
                  status === "done" ? "border-green-500/30 bg-green-500/5" :
                  status === "error" ? "border-destructive/30 bg-destructive/5" : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Step indicator */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      status === "done" ? "bg-green-500/20 text-green-500" :
                      status === "error" ? "bg-destructive/20 text-destructive" :
                      status === "running" ? "bg-primary/10 text-primary" :
                      "bg-accent text-muted-foreground"
                    }`}>
                      {status === "done" ? <Check className="h-4 w-4" /> :
                       status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                       status === "error" ? <X className="h-4 w-4" /> :
                       <span>{index + 1}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{step.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={status === "done" ? "outline" : "default"}
                          onClick={() => runStep(step.id)}
                          disabled={status === "running" || (!prevDone && status === "idle")}
                          className="h-8 text-xs flex-shrink-0"
                        >
                          {status === "running" ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Running…</>
                          ) : status === "done" ? (
                            <><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Re-run</>
                          ) : (
                            <><Terminal className="h-3.5 w-3.5 mr-1.5" />Run</>
                          )}
                        </Button>
                      </div>

                      {output && (
                        <pre className="mt-3 p-3 bg-background border border-border rounded-md text-[11px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                          {output}
                        </pre>
                      )}

                      {step.id === "get-tunnel-url" && status === "done" && authUrl && (
                        <a
                          href={authUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-3 py-1.5 rounded-md transition-colors font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open Cloudflare Auth Link
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Completion */}
        {completedCount === totalSteps && (
          <Card className="border-green-500/30 bg-green-500/5 mt-6">
            <CardContent className="p-5 text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-500/20 mb-3">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">Setup Complete!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your VPS is now connected to Cloudflare and serving at{" "}
                <a href="https://server.sycord.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  server.sycord.com
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info note */}
        <p className="text-xs text-center text-muted-foreground mt-8">
          Need to go back?{" "}
          <Link href="/admin?tab=vps" className="text-primary hover:underline">
            Admin Panel → VPS tab
          </Link>
        </p>
      </main>
    </div>
  )
}
