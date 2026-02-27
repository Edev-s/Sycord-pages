"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Settings, Plus, LogOut, User, Menu, TriangleAlert, Search, LayoutTemplate } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { WebsitePreviewCard } from "@/components/website-preview-card"
import { CreateProjectModal } from "@/components/create-project-modal"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingDeployments, setDeletingDeployments] = useState<Set<string>>(new Set())
  const [flaggedDeployments, setFlaggedDeployments] = useState<Set<string>>(new Set())
  const [debugError, setDebugError] = useState<string | null>(null)

  // Check for auto-open modal query param and errors
  useEffect(() => {
    const openCreateModal = searchParams.get("open_create_modal")
    const error = searchParams.get("error")

    if (error) {
      setDebugError(error)
      // Clean up URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      window.history.replaceState({}, "", newUrl.toString())
    }

    if (openCreateModal === "true") {
        setIsModalOpen(true)
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("open_create_modal")
        window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/projects")
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchProjects()
    }
  }, [status])

  if (status === "loading") {
    return (
       <div className="min-h-screen bg-background md:ml-16 p-6">
         <div className="container mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {[1, 2, 3].map((i) => (
                   <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
               ))}
            </div>
         </div>
       </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <nav className="flex flex-col gap-4 mt-8">
          <Link href="/dashboard" className="text-sm text-foreground font-medium px-4 py-2 hover:bg-accent rounded-md">
            Áttekintés
          </Link>
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-accent rounded-md"
          >
            Projektek
          </Link>
          <Link
            href="/subscriptions"
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-accent rounded-md"
          >
            Plans
          </Link>
          <Link
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-accent rounded-md"
          >
            Analitika
          </Link>
          <Link
            href="/dashboard/webshop-demo"
            className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 hover:bg-accent rounded-md"
          >
            Webshop Demo
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )

  const handleDeleteProject = async (projectId: string) => {
    // The actual API call is handled inside WebsitePreviewCard for now,
    // or we can move it here.
    // Given the component structure, WebsitePreviewCard handles the fetch,
    // and calls this callback on success.
    // So we just need to update the local state.

    setProjects((prevProjects: any) =>
      prevProjects.filter((p: any) => p._id !== projectId)
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background md:ml-16">
        <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
                <span className="text-xl font-semibold text-foreground">Sycord</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm text-foreground font-medium">
                  Áttekintés
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Projektek
                </Link>
                <Link
                  href="/subscriptions"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Plans
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Analitika
                </Link>
                <Link
                  href="/dashboard/webshop-demo"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Webshop Demo
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <MobileNav />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Beállítások</span>
                  </DropdownMenuItem>
                  {session?.user?.email === "dmarton336@gmail.com" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span className="text-primary font-semibold">Admin Panel</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Kijelentkezés</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 md:py-8 pb-20 md:pb-6">
          <div className="flex flex-col gap-4 mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-foreground">Projektek</h1>
              <Button onClick={() => setIsModalOpen(true)} className="w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Új Projekt
              </Button>
            </div>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Keresés a webhelyek között..."
                  className="w-full pl-10 pr-4 py-3 border border-input rounded-xl bg-background/50 backdrop-blur-sm text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="px-4 py-3 border border-input rounded-xl bg-muted/50 backdrop-blur-sm text-sm font-medium whitespace-nowrap">
                {projects.length}/3
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-lg overflow-hidden flex flex-col h-[300px]">
                   <Skeleton className="h-full w-full" />
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center bg-white">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Még nincsenek projektek</h3>
                <p className="text-sm text-[#64748B] mb-6">
                  Kezdje el első projektjét, és indítsa el weboldalát {"{"}name{"}"}.ltpd.xyz címen
                </p>
                <Button onClick={() => setIsModalOpen(true)} className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90">
                  <Plus className="h-4 w-4 mr-2 stroke-[1.5]" />
                  Első Projekt Létrehozása
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {projects.map((project: any) => (
                <div
                  key={project._id}
                  className="group relative"
                >
                  {project.domain && project.deploymentId ? (
                    <WebsitePreviewCard
                      domain={project.cloudflareUrl || project.domain}
                      isLive={!flaggedDeployments.has(project.deploymentId)}
                      deploymentId={project.deploymentId}
                      projectId={project._id}
                      businessName={project.businessName}
                      createdAt={project.createdAt}
                      style={project.style || "default"}
                      onDelete={() => handleDeleteProject(project._id)}
                    />
                  ) : (
                    <div className="border border-[#E2E8F0] bg-white rounded-xl overflow-hidden flex flex-col hover:border-[#64748B]/30 hover:shadow-sm transition-all">
                      <div className="w-full aspect-video bg-[#F8F9FA] flex flex-col items-center justify-center group-hover:bg-[#F8F9FA]/70 transition-colors">
                        <div className="h-12 w-12 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center mb-3 shadow-sm">
                          <LayoutTemplate className="h-6 w-6 text-[#64748B]" />
                        </div>
                        <h3 className="font-medium text-[#0F172A] mb-1 text-sm">{project.businessName}</h3>
                        <p className="text-xs text-[#64748B] mb-4">Not published yet</p>
                        <Button variant="outline" size="sm" className="border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9FA]" onClick={() => router.push(`/dashboard/sites/${project._id}`)}>
                          Edit Project
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Debug Error Popup */}
      <Dialog open={!!debugError} onOpenChange={(open) => !open && setDebugError(null)}>
        <DialogContent className="sm:max-w-md border-red-200 bg-red-50 dark:bg-red-950/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <TriangleAlert className="h-5 w-5" />
              Authentication Error
            </DialogTitle>
            <DialogDescription className="text-red-600/90 dark:text-red-400/90">
              An error occurred during the authentication process.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-white dark:bg-black/20 rounded-md border border-red-100 dark:border-red-900/50 font-mono text-sm break-all">
            {debugError}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDebugError(null)} className="border-red-200 hover:bg-red-100 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/40">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
