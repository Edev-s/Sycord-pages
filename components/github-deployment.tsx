"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  Loader2,
  ExternalLink,
  Github,
  Rocket,
  Settings,
  Upload,
  Cloud,
  GitBranch,
  Terminal,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GitHubDeploymentProps {
  projectId: string
  projectName: string
}

interface LogEntry {
  message: string
  type: "info" | "success" | "error"
  timestamp: string
}

interface AuthStatus {
  isAuthenticated: boolean
  username: string | null
  owner: string | null
  repo: string | null
  usingEnvCredentials?: boolean
}

export function GitHubDeployment({ projectId, projectName }: GitHubDeploymentProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // Form state
  const [repoName, setRepoName] = useState("")

  // Result state
  const [githubUrl, setGithubUrl] = useState<string | null>(null)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, { message, type, timestamp }])
  }

  const fetchAuthStatus = async () => {
    setLoadingStatus(true)
    try {
      const response = await fetch(`/api/github/auth?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setAuthStatus(data)
        if (data.repo && data.owner) {
          setGithubUrl(`https://github.com/${data.owner}/${data.repo}`)
        }
      }
    } catch (err) {
      console.error("[GitHub] Failed to fetch auth status:", err)
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchAuthStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleSaveToGitHub = async () => {
    if (!authStatus?.isAuthenticated) {
      setError("GitHub is not configured. Please set GITHUB_API_TOKEN and GITHUB_OWNER environment variables.")
      return
    }

    setIsSaving(true)
    setError(null)
    setLogs([])

    try {
      addLog("📤 Saving files to GitHub...", "info")

      const response = await fetch("/api/github/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repoName: repoName || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save to GitHub")
      }

      const result = await response.json()
      
      addLog(`✅ Saved ${result.filesCount} files to GitHub!`, "success")
      addLog(`📁 Repository: ${result.url}`, "success")
      
      setGithubUrl(result.url)
      setRepoName("")
      await fetchAuthStatus()
    } catch (err: any) {
      console.error("[GitHub] Save error:", err)
      setError(err.message || "Failed to save to GitHub")
      addLog(`❌ Error: ${err.message}`, "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeployFromGitHub = async () => {
    if (!authStatus?.repo) {
      setError("Please save to GitHub first")
      return
    }

    setIsDeploying(true)
    setError(null)
    setLogs([])

    try {
      addLog("🚀 Starting deployment from GitHub to Cloudflare...", "info")
      addLog(`📦 Source: ${authStatus.owner}/${authStatus.repo}`, "info")

      const response = await fetch("/api/github/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Deployment failed")
      }

      const result = await response.json()
      
      addLog(`✅ Deployed ${result.source.filesCount} files!`, "success")
      addLog(`🌐 Live at: ${result.url}`, "success")
      
      setDeploymentUrl(result.url)
    } catch (err: any) {
      console.error("[GitHub] Deploy error:", err)
      setError(err.message || "Deployment failed")
      addLog(`❌ Error: ${err.message}`, "error")
    } finally {
      setIsDeploying(false)
    }
  }

  if (loadingStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {!authStatus?.isAuthenticated ? (
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-muted rounded-full">
              <Github className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">GitHub Not Configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                GitHub integration requires server-side configuration. Please ensure the GITHUB_API_TOKEN and GITHUB_OWNER environment variables are set.
              </p>
            </div>
            {error && (
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      ) : (
        <div className="divide-y divide-border">
          {/* Header Section */}
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5" />
                <h3 className="text-xl font-bold">
                  {authStatus.repo ? `${authStatus.owner}/${authStatus.repo}` : `@${authStatus.username}`}
                </h3>
                <div
                  className={`h-3 w-3 rounded-full ${
                    authStatus.repo ? "bg-green-500" : "bg-yellow-500"
                  } shadow-sm ring-2 ring-background`}
                />
              </div>
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {githubUrl} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleSaveToGitHub}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Save to GitHub
              </Button>

              <Button
                onClick={handleDeployFromGitHub}
                disabled={isDeploying || !authStatus.repo}
                className="flex-1 sm:flex-none"
              >
                {isDeploying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 h-4 w-4" />
                )}
                Deploy
              </Button>
            </div>
          </div>

          {/* Status Section */}
          <div className="p-6 bg-muted/10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background border rounded-md shadow-sm">
                <Github className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Account
                </p>
                <p className="font-medium text-sm">@{authStatus.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-background border rounded-md shadow-sm">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Repository
                </p>
                <p className="font-medium text-sm">
                  {authStatus.repo || "Not created"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-background border rounded-md shadow-sm">
                <Cloud className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Deployment
                </p>
                <p className="font-medium text-sm truncate max-w-[200px]">
                  {deploymentUrl ? (
                    <a
                      href={deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      {deploymentUrl.replace("https://", "")}
                    </a>
                  ) : (
                    "Not deployed"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Repository Name Input (when no repo exists) */}
          {!authStatus.repo && (
            <div className="p-4 bg-yellow-500/10 border-y border-yellow-500/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="repoName" className="text-sm font-medium">
                    Repository Name (optional)
                  </Label>
                  <Input
                    id="repoName"
                    placeholder={projectName.toLowerCase().replace(/\s+/g, "-")}
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use project name
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Logs Section */}
          <div className="bg-muted/5">
            <details className="group">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  Activity Logs
                </span>
                <Settings className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
              </summary>

              <div className="p-4 border-t border-border/50 space-y-4">
                {logs.length > 0 ? (
                  <div className="rounded-md bg-black/90 p-3 max-h-48 overflow-y-auto font-mono text-xs text-white">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className={`py-0.5 border-b border-white/10 last:border-0 ${
                          log.type === "error"
                            ? "text-red-400"
                            : log.type === "success"
                            ? "text-green-400"
                            : "text-gray-300"
                        }`}
                      >
                        <span className="opacity-50 mr-2">[{log.timestamp}]</span>
                        {log.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4 italic">
                    No logs available for this session.
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      )}
    </Card>
  )
}
