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
          <Image
            src="/logo.png"
            alt="Sycord logo"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <h1 className="text-2xl font-semibold text-white">Servers</h1>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="relative w-full flex items-center justify-center">
          <Image 
            src="/hero-image.jpg"
            alt="Sycord hero graphic"
            width={640}
            height={313}
            className="opacity-50"
            style={{ filter: "invert(1) brightness(0.4)" }}
            priority
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
            <Image
              src="/logo.png"
              alt="Sycord logo"
              width={20}
              height={20}
              className="h-5 w-5"
              priority
            />
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
