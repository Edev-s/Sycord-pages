"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  Clock, 
  ArrowLeft,
  Calendar,
  Wrench,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// Continent data with coordinates for the world map
const continents = [
  { id: "na", name: "North America", x: 20, y: 30, status: "operational" as const, incidents: 0 },
  { id: "sa", name: "South America", x: 28, y: 65, status: "operational" as const, incidents: 0 },
  { id: "eu", name: "Europe", x: 48, y: 25, status: "operational" as const, incidents: 0 },
  { id: "af", name: "Africa", x: 50, y: 50, status: "operational" as const, incidents: 0 },
  { id: "as", name: "Asia", x: 70, y: 30, status: "operational" as const, incidents: 0 },
  { id: "oc", name: "Oceania", x: 82, y: 65, status: "operational" as const, incidents: 0 },
]

// Mock incidents data - in real app this would come from an API
const mockIncidents = [
  {
    id: "1",
    title: "Database Connectivity Issues",
    status: "resolved",
    severity: "major",
    region: "Europe",
    startTime: "2024-12-20T14:30:00Z",
    endTime: "2024-12-20T16:45:00Z",
    updates: [
      { time: "2024-12-20T16:45:00Z", message: "Issue has been fully resolved. All services are operational." },
      { time: "2024-12-20T15:30:00Z", message: "We have identified the root cause and are implementing a fix." },
      { time: "2024-12-20T14:30:00Z", message: "Investigating reports of database connectivity issues." },
    ]
  },
  {
    id: "2",
    title: "Scheduled Maintenance - API Gateway",
    status: "scheduled",
    severity: "maintenance",
    region: "Global",
    startTime: "2025-01-05T02:00:00Z",
    endTime: "2025-01-05T04:00:00Z",
    updates: [
      { time: "2024-12-28T10:00:00Z", message: "Scheduled maintenance window for API Gateway upgrades." },
    ]
  },
]

type FilterType = "all" | "active" | "resolved" | "scheduled"

