"use client"

import { useState } from "react"
import { AlertCircle, Trash2, Edit2, CheckCircle2, Package, Sparkles, Zap, Loader2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface WebsitePreviewCardProps {
  domain: string
  isLive: boolean
  deploymentId?: string
  projectId?: string
  businessName?: string
  createdAt?: string
  onDelete?: (deploymentId: string) => void
  style?: string
}

export function WebsitePreviewCard({
  domain,
  isLive,
  deploymentId,
  projectId,
  businessName = "Website",
  createdAt = new Date().toISOString(),
  onDelete,
  style = "default",
}: WebsitePreviewCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!projectId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        console.log("[v0] Project deleted successfully")
        onDelete?.(projectId)
      } else {
        alert("Failed to delete project")
      }
    } catch (error) {
      console.error("[v0] Error deleting project:", error)
      alert("Error deleting project")
    } finally {
      setIsDeleting(false)
    }
  }

  const formattedDate = new Date(createdAt).toLocaleDateString("hu-HU")

  const getWebsiteIcon = () => {
    switch (style) {
      case "default":
        return Package
      case "browse":
        return Sparkles
      case "ai":
        return Zap
      default:
        return Package
    }
  }

  const WebsiteIcon = getWebsiteIcon()

  return (
    <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col hover:border-white/10 transition-colors">
      {!isLive ? (
        <div className="w-full h-40 sm:h-56 md:h-72 bg-gradient-to-br from-zinc-900 to-black/50 rounded-t-xl flex flex-col items-center justify-center border-b border-white/5 relative group">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-lg opacity-30 animate-pulse" />
                <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                   <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-zinc-200 mb-1">Building Project</p>
            <p className="text-xs text-zinc-500">Waiting for deployment...</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-48 sm:h-72 md:h-[28rem] bg-zinc-950 overflow-hidden group">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/20"></div>
            </div>
          )}

          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
              <div className="text-center">
                <Globe className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">Preview unavailable</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-hidden flex items-start justify-start select-none pointer-events-none">
              <iframe
                src={domain.startsWith("http") ? domain : `https://${domain}`}
                className="w-[1440px] h-[1440px] border-none origin-top-left scale-[0.85] sm:scale-[0.95] md:scale-[1.05] lg:scale-[1.1] grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true)
                  setImageLoading(false)
                }}
                title={`Preview of ${domain}`}
                sandbox="allow-same-origin allow-scripts allow-forms"
                tabIndex={-1}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 pointer-events-none" />

          {/* Domain and Live Badge */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-20">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6 w-6 rounded-md bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <WebsiteIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <a href={domain.startsWith("http") ? domain : `https://${domain}`} target="_blank" className="text-zinc-200 hover:text-white text-xs font-medium truncate underline-offset-4 hover:underline transition-colors">
                  {domain}
              </a>
            </div>
            {isLive && (
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col justify-between flex-1 border-t border-white/5 bg-zinc-900/50">
        <div className="flex-1">
          <h3 className="font-medium text-sm text-zinc-100 mb-1">{businessName}</h3>
          <p className="text-[10px] text-zinc-500">Created {formattedDate}</p>
        </div>
        <div className="flex gap-2 mt-4 justify-between">
          <Link href={`/dashboard/sites/${projectId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 h-8 text-xs" size="sm">
              <Edit2 className="h-3 w-3 mr-2" />
              Edit
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="px-3 h-8 bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-400 border border-red-500/10 flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-950 border-white/10 text-zinc-100">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  This action cannot be undone. This will permanently delete your project
                  and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-zinc-300">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-900/50 text-red-200 hover:bg-red-900/70 border border-red-500/20">
                  Delete Project
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
