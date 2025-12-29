import Image from "next/image"
import Link from "next/link"
import { ServerStatusCard } from "@/components/server-status-card"

const servers = [
  {
    name: "server name",
    status: 200,
    provider: "Sycord ltd.",
    uptime: [
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, null, null, null
    ]
  },
  {
    name: "server name",
    status: 200,
    provider: "Cloudflare",
    uptime: [
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, null, null, null
    ]
  },
  {
    name: "server name",
    status: 200,
    provider: "Sycord ltd.",
    uptime: [
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, null, null, null
    ]
  },
]

export default function ServersPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12C8 10.8954 8.89543 10 10 10H16L20 14H30C31.1046 14 32 14.8954 32 16V28C32 29.1046 31.1046 30 30 30H10C8.89543 30 8 29.1046 8 28V12Z" fill="#666666"/>
          </svg>
          <h1 className="text-2xl font-semibold text-white">Servers</h1>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="relative w-full flex items-center justify-center">
          <img 
            src="/b2adf1e2-fe2d-479c-ad8a.jpeg"
            alt="World Map"
            className="w-full max-w-md opacity-50 invert brightness-50"
            style={{ filter: 'invert(1) brightness(0.4)' }}
          />
        </div>
      </div>

      {/* Status Indicator */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-4 rounded-full bg-emerald-500" />
          <p className="text-lg font-medium text-white">
            All system is <span className="text-emerald-500">operational</span>!
          </p>
        </div>
      </div>

      {/* Server Cards */}
      <div className="px-6 pb-8 space-y-8">
        {servers.map((server, index) => (
          <ServerStatusCard
            key={index}
            name={server.name}
            status={server.status}
            provider={server.provider}
            uptime={server.uptime}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#333333] px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-[#888888]">All service is operational</span>
          </div>

          {/* Logo and Copyright */}
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12C8 10.8954 8.89543 10 10 10H16L20 14H30C31.1046 14 32 14.8954 32 16V28C32 29.1046 31.1046 30 30 30H10C8.89543 30 8 29.1046 8 28V12Z" fill="#666666"/>
            </svg>
            <span className="text-sm text-[#888888]">© 2025 Sycord. Minden jog fenntartva.</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-[#888888] hover:text-white transition-colors">
              Twitter
            </Link>
            <Link href="#" className="text-sm text-[#888888] hover:text-white transition-colors">
              GitHub
            </Link>
            <Link href="#" className="text-sm text-[#888888] hover:text-white transition-colors">
              Discord
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
