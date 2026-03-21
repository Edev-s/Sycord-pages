"use client"

import { use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import DragDropBuilder from "@/components/drag-drop-builder"
import type { BuilderProject } from "@/lib/builder-store"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BuilderPageProps {
  params: Promise<{ id: string }>
}

export default function BuilderPage({ params }: BuilderPageProps) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [projectName, setProjectName] = useState("My Website")
  const [initialProject, setInitialProject] = useState<BuilderProject | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch project info and any existing builder state
  useEffect(() => {
    if (status !== "authenticated") return

    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${id}`)
        if (res.ok) {
          const data = await res.json()
          setProjectName(data.businessName ?? data.name ?? "My Website")
          // If the project has stored builder state, load it
          if (data.builderState) {
            setInitialProject(data.builderState as BuilderProject)
          }
        } else if (res.status !== 404) {
          console.warn(`[builder] Failed to load project (${res.status}): ${res.statusText}`)
        }
      } catch (err) {
        // Project may not exist yet or network issue — builder will start fresh
        console.warn("[builder] Could not fetch project:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [id, status])

  // Save the builder state back to the project
  const handleSave = async (project: BuilderProject) => {
    const res = await fetch(`/api/projects/${id}/builder-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ builderState: project }),
    })
    if (res.ok) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="relative h-screen flex flex-col">
      {/* Back button — floating over the builder toolbar (desktop only) */}
      <div className="hidden md:flex absolute top-3 left-[280px] z-40 items-center gap-2 pointer-events-none">
        <Link href="/dashboard" className="pointer-events-auto">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
        {saveSuccess && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium animate-in fade-in slide-in-from-left-2">
            ✓ Saved
          </span>
        )}
      </div>

      <DragDropBuilder
        projectId={id}
        projectName={projectName}
        initialProject={initialProject}
        onSave={handleSave}
      />
    </div>
  )
}
