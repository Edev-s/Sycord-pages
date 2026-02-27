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

// Preview iframe dimensions and scale
// 1440x810 = 16:9 aspect ratio
// Scale 0.28 fits the preview into typical card sizes
const PREVIEW_IFRAME_WIDTH = 1440
const PREVIEW_IFRAME_HEIGHT = 810
const PREVIEW_SCALE = 0.28

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
    <div className="border border-[#E2E8F0] bg-white rounded-xl overflow-hidden flex flex-col hover:border-[#64748B]/30 hover:shadow-sm transition-all">
      {!isLive ? (
        <div className="w-full aspect-video bg-[#F8F9FA] rounded-t-xl flex flex-col items-center justify-center border-b border-[#E2E8F0] relative group">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] flex items-center justify-center">
                   <Loader2 className="h-4 w-4 text-[#64748B] animate-spin stroke-[1.5]" />
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-[#0F172A] mb-1">Building Project</p>
            <p className="text-xs text-[#64748B]">Propagating to edge network...</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full aspect-video bg-[#F8F9FA] overflow-hidden group">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#F8F9FA] z-10">
              <div className="h-5 w-5 rounded-full border-2 border-[#E2E8F0] border-t-[#64748B] animate-spin"></div>
            </div>
          )}

          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-[#F8F9FA]">
              <div className="text-center">
                <Globe className="h-6 w-6 text-[#64748B] mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs text-[#64748B]">Preview unavailable</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-hidden flex items-start justify-start select-none pointer-events-none">
              <iframe
                src={domain.startsWith("http") ? domain : `https://${domain}`}
                className="w-[1440px] h-[810px] border-none origin-top-left scale-[0.28] grayscale-[5%] group-hover:grayscale-0 transition-all duration-500"
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Domain and Live Badge */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-20">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-5 w-5 rounded-md bg-white/90 border border-[#E2E8F0] flex items-center justify-center shrink-0">
                  <WebsiteIcon className="h-3 w-3 text-[#0F172A] stroke-[1.5]" />
              </div>
              <a href={domain.startsWith("http") ? domain : `https://${domain}`} target="_blank" className="text-[#0F172A] hover:text-[#64748B] text-xs font-medium truncate underline-offset-4 hover:underline transition-colors">
                  {domain}
              </a>
            </div>
            {isLive && (
              <div className="flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-lg border border-[#E2E8F0] backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F172A] opacity-40"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0F172A]"></span>
                </span>
                <span className="text-[10px] font-medium text-[#0F172A] uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col justify-between flex-1 border-t border-[#E2E8F0] bg-white">
        <div className="flex-1">
          <h3 className="font-medium text-sm text-[#0F172A] mb-1">{businessName}</h3>
          <p className="text-[10px] text-[#64748B]">Created {formattedDate}</p>
        </div>
        <div className="flex gap-2 mt-4 justify-between">
          <Link href={`/dashboard/sites/${projectId}`} className="flex-1">
            <Button variant="outline" className="w-full bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9FA] h-8 text-xs" size="sm">
              <Edit2 className="h-3 w-3 mr-2 stroke-[1.5]" />
              Edit
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="px-3 h-8 bg-white hover:bg-[#F8F9FA] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin stroke-[1.5]" /> : <Trash2 className="h-3 w-3 stroke-[1.5]" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-[#E2E8F0] text-[#0F172A]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                <AlertDialogDescription className="text-[#64748B]">
                  This action cannot be undone. This will permanently delete your project
                  and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border-[#E2E8F0] hover:bg-[#F8F9FA] text-[#64748B]">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90">
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
