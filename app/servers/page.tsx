"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Server as ServerIcon, Globe } from "lucide-react"
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

export default function ServersPage() {
  const [servers, setServers] = useState<ServerStatus[]>([])
  const [globalStatus, setGlobalStatus] = useState<"operational" | "degraded" | "outage">("operational")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/servers/status")
        if (res.ok) {
          const data: StatusResponse = await res.json()
          setServers(data.servers)
          setGlobalStatus(data.globalStatus)
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

  return (
    <div className="min-h-screen bg-[#111] text-foreground flex flex-col items-center py-12 px-4 font-sans">
      <div className="w-full max-w-xl mb-12">
        <div className="flex items-center gap-3 mb-12">
           <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Image src="/logo.png" alt="Logo" width={24} height={24} className="opacity-80" />
           </div>
           <h1 className="text-2xl font-semibold text-white tracking-tight">Servers</h1>
        </div>

        {/* World Map Placeholder */}
        <div className="w-full aspect-[2/1] bg-transparent flex items-center justify-center mb-12 relative opacity-30 select-none pointer-events-none">
             {/* A simple world map SVG path */}
            <svg viewBox="0 0 2000 1001" className="w-full h-full fill-white">
                <path d="M1890,780c-25,10-53,19-72,30c-15,8-16,35-9,48c8,15,31,16,45,21c17,7,35,12,50,23c18,12,32,32,54,38c11,3,25-3,34-11
                c8-8,6-22,7-33c1-15,10-27,7-42c-2-12-16-17-27-21c-15-5-29-10-44-15c-15-5-30-10-45-15C1890,803,1890,780,1890,780z M605,338
                c-27-14-63-12-87,9c-9,8-16,21-14,33c2,11,15,14,24,19c11,6,22,12,33,18c14,8,26,20,43,21c17,1,33-9,46-18c10-7,19-17,25-28
                c5-10,5-23-1-32C660,344,632,352,605,338z M1458,350c-26,2-47,24-51,49c-3,17,8,34,20,45c11,10,26,16,41,19c15,3,32-2,44-11
                c11-9,19-23,19-38C1531,384,1501,346,1458,350z M446,477c-21,8-35,31-31,53c2,13,12,23,23,29c15,8,33,9,50,9c19,0,38-6,54-16
                c12-8,23-20,27-35c3-11-2-22-10-30C533,463,485,462,446,477z M925,502c-38-4-69,28-68,66c0,21,14,40,32,50c18,10,40,11,60,7
                c22-4,43-16,56-35c9-14,10-32,3-46C991,519,958,506,925,502z M1252,568c-23,7-38,31-32,54c4,17,21,29,38,33c16,4,33-1,46-10
                c12-9,20-23,20-38c0-17-10-32-25-40C1284,559,1268,563,1252,568z"/>
            </svg>
        </div>

        {/* Global Status */}
        <div className="flex items-center gap-3 mb-16">
            <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,255,0,0.5)]",
                globalStatus === "operational" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50")} />
            <span className="text-lg font-medium text-gray-200">
                {globalStatus === "operational" ? "All system is operational!" : "Some systems are experiencing issues"}
            </span>
        </div>

        {/* Server List */}
        <div className="space-y-16 w-full">
            {loading ? (
                <div className="text-center text-muted-foreground animate-pulse">Checking status...</div>
            ) : servers.length === 0 ? (
                <div className="text-center text-muted-foreground">No servers monitored.</div>
            ) : (
                servers.map((server) => (
                    <div key={server.id} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-200 tracking-wide">{server.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-gray-200">
                                    {server.statusCode > 0 ? server.statusCode : ""}
                                </span>
                                <div className={cn("w-2.5 h-2.5 rounded-full", server.status === "up" ? "bg-emerald-500" : "bg-red-500")} />
                            </div>
                        </div>

                        {/* History Bars */}
                        <div className="flex items-center justify-between gap-1 h-14 mb-1">
                            {server.history.map((status, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex-1 h-full rounded-md opacity-90 transition-all hover:opacity-100",
                                        status === "up" && "bg-emerald-500",
                                        status === "down" && "bg-red-500",
                                        status === "unknown" && "bg-zinc-800"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Provider */}
                        <div className="flex items-center gap-3 text-zinc-500">
                             <div className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center">
                                {server.providerIcon && <DynamicIcon name={server.providerIcon} className="w-3 h-3 text-zinc-400" />}
                             </div>
                             {server.provider && <span className="text-sm">{server.provider}</span>}
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="mt-20 text-center border-t border-white/10 pt-8 w-full flex flex-col items-center">
             <div className="flex items-center gap-2 mb-4 opacity-50">
                  <Image src="/logo.png" alt="Logo" width={16} height={16} />
                  <span className="text-xs">© 2024 Sycord. Minden jog fenntartva.</span>
             </div>
             <div className="flex gap-4 text-xs text-zinc-600">
                 <span>Twitter</span>
                 <span>GitHub</span>
                 <span>Discord</span>
             </div>
        </div>
      </div>
    </div>
  )
}