export default function IncidentsPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>("all")
  
  // Calculate global status from continents
  const globalStatus = continents.every(c => c.status === "operational") 
    ? "operational" 
    : continents.some(c => c.status === "outage") 
      ? "outage" 
      : "degraded"

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="h-5 w-5 text-[#00E599]" />
      case "investigating":
      case "identified":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "outage":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "scheduled":
      case "maintenance":
        return <Wrench className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
      case "resolved":
        return "bg-[#00E599]"
      case "degraded":
      case "investigating":
      case "identified":
        return "bg-yellow-500"
      case "outage":
        return "bg-red-500"
      case "scheduled":
      case "maintenance":
        return "bg-blue-500"
      default:
        return "bg-muted"
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "major":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "minor":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "maintenance":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const filteredIncidents = mockIncidents.filter(incident => {
    if (filter === "all") return true
    if (filter === "active") return incident.status === "investigating" || incident.status === "identified"
    if (filter === "resolved") return incident.status === "resolved"
    if (filter === "scheduled") return incident.status === "scheduled"
    return true
  })

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
            <Link href="/servers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Állapot
            </Link>
            <Link href="/servers/incidents" className="text-sm text-foreground font-medium">
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
        {/* Back Link */}
        <Link 
          href="/servers" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Status
        </Link>

        {/* Page Header */}
        <div className="max-w-4xl mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Incidents & Maintenance
          </h1>
          <p className="text-lg text-muted-foreground">
            View current and past incidents, scheduled maintenance, and regional status
          </p>
        </div>

        {/* Regional Map */}
        <div className="max-w-4xl mb-12">
          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regional Status
            </h2>
            
            <div className="relative w-full aspect-[2/1] bg-background/50 rounded-lg overflow-hidden mb-6">
              {/* World Map SVG */}
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                <defs>
                  <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                  </linearGradient>
                </defs>
                
                {/* North America */}
                <path d="M150,80 Q180,60 220,70 Q260,80 280,120 Q290,160 270,200 Q250,240 200,260 Q150,270 120,240 Q90,210 100,160 Q110,110 150,80 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                      className={cn("cursor-pointer transition-all", selectedRegion === "na" && "fill-primary/20 stroke-primary")}
                      onClick={() => setSelectedRegion(selectedRegion === "na" ? null : "na")}/>
                
                {/* South America */}
                <path d="M220,280 Q250,270 270,300 Q290,340 280,400 Q270,450 240,470 Q200,480 180,440 Q170,380 190,320 Q200,290 220,280 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                      className={cn("cursor-pointer transition-all", selectedRegion === "sa" && "fill-primary/20 stroke-primary")}
                      onClick={() => setSelectedRegion(selectedRegion === "sa" ? null : "sa")}/>
                
                {/* Europe */}
                <path d="M450,60 Q490,50 530,70 Q560,90 550,130 Q540,160 500,170 Q460,175 440,150 Q420,120 430,90 Q440,70 450,60 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                      className={cn("cursor-pointer transition-all", selectedRegion === "eu" && "fill-primary/20 stroke-primary")}
                      onClick={() => setSelectedRegion(selectedRegion === "eu" ? null : "eu")}/>
                
                {/* Africa */}
                <path d="M450,190 Q490,180 530,200 Q560,230 560,290 Q555,350 530,400 Q500,440 460,430 Q420,415 420,360 Q420,300 430,250 Q440,210 450,190 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                      className={cn("cursor-pointer transition-all", selectedRegion === "af" && "fill-primary/20 stroke-primary")}
                      onClick={() => setSelectedRegion(selectedRegion === "af" ? null : "af")}/>
                
                {/* Asia */}
                <path d="M580,50 Q650,40 720,60 Q790,80 840,120 Q880,160 870,220 Q860,270 800,290 Q740,300 680,280 Q620,260 590,210 Q560,160 570,110 Q575,70 580,50 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                      className={cn("cursor-pointer transition-all", selectedRegion === "as" && "fill-primary/20 stroke-primary")}
                      onClick={() => setSelectedRegion(selectedRegion === "as" ? null : "as")}/>
                
                {/* Oceania */}
                <path d="M780,340 Q820,330 860,350 Q890,370 890,410 Q885,450 850,460 Q810,465 780,445 Q755,420 760,380 Q765,350 780,340 Z" 
                      fill="url(#mapGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                      className={cn("cursor-pointer transition-all", selectedRegion === "oc" && "fill-primary/20 stroke-primary")}
                      onClick={() => setSelectedRegion(selectedRegion === "oc" ? null : "oc")}/>
              </svg>
              
              {/* Continent Status Markers */}
              {continents.map((continent) => (
                <div
                  key={continent.id}
                  className={cn(
                    "absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer",
                    selectedRegion === continent.id && "z-10"
                  )}
                  style={{ left: `${continent.x}%`, top: `${continent.y}%` }}
                  onClick={() => setSelectedRegion(selectedRegion === continent.id ? null : continent.id)}
                >
                  <div className="relative">
                    {/* Pulse animation - respects prefers-reduced-motion */}
                    <div className={cn(
                      "absolute inset-0 rounded-full animate-ping opacity-75 motion-reduce:animate-none",
                      getStatusColor(continent.status)
                    )} style={{ animationDuration: '2s' }} />
                    
                    {/* Status dot */}
                    <div className={cn(
                      "relative w-4 h-4 rounded-full border-2 border-background shadow-lg transition-transform",
                      getStatusColor(continent.status),
                      selectedRegion === continent.id && "scale-150"
                    )} />
                  </div>
                  
                  {/* Tooltip */}
                  <div className={cn(
                    "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg text-xs font-medium text-foreground whitespace-nowrap transition-opacity pointer-events-none shadow-lg",
                    selectedRegion === continent.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3" />
                      {continent.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {continent.incidents === 0 ? "No active incidents" : `${continent.incidents} active incident(s)`}
                    </div>
                    <div className={cn(
                      "text-[10px] mt-1",
                      continent.status === "operational" ? "text-[#00E599]" : "text-red-500"
                    )}>
                      {continent.status === "operational" ? "All systems operational" : "Issues detected"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Region Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {continents.map((continent) => (
                <button
                  key={continent.id}
                  onClick={() => setSelectedRegion(selectedRegion === continent.id ? null : continent.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    selectedRegion === continent.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(continent.status))} />
                    <span className="text-xs font-medium text-foreground truncate">{continent.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {continent.incidents === 0 ? "Operational" : `${continent.incidents} incident(s)`}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <div className="max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Incident History</h2>
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              {[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "resolved", label: "Resolved" },
                { value: "scheduled", label: "Scheduled" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value as FilterType)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                    filter === tab.value 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-[#00E599] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No incidents</h3>
              <p className="text-muted-foreground">
                {filter === "all" 
                  ? "There are no recorded incidents." 
                  : `No ${filter} incidents found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <div 
                  key={incident.id} 
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(incident.status)}
                        <div>
                          <h3 className="font-semibold text-foreground">{incident.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{incident.region}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-full border",
                        getSeverityBadge(incident.severity)
                      )}>
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(incident.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {new Date(incident.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {incident.endTime && ` - ${new Date(incident.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="border-t border-border pt-4">
                      <div className="space-y-3">
                        {incident.updates.map((update, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5",
                                index === 0 ? getStatusColor(incident.status) : "bg-muted"
                              )} />
                              {index < incident.updates.length - 1 && (
                                <div className="w-px h-full bg-border flex-1 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-3">
                              <p className="text-xs text-muted-foreground mb-1">
                                {new Date(update.time).toLocaleString()}
                              </p>
                              <p className="text-sm text-foreground">{update.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
