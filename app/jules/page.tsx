"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function JulesPage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/jules")
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch data")
        }

        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
        <p>Authenticating as dmarton336@gmail.com...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-red-500">
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-500 mb-2">Jules Investigation Dashboard</h1>
          <p className="text-zinc-400">Authenticated as: <span className="font-mono text-emerald-400">{data?.user?.email}</span></p>
        </div>

        <div className="bg-[#141414] rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Projects ({data?.user?.projects?.length || 0})</h2>

          <div className="space-y-6">
            {data?.user?.projects?.map((project: any, idx: number) => (
              <div key={idx} className="bg-[#1c1c1e] p-4 rounded border border-zinc-800">
                <h3 className="text-lg font-bold text-white mb-2">{project.businessName || "Unnamed Project"}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300">
                  <div>
                    <p><strong className="text-zinc-500">ID:</strong> <span className="font-mono text-xs text-emerald-400">{project._id}</span></p>
                    <p><strong className="text-zinc-500">Subdomain:</strong> {project.subdomain}</p>
                    <p><strong className="text-zinc-500">Deployed At:</strong> {project.deployedAt}</p>
                  </div>

                  <div>
                    <p><strong className="text-zinc-500">VPS ID:</strong> <span className="font-mono text-xs">{project.vpsProjectId}</span></p>
                    <p><strong className="text-zinc-500">GitHub ID:</strong> <span className="font-mono text-xs">{project.githubRepoId}</span></p>
                    <p><strong className="text-zinc-500">Cloudflare URL:</strong> <a href={project.cloudflareUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{project.cloudflareUrl}</a></p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <h4 className="font-semibold text-zinc-400 mb-2 text-xs uppercase tracking-wider">Git Connection</h4>
                  <pre className="bg-black/50 p-3 rounded font-mono text-[10px] overflow-x-auto text-zinc-400">
                    {JSON.stringify(project.git_connection || project.githubUrl || "None", null, 2)}
                  </pre>
                </div>
              </div>
            ))}

            {(!data?.user?.projects || data.user.projects.length === 0) && (
              <p className="text-zinc-500 italic">No projects found for this user.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
