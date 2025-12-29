"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Globe, CheckCircle2, AlertTriangle, XCircle, MapPin, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (LucideIcons as any)[name] || Globe
  return <Icon className={className} />
}

interface ServerStatus {
  id: string
  name: string
  provider: string
  providerIcon: string
  status: "up" | "down" | "unknown"
  statusCode: number
  history: ("up" | "down" | "unknown")[]
}

interface StatusResponse {
  servers: ServerStatus[]
  globalStatus: "operational" | "degraded" | "outage"
}

// Continent data with coordinates for the world map
const continents = [
  { id: "na", name: "North America", x: 20, y: 30, status: "operational" as const },
  { id: "sa", name: "South America", x: 28, y: 65, status: "operational" as const },
  { id: "eu", name: "Europe", x: 48, y: 25, status: "operational" as const },
  { id: "af", name: "Africa", x: 50, y: 50, status: "operational" as const },
  { id: "as", name: "Asia", x: 70, y: 30, status: "operational" as const },
  { id: "oc", name: "Oceania", x: 82, y: 65, status: "operational" as const },
]

export default function ServersPage() {
  const [servers, setServers] = useState<ServerStatus[]>([])
  const [globalStatus, setGlobalStatus] = useState<"operational" | "degraded" | "outage">("operational")
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/servers/status")
        if (res.ok) {
          const data: StatusResponse = await res.json()
          setServers(data.servers)
          setGlobalStatus(data.globalStatus)
          setLastUpdated(new Date())
        }
      } catch (error) {
        console.error("Failed to fetch status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    // Poll every minute
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: "operational" | "degraded" | "outage") => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="h-5 w-5 text-[#00E599]" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "outage":
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: "operational" | "degraded" | "outage") => {
    switch (status) {
      case "operational":
        return "bg-[#00E599]"
      case "degraded":
        return "bg-yellow-500"
      case "outage":
        return "bg-red-500"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={32} height={32} />
              <span className="text-xl font-semibold text-foreground">Sycord</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Főoldal
            </Link>
            <Link href="/servers" className="text-sm text-foreground font-medium">
              Állapot
            </Link>
            <Link href="/servers/incidents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Incidensek
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground text-sm md:text-base">
                Bejelentkezés
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-white/90 text-sm md:text-base">Kezdés</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Status Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className={cn(
            "inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8",
            globalStatus === "operational" ? "bg-[#00E599]/10 border border-[#00E599]/20" : "bg-red-500/10 border border-red-500/20"
          )}>
            {getStatusIcon(globalStatus)}
            <span className={cn(
              "text-lg font-semibold",
              globalStatus === "operational" ? "text-[#00E599]" : "text-red-500"
            )}>
              {globalStatus === "operational" ? "All Systems Operational" : "System Issues Detected"}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            System Status
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Real-time status of all Sycord services and infrastructure
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* World Map with Continent Markers */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Infrastructure
            </h2>
            
            <div className="relative w-full aspect-[2/1] bg-background/50 rounded-lg overflow-hidden">
              {/* World Map SVG */}
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                {/* Simplified world map paths */}
                <defs>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                  </linearGradient>
                </defs>
                
                {/* North America */}
                <path d="M150,80 Q180,60 220,70 Q260,80 280,120 Q290,160 270,200 Q250,240 200,260 Q150,270 120,240 Q90,210 100,160 Q110,110 150,80 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                
                {/* South America */}
                <path d="M220,280 Q250,270 270,300 Q290,340 280,400 Q270,450 240,470 Q200,480 180,440 Q170,380 190,320 Q200,290 220,280 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                
                {/* Europe */}
                <path d="M450,60 Q490,50 530,70 Q560,90 550,130 Q540,160 500,170 Q460,175 440,150 Q420,120 430,90 Q440,70 450,60 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                
                {/* Africa */}
                <path d="M450,190 Q490,180 530,200 Q560,230 560,290 Q555,350 530,400 Q500,440 460,430 Q420,415 420,360 Q420,300 430,250 Q440,210 450,190 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                
                {/* Asia */}
                <path d="M580,50 Q650,40 720,60 Q790,80 840,120 Q880,160 870,220 Q860,270 800,290 Q740,300 680,280 Q620,260 590,210 Q560,160 570,110 Q575,70 580,50 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                
                {/* Oceania */}
                <path d="M780,340 Q820,330 860,350 Q890,370 890,410 Q885,450 850,460 Q810,465 780,445 Q755,420 760,380 Q765,350 780,340 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              </svg>
              
              {/* Continent Status Markers */}
              {continents.map((continent) => (
                <div
                  key={continent.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={{ left: `${continent.x}%`, top: `${continent.y}%` }}
                >
                  <div className="relative">
                    {/* Pulse animation - respects prefers-reduced-motion */}
                    <div className={cn(
                      "absolute inset-0 rounded-full animate-ping opacity-75 motion-reduce:animate-none",
                      getStatusColor(continent.status)
                    )} style={{ animationDuration: '2s' }} />
                    
                    {/* Status dot */}
                    <div className={cn(
                      "relative w-4 h-4 rounded-full border-2 border-background shadow-lg",
                      getStatusColor(continent.status)
                    )} />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover border border-border rounded-lg text-xs font-medium text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {continent.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {continent.status === "operational" ? "Operational" : "Issues"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00E599]" />
                <span className="text-muted-foreground">Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Degraded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Outage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Server List */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Services</h2>
          
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-5 w-32 bg-muted rounded" />
                      <div className="h-5 w-20 bg-muted rounded" />
                    </div>
                    <div className="h-12 w-full bg-muted/50 rounded" />
                  </div>
                ))}
              </div>
            ) : servers.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No servers monitored</h3>
                <p className="text-muted-foreground">Server monitoring will appear here once configured.</p>
              </div>
            ) : (
              servers.map((server) => (
                <div key={server.id} className="bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {server.providerIcon ? (
                          <DynamicIcon name={server.providerIcon} className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Globe className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{server.name}</h3>
                        {server.provider && (
                          <p className="text-sm text-muted-foreground">{server.provider}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {server.statusCode > 0 && (
                        <span className="font-mono text-sm text-muted-foreground">
                          {server.statusCode}
                        </span>
                      )}
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        server.status === "up" && "bg-[#00E599]/10 text-[#00E599]",
                        server.status === "down" && "bg-red-500/10 text-red-500",
                        server.status === "unknown" && "bg-muted text-muted-foreground"
                      )}>
                        {server.status === "up" ? "Operational" : server.status === "down" ? "Down" : "Unknown"}
                      </div>
                    </div>
                  </div>

                  {/* History Bars */}
                  <div className="flex items-center gap-1 h-10">
                    {server.history.map((status, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex-1 h-full rounded transition-all duration-300 hover:opacity-80",
                          status === "up" && "bg-[#00E599]",
                          status === "down" && "bg-red-500",
                          status === "unknown" && "bg-muted"
                        )}
                        title={`${index + 1} hours ago: ${status}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Last 14 hours uptime</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incidents Link */}
        <div className="max-w-4xl mx-auto mt-12">
          <Link href="/servers/incidents" className="block">
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Incident History</h3>
                  <p className="text-muted-foreground">View past incidents and maintenance reports</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(globalStatus))} />
              <span className="text-sm font-medium text-muted-foreground">
                {globalStatus === "operational" ? "All services operational" : "Some services experiencing issues"}
              </span>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={24} height={24} />
              <span className="text-sm text-muted-foreground">© 2024 Sycord. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/servers" className="text-sm text-muted-foreground hover:text-foreground">
                Status
              </Link>
              <Link href="/servers/incidents" className="text-sm text-muted-foreground hover:text-foreground">
                Incidents
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
