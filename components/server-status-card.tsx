interface ServerStatusCardProps {
  name: string
  status: number
  provider: string
  uptime: (boolean | null)[]
}

export function ServerStatusCard({ name, status, provider, uptime }: ServerStatusCardProps) {
  const isOperational = status === 200

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#e5e5e5]">server name</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#e5e5e5]">{status}</span>
          <div 
            className={`w-3 h-3 rounded-full ${
              isOperational ? 'bg-emerald-500' : 'bg-red-500'
            }`} 
          />
        </div>
      </div>

      <div className="flex gap-1">
        {uptime.map((isUp, index) => (
          <div
            key={index}
            className={`h-12 w-4 rounded-md ${
              isUp === null 
                ? 'bg-[#4a4a4a]' 
                : isUp 
                  ? 'bg-emerald-500' 
                  : 'bg-red-500'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-[#4a4a4a]" />
        <span className="text-sm text-[#888888]">{provider}</span>
      </div>
    </div>
  )
}
