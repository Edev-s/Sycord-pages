"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  Users,
  Zap,
  Shield,
  Trash2,
  Mail,
  Search,
  Menu,
  X,
  ArrowLeft,
  LogOut,
  BarChart3,
  Server,
  Activity,
  Check,
  Cloud,
  Database,
  Globe2,
  HardDrive,
  Network,
  Cpu,
  Wifi,
  Lock,
  Upload,
  Image as ImageIcon,
  Loader2,
  Save,
  RotateCcw,
  BookOpen,
  FileJson,
  BrainCircuit,
  ArrowRight,
  ArrowDown,
  Ban,
  UserCheck,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
  Calendar,
  ExternalLink,
  Terminal,
  Play,
  RefreshCw,
  GitBranch,
  FolderGit2,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react"

const availableIcons = [
  { name: "Server", icon: Server },
  { name: "Cloud", icon: Cloud },
  { name: "Database", icon: Database },
  { name: "Globe", icon: Globe2 },
  { name: "Network", icon: Network },
  { name: "Storage", icon: HardDrive },
  { name: "CPU", icon: Cpu },
  { name: "Wifi", icon: Wifi },
  { name: "Shield", icon: Shield },
  { name: "Lock", icon: Lock },
  { name: "Activity", icon: Activity },
]

interface User {
  userId: string
  email: string
  name: string
  projectCount: number
  isPremium: boolean
  isBlocked: boolean
  subscription: string
  ip: string
  createdAt: string
  websites: Array<{
    id: string
    businessName: string
    subdomain: string
    deployedAt: string | null
    vpsProjectId: string | null
    cloudflareUrl: string | null
    git_connection: {
      git_url: string
      git_token: string | null
      repo_id: string
      updated_at: string
    } | null
  }>
}

const tabs = [
  { id: "overview" as const, label: "Overview", icon: BarChart3 },
  { id: "users" as const, label: "Users", icon: Users },
  { id: "server" as const, label: "Server", icon: Server },
  { id: "runner" as const, label: "Runner", icon: Terminal },
  { id: "tickets" as const, label: "Tickets", icon: AlertCircle },
  { id: "paptos" as const, label: "Legal", icon: BookOpen },
]

type TabId = "overview" | "users" | "server" | "runner" | "tickets" | "paptos"


const ENV_VARS_CHECKLIST = [
  "MONGO_URI",
  "CLOUDFLARE_API_KEY",
  "CLOUDFLARE_ZONE_ID",
  "VPS_IP",
  "VPS_USERNAME",
  "VPS_PASSWORD",
  "VPS_SERVER_URL",
  "GOOGLE_AI_API",
  "GITHUB_API_TOKEN",
  "GITHUB_OWNER",
]

const SENSITIVE_ENV_VARS = new Set([
  "MONGO_URI",
  "CLOUDFLARE_API_KEY",
  "VPS_PASSWORD",
  "GOOGLE_AI_API",
  "GITHUB_API_TOKEN",
])

export default function AdminPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [monitors, setMonitors] = useState<any[]>([])
  const [monitorsLoading, setMonitorsLoading] = useState(false)
  const [editingIcon, setEditingIcon] = useState<string | null>(null)
  const [uploadingIcon, setUploadingIcon] = useState<string | null>(null)

  // Prompts State
  const [prompts, setPrompts] = useState({
    builderPlan: "",
    builderCode: "",
    autoFixDiagnosis: "",
    autoFixResolution: ""
  })
  const [promptsLoading, setPromptsLoading] = useState(false)
  const [promptsSaving, setPromptsSaving] = useState(false)

  // PAP & TOS State
  const [privacyPolicy, setPrivacyPolicy] = useState("Edit your privacy policy here...")
  const [termsOfService, setTermsOfService] = useState("Edit your terms of service here...")

  // Runner State
  const [runnerStatus, setRunnerStatus] = useState<any>(null)
  const [runnerLoading, setRunnerLoading] = useState(false)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [healthData, setHealthData] = useState<any>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [setupExpanded, setSetupExpanded] = useState(false)
  const [showTokens, setShowTokens] = useState<Set<string>>(new Set())
  const [envValues, setEnvValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    ENV_VARS_CHECKLIST.forEach(k => init[k] = "")
    return init
  })
  const [envSaving, setEnvSaving] = useState(false)
  const [setupAction, setSetupAction] = useState<string | null>(null)
  const [setupMessage, setSetupMessage] = useState<string | null>(null)
  const [deployingProject, setDeployingProject] = useState<string | null>(null)
  const [projectLogs, setProjectLogs] = useState<Record<string, string[]>>({})
  const [vpsProjects, setVpsProjects] = useState<any[]>([])
  const [vpsProjectsLoading, setVpsProjectsLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.email !== "dmarton336@gmail.com") {
      router.push("/dashboard")
      return
    }

    fetchUsers()
    fetchMonitors()
  }, [session, router])

  useEffect(() => {
    const query = searchQuery.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.userId.toLowerCase().includes(query),
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonitors = async () => {
    try {
      setMonitorsLoading(true)
      const response = await fetch("/api/servers/status")
      if (response.ok) {
        const data = await response.json()
        setMonitors(data.servers || [])
      }
    } catch (error) {
      console.error("Error fetching monitors:", error)
    } finally {
      setMonitorsLoading(false)
    }
  }

  const fetchPrompts = async () => {
      try {
          setPromptsLoading(true)
          const res = await fetch("/api/admin/prompts")
          if (res.ok) {
              const data = await res.json()
              setPrompts(data)
          }
      } catch (e) {
          console.error("Failed to fetch prompts", e)
          toast.error("Failed to fetch prompts")
      } finally {
          setPromptsLoading(false)
      }
  }

  const savePrompts = async () => {
      try {
          setPromptsSaving(true)
          const res = await fetch("/api/admin/prompts", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(prompts)
          })
          if (res.ok) {
              toast.success("Prompts updated globally")
          } else {
              throw new Error("Failed to save")
          }
      } catch (e) {
          console.error("Error saving prompts", e)
          toast.error("Failed to save prompts")
      } finally {
          setPromptsSaving(false)
      }
  }

  const updateMonitorIcon = async (id: string, icon: string, iconType: string = 'preset') => {
    try {
      const response = await fetch("/api/admin/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, icon, iconType }),
      })
      if (response.ok) {
        setMonitors(monitors.map(m => m.id === id ? { ...m, providerIcon: icon, iconType } : m))
        setEditingIcon(null)
      }
    } catch (error) {
      console.error("Error updating monitor icon:", error)
    }
  }

  const handleIconUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)')
      return
    }

    if (file.size > 1024 * 1024) {
      toast.error('Image must be smaller than 1MB')
      return
    }

    setUploadingIcon(id)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        await updateMonitorIcon(id, dataUrl, 'custom')
        toast.success('Icon uploaded successfully')
        setUploadingIcon(null)
      }
      reader.onerror = () => {
        toast.error('Error reading file')
        setUploadingIcon(null)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading icon:", error)
      toast.error('Error uploading icon')
      setUploadingIcon(null)
    }
  }

  const togglePremium = async (userId: string, isPremium: boolean) => {
    try {
      setUpdatingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}/premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: !isPremium }),
      })

      if (!response.ok) throw new Error("Failed to update premium status")

      setUsers(users.map((user) => (user.userId === userId ? { ...user, isPremium: !isPremium } : user)))

      console.log("[v0] Premium status updated for user:", userId)
    } catch (error) {
      console.error("[v0] Error updating premium:", error)
    } finally {
      setUpdatingUser(null)
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName} and all their websites? This cannot be undone.`)) {
      return
    }

    try {
      setUpdatingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete user")

      setUsers(users.filter((user) => user.userId !== userId))
      console.log("[v0] User deleted:", userId)
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      alert("Failed to delete user")
    } finally {
      setUpdatingUser(null)
    }
  }

  const fetchRunnerStatus = async () => {
    try {
      setRunnerLoading(true)
      const response = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      })
      if (!response.ok) throw new Error("Failed to fetch runner status")
      const data = await response.json()
      setRunnerStatus(data)
      toast.success("Runner status updated")
    } catch (error) {
      console.error("Error fetching runner status:", error)
      toast.error("Failed to fetch runner status")
    } finally {
      setRunnerLoading(false)
    }
  }

  const restartRunner = async () => {
    if (!confirm("Are you sure you want to restart the Flask server? This will briefly interrupt all deployments.")) return
    try {
      setRunnerLoading(true)
      const response = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      })
      if (!response.ok) throw new Error("Failed to restart runner")
      const data = await response.json()
      setRunnerStatus(data)
      toast.success("Runner restarted successfully")
    } catch (error) {
      console.error("Error restarting runner:", error)
      toast.error("Failed to restart runner")
    } finally {
      setRunnerLoading(false)
    }
  }

  const fetchHealthData = async () => {
    try {
      setHealthLoading(true)
      const response = await fetch("/api/runner/health")
      if (!response.ok) throw new Error("Health endpoint unreachable")
      const data = await response.json()
      // Extract resources from nested object if present
      const resources = data.resources || data
      setHealthData(resources)
      toast.success("Health data fetched")
    } catch (error) {
      console.error("Error fetching health data:", error)
      toast.error("Could not reach VPS health endpoint")
    } finally {
      setHealthLoading(false)
    }
  }

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleTokenVisibility = (key: string) => {
    setShowTokens(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const saveEnvToVps = async () => {
    try {
      setEnvSaving(true)
      const response = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write_env", envVars: envValues }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to save env")
      toast.success(data.message || "Environment variables saved")
    } catch (error: any) {
      toast.error(error.message || "Failed to save env variables")
    } finally {
      setEnvSaving(false)
    }
  }

  const runSetupAction = async (action: string) => {
    try {
      setSetupAction(action)
      setSetupMessage(null)
      const response = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Setup action failed")
      setSetupMessage(data.message || "Success")
      toast.success(data.message || "Done")
      if (data.authUrl) {
        window.open(data.authUrl, "_blank")
        setSetupMessage("Auth URL opened in new tab. Complete authorization, then run 'Config DNS'.")
      }
    } catch (error: any) {
      setSetupMessage(`Error: ${error.message}`)
      toast.error(error.message)
    } finally {
      setSetupAction(null)
    }
  }

  const deployProject = async (projectId: string) => {
    try {
      setDeployingProject(projectId)
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Deploy failed")
      toast.success(data.message || "Deployed successfully")
      if (data.logs) {
        setProjectLogs(prev => ({ ...prev, [projectId]: data.logs }))
      }
    } catch (error: any) {
      toast.error(error.message || "Deploy failed")
    } finally {
      setDeployingProject(null)
    }
  }

  const fetchProjectLogs = async (projectId: string) => {
    try {
      const response = await fetch(`/api/logs?project_id=${projectId}&limit=30`)
      const data = await response.json()
      if (data.success && data.logs) {
        setProjectLogs(prev => ({ ...prev, [projectId]: data.logs }))
      }
    } catch {
      toast.error("Failed to fetch logs")
    }
  }

  const fetchVpsProjects = async () => {
    try {
      setVpsProjectsLoading(true)
      const response = await fetch("/api/runner/projects")
      if (!response.ok) throw new Error("Failed to fetch VPS projects")
      const data = await response.json()
      setVpsProjects(data.projects || [])
      toast.success(`Found ${(data.projects || []).length} project(s) on VPS`)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch VPS projects")
    } finally {
      setVpsProjectsLoading(false)
    }
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500"
    if (percent >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getUsageTextColor = (percent: number) => {
    if (percent >= 90) return "text-red-500"
    if (percent >= 70) return "text-yellow-500"
    return "text-green-500"
  }

  const maskToken = (token: string | undefined) => {
    if (!token) return "—"
    if (token.length <= 8) return "••••••••"
    return token.slice(0, 4) + "••••" + token.slice(-4)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const toggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      setUpdatingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !isBlocked }),
      })

      if (!response.ok) throw new Error("Failed to update block status")

      setUsers(users.map((user) => (user.userId === userId ? { ...user, isBlocked: !isBlocked } : user)))
      toast.success(`User ${!isBlocked ? "blocked" : "unblocked"} successfully`)
    } catch (error) {
      console.error("[v0] Error updating block status:", error)
      toast.error("Failed to update block status")
    } finally {
      setUpdatingUser(null)
    }
  }

  const saveSubscription = async (userId: string, subscription: string) => {
    try {
      setUpdatingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      })

      if (!response.ok) throw new Error("Failed to update subscription")

      const isPremium = subscription !== "Free"
      setUsers(users.map((user) => (user.userId === userId ? { ...user, subscription, isPremium } : user)))
      toast.success(`Subscription updated to ${subscription}`)
    } catch (error) {
      console.error("[v0] Error updating subscription:", error)
      toast.error("Failed to update subscription")
    } finally {
      setUpdatingUser(null)
    }
  }

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "A"

  const blockedCount = users.filter(u => u.isBlocked).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header - matching dashboard style */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
              <span className="text-lg font-semibold text-foreground">Sycord</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 text-primary border-primary/20 font-semibold">
                Admin
              </Badge>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex items-center gap-2 mb-6 mt-4">
                  <Image src="/logo.png" alt="Logo" width={28} height={28} />
                  <span className="text-lg font-semibold">Admin Panel</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                          activeTab === tab.id
                            ? "text-foreground bg-accent"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {tab.label}
                      </button>
                    )
                  })}
                  <div className="border-t border-border mt-4 pt-4">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 w-full text-left"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Back to Dashboard
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userInitials}</AvatarFallback>
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
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Overview</h2>
              <p className="text-sm text-muted-foreground">Platform statistics at a glance</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{users.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Users</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.isPremium).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Premium Subscribers</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe2 className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {users.reduce((acc, u) => acc + u.projectCount, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Websites</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Ban className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{blockedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Blocked Users</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Users</h2>
                <p className="text-sm text-muted-foreground">{users.length} registered accounts</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background border-border text-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No users found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.userId} className="border-border overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* User Info */}
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-foreground">{user.name}</h3>
                                {user.email === "dmarton336@gmail.com" && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/5 text-primary border-primary/20">Admin</Badge>
                                )}
                                {user.isPremium && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                    {user.subscription === "Sycord Enterprise" ? "Enterprise" : "Sycord+"}
                                  </Badge>
                                )}
                                {user.isBlocked && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-red-500/10 text-red-500 border-red-500/20">Blocked</Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 mt-1">
                                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</span>
                              </div>

                              {/* Websites */}
                              {user.websites.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {user.websites.map((website) => (
                                    <a
                                      key={website.id}
                                      href={`https://${website.subdomain}.pages.dev`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 bg-accent/50 hover:bg-accent border border-border rounded-md px-2 py-1 text-xs transition-colors group"
                                    >
                                      <Globe2 className="h-3 w-3 text-muted-foreground" />
                                      <span className="font-medium text-foreground">{website.businessName}</span>
                                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-3 p-4 sm:p-5 border-t lg:border-t-0 lg:border-l border-border bg-accent/20 lg:w-52">
                          {/* Subscription */}
                          <div className="flex-1 lg:flex-none w-full">
                            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Plan</label>
                            <select
                              value={user.subscription || (user.isPremium ? "Sycord+" : "Free")}
                              onChange={(e) => saveSubscription(user.userId, e.target.value)}
                              disabled={updatingUser === user.userId}
                              className="w-full h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background disabled:opacity-50 transition-colors"
                            >
                              <option value="Free">Free</option>
                              <option value="Sycord+">Sycord+</option>
                              <option value="Sycord Enterprise">Enterprise</option>
                            </select>
                          </div>

                          {/* Block Toggle */}
                          <div className="flex items-center gap-2 lg:pt-1">
                            <Switch
                              checked={user.isBlocked}
                              onCheckedChange={() => toggleBlock(user.userId, user.isBlocked)}
                              disabled={updatingUser === user.userId}
                              className={user.isBlocked ? "data-[state=checked]:bg-red-500" : ""}
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {user.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </div>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-xs"
                            onClick={() => deleteUser(user.userId, user.name)}
                            disabled={updatingUser === user.userId}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Server Tab */}
        {activeTab === "server" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Server Monitors</h2>
              <p className="text-sm text-muted-foreground">Service status and configuration</p>
            </div>

            {monitorsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Loading monitors...</p>
              </div>
            ) : monitors.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <Server className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No monitors found</p>
                <p className="text-xs text-muted-foreground mt-1">Check your Cronitor configuration</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monitors.map((monitor) => (
                  <Card key={monitor.id} className="border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          monitor.statusCode === 200
                            ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]'
                            : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{monitor.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">{monitor.id}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-5 flex-shrink-0 ${
                            monitor.statusCode === 200
                              ? 'border-green-500/30 text-green-500 bg-green-500/5'
                              : 'border-red-500/30 text-red-500 bg-red-500/5'
                          }`}
                        >
                          {monitor.statusCode === 200 ? 'Online' : 'Offline'}
                        </Badge>
                      </div>

                      <div className="border-t border-border pt-4">
                        {editingIcon === monitor.id ? (
                          <div className="space-y-3 bg-accent/30 p-3 rounded-lg border border-border">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-foreground">Choose Icon</p>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingIcon(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div>
                              <p className="text-[11px] text-muted-foreground mb-2">Presets</p>
                              <div className="flex flex-wrap gap-1.5">
                                {availableIcons.map((item) => {
                                  const Icon = item.icon
                                  return (
                                    <button
                                      key={item.name}
                                      onClick={() => updateMonitorIcon(monitor.id, item.name, 'preset')}
                                      className={`p-2 rounded-md transition-colors ${
                                        monitor.providerIcon === item.name && monitor.iconType !== 'custom'
                                          ? 'bg-accent text-foreground ring-1.5 ring-primary'
                                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                      }`}
                                      title={item.name}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="border-t border-border pt-3">
                              <p className="text-[11px] text-muted-foreground mb-2">Custom (PNG/JPG, max 1MB)</p>
                              <label
                                htmlFor={`icon-upload-${monitor.id}`}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors text-xs font-medium"
                              >
                                {uploadingIcon === monitor.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload Image
                                  </>
                                )}
                                <input
                                  type="file"
                                  id={`icon-upload-${monitor.id}`}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => handleIconUpload(monitor.id, e)}
                                  disabled={uploadingIcon === monitor.id}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-accent/30 border border-border rounded-md">
                              {monitor.iconType === 'custom' ? (
                                <img
                                  src={monitor.providerIcon}
                                  alt="Custom icon"
                                  className="h-4 w-4 object-contain"
                                />
                              ) : (
                                (() => {
                                  const iconName = monitor.providerIcon || "Server"
                                  const iconEntry = availableIcons.find(i => i.name.toLowerCase() === iconName.toLowerCase())
                                  const Icon = iconEntry ? iconEntry.icon : Server
                                  return <Icon className="h-4 w-4 text-muted-foreground" />
                                })()
                              )}
                              <span className="text-xs font-medium text-foreground">
                                {monitor.iconType === 'custom' ? 'Custom' : (monitor.providerIcon || "Server")}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingIcon(monitor.id)}
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                              Change
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Runner Tab */}
        {activeTab === "runner" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Section 1: Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Runner Management</h2>
                <p className="text-sm text-muted-foreground">VPS server controls, health monitoring &amp; deployed projects</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchHealthData} disabled={healthLoading}>
                  {healthLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Activity className="h-3.5 w-3.5 mr-1.5" />}
                  Fetch Status
                </Button>
              </div>
            </div>

            {/* Section 2: System Resources */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Cpu className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className={`text-xs font-semibold ${getUsageTextColor(healthData?.cpu_percent ?? 0)}`}>
                      {healthData?.cpu_percent != null ? `${healthData.cpu_percent}%` : "—"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">CPU Usage</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-accent/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getUsageColor(healthData?.cpu_percent ?? 0)}`}
                      style={{ width: `${healthData?.cpu_percent ?? 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Database className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className={`text-xs font-semibold ${getUsageTextColor(healthData?.ram_percent ?? 0)}`}>
                      {healthData?.ram_percent != null ? `${healthData.ram_percent}%` : "—"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">RAM Usage</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-accent/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getUsageColor(healthData?.ram_percent ?? 0)}`}
                      style={{ width: `${healthData?.ram_percent ?? 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <HardDrive className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className={`text-xs font-semibold ${getUsageTextColor(healthData?.disk_percent ?? 0)}`}>
                      {healthData?.disk_percent != null ? `${healthData.disk_percent}%` : "—"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">Storage</p>
                  <div className="mt-2 h-2 w-full rounded-full bg-accent/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getUsageColor(healthData?.disk_percent ?? 0)}`}
                      style={{ width: `${healthData?.disk_percent ?? 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 3: Server Status & Controls — Compact */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-sm font-semibold">Server Status</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          runnerStatus?.flask_running
                            ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                            : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          Flask {runnerStatus?.flask_running ? "Running" : runnerStatus ? "Stopped" : "—"}
                        </span>
                        {runnerStatus?.flask_pid && (
                          <span className="text-[10px] font-mono text-muted-foreground/70">PID {runnerStatus.flask_pid}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          runnerStatus?.tunnel_running
                            ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]"
                            : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          Tunnel {runnerStatus?.tunnel_running ? "Running" : runnerStatus ? "Stopped" : "—"}
                        </span>
                        {runnerStatus?.tunnel_pid && (
                          <span className="text-[10px] font-mono text-muted-foreground/70">PID {runnerStatus.tunnel_pid}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchRunnerStatus} disabled={runnerLoading}>
                      {runnerLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                      Check Status
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={restartRunner} disabled={runnerLoading}>
                      {runnerLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                      Restart Server
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {runnerStatus && (
                  <>
                    {runnerStatus.flask_log && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                          Flask Log (last 10 lines)
                        </summary>
                        <pre className="mt-2 p-3 bg-accent/20 border border-border rounded-lg text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-48 whitespace-pre-wrap">
                          {runnerStatus.flask_log}
                        </pre>
                      </details>
                    )}

                    {runnerStatus.tunnel_log && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                          Tunnel Log (last 10 lines)
                        </summary>
                        <pre className="mt-2 p-3 bg-accent/20 border border-border rounded-lg text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-48 whitespace-pre-wrap">
                          {runnerStatus.tunnel_log}
                        </pre>
                      </details>
                    )}
                  </>
                )}

                {!runnerStatus && !runnerLoading && (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg">
                    <Terminal className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Click &quot;Check Status&quot; to fetch server information</p>
                  </div>
                )}

                {runnerLoading && !runnerStatus && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Contacting VPS...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 4: Server Setup (accordion) */}
            <Card className="border-border">
              <CardHeader className="pb-0">
                <button
                  onClick={() => setSetupExpanded(!setupExpanded)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Server Setup
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Environment variables, quick actions &amp; initial configuration
                    </CardDescription>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${setupExpanded ? "" : "-rotate-90"}`} />
                </button>
              </CardHeader>

              {setupExpanded && (
                <CardContent className="pt-4 space-y-5">
                  {/* Warning banner */}
                  <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      ⚠ Only 1 Flask server + tunnel on the Ubuntu. Don&apos;t overload.
                    </p>
                  </div>

                  {/* 4a: Environment Variables Editor */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
                      Environment Variables (.env)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ENV_VARS_CHECKLIST.map((envVar) => (
                        <div key={envVar} className="flex items-center gap-2">
                          <label className="text-[11px] font-mono text-muted-foreground w-36 flex-shrink-0 truncate" title={envVar}>
                            {envVar}
                          </label>
                          <div className="relative flex-1">
                            <Input
                              type={SENSITIVE_ENV_VARS.has(envVar) && !showTokens.has(envVar) ? "password" : "text"}
                              value={envValues[envVar] || ""}
                              onChange={(e) => setEnvValues(prev => ({ ...prev, [envVar]: e.target.value }))}
                              placeholder={envVar}
                              className="h-8 text-xs font-mono pr-8"
                            />
                            {SENSITIVE_ENV_VARS.has(envVar) && (
                              <button
                                type="button"
                                onClick={() => toggleTokenVisibility(envVar)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showTokens.has(envVar) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="h-8 text-xs" onClick={saveEnvToVps} disabled={envSaving}>
                      {envSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                      Save .env to VPS
                    </Button>
                  </div>

                  {/* 4b: Quick Setup Actions */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-foreground">Quick Setup Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Init VPS", action: "init" },
                        { label: "Auth Tunnel", action: "auth" },
                        { label: "Config DNS", action: "config" },
                        { label: "Start Server", action: "start_server" },
                      ].map(({ label, action }) => (
                        <Button
                          key={action}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={setupAction !== null}
                          onClick={() => {
                            if (action === "start_server") {
                              runSetupAction("start_server")
                            } else {
                              runSetupAction(action)
                            }
                          }}
                        >
                          {setupAction === action ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Play className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          {label}
                        </Button>
                      ))}
                    </div>
                    {setupMessage && (
                      <div className={`p-2.5 rounded-lg border text-xs ${
                        setupMessage.startsWith("Error")
                          ? "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400"
                      }`}>
                        {setupMessage}
                      </div>
                    )}
                  </div>

                  {/* 4c: Link to full wizard */}
                  <div className="pt-1">
                    <Link href="/setup" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      Need full SSH wizard? Open Setup Page <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Section 5: Deployed Projects */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                  Deployed Projects
                </CardTitle>
                <CardDescription className="text-xs">
                  Browse user projects, deploy &amp; view logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Loading projects...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-lg">
                    <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.userId} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleUserExpanded(user.userId)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{user.name}</p>
                              <p className="text-[11px] text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                              {user.projectCount} project{user.projectCount !== 1 ? "s" : ""}
                            </Badge>
                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedUsers.has(user.userId) ? "rotate-90" : ""}`} />
                          </div>
                        </button>

                        {expandedUsers.has(user.userId) && (
                          <div className="border-t border-border bg-accent/10 px-4 py-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
                              <span>Users</span>
                              <ChevronRight className="h-3 w-3" />
                              <span className="text-foreground font-medium">{user.name}</span>
                              <ChevronRight className="h-3 w-3" />
                              <span>projects</span>
                            </div>

                            {user.websites.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">No projects</p>
                            ) : (
                              <div className="space-y-2">
                                {user.websites.map((site) => (
                                  <div key={site.id} className="bg-background border border-border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">{site.businessName}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                                          site.deployedAt
                                            ? "border-green-500/30 text-green-500 bg-green-500/5"
                                            : "border-muted-foreground/30 text-muted-foreground bg-muted/5"
                                        }`}>
                                          {site.deployedAt ? "Deployed" : "Not Deployed"}
                                        </Badge>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 text-[10px] px-2"
                                          disabled={deployingProject === site.id}
                                          onClick={(e) => { e.stopPropagation(); deployProject(site.id) }}
                                        >
                                          {deployingProject === site.id ? (
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          ) : (
                                            <Upload className="h-3 w-3 mr-1" />
                                          )}
                                          Deploy
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 text-[10px] px-2"
                                          onClick={(e) => { e.stopPropagation(); fetchProjectLogs(site.id) }}
                                        >
                                          <Terminal className="h-3 w-3 mr-1" />
                                          View Logs
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                                      <div className="text-[11px]">
                                        <span className="text-muted-foreground">Subdomain: </span>
                                        {site.subdomain ? (
                                          <a
                                            href={site.cloudflareUrl || `https://${site.subdomain}.sycord.site`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline font-mono"
                                          >
                                            {site.subdomain}.sycord.site
                                          </a>
                                        ) : (
                                          <span className="font-mono text-muted-foreground">—</span>
                                        )}
                                      </div>
                                      <div className="text-[11px]">
                                        <span className="text-muted-foreground">Project ID: </span>
                                        <span className="font-mono text-foreground">{site.id}</span>
                                      </div>
                                      {site.deployedAt && (
                                        <div className="text-[11px]">
                                          <span className="text-muted-foreground">Deployed: </span>
                                          <span className="text-foreground">{new Date(site.deployedAt).toLocaleDateString()}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* git_connection details */}
                                    {site.git_connection ? (
                                      <div className="mt-3 p-2.5 bg-accent/30 border border-border rounded-md space-y-1.5">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <FolderGit2 className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-[11px] font-semibold text-foreground">git_connection</span>
                                        </div>
                                        <div className="text-[11px]">
                                          <span className="text-muted-foreground">git_url: </span>
                                          <span className="font-mono text-foreground break-all">{site.git_connection.git_url}</span>
                                        </div>
                                        <div className="text-[11px] flex items-center gap-1">
                                          <span className="text-muted-foreground">git_token: </span>
                                          {site.git_connection.git_token ? (
                                            <span className="font-mono text-green-500">{maskToken(site.git_connection.git_token)}</span>
                                          ) : (
                                            <span className="font-mono text-muted-foreground">null</span>
                                          )}
                                        </div>
                                        <div className="text-[11px]">
                                          <span className="text-muted-foreground">repo_id: </span>
                                          <span className="font-mono text-foreground">{site.git_connection.repo_id}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-3 p-2.5 bg-accent/10 border border-dashed border-border rounded-md">
                                        <p className="text-[11px] text-muted-foreground">No git_connection — project not yet deployed via runner</p>
                                      </div>
                                    )}

                                    {/* Inline logs panel */}
                                    {projectLogs[site.id] && projectLogs[site.id].length > 0 && (
                                      <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[11px] font-medium text-muted-foreground">Recent Logs</span>
                                          <button
                                            onClick={() => setProjectLogs(prev => { const next = { ...prev }; delete next[site.id]; return next })}
                                            className="text-[10px] text-muted-foreground hover:text-foreground"
                                          >
                                            Close
                                          </button>
                                        </div>
                                        <pre className="p-2.5 bg-accent/20 border border-border rounded-lg text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-36 whitespace-pre-wrap">
                                          {projectLogs[site.id].join("\n")}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 6: VPS On-Disk Projects */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      VPS On-Disk Projects
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Projects deployed on the Flask VPS server — what visitors actually see
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchVpsProjects} disabled={vpsProjectsLoading}>
                    {vpsProjectsLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {vpsProjectsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Fetching projects from VPS...</p>
                  </div>
                ) : vpsProjects.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-lg">
                    <HardDrive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No projects on VPS yet. Click &quot;Refresh&quot; to scan.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vpsProjects.map((proj: any) => (
                      <div key={proj.project_id} className="bg-accent/20 border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground font-mono">{proj.project_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {proj.subdomain && (
                              <a
                                href={`https://${proj.subdomain}.sycord.site`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary hover:underline flex items-center gap-1"
                              >
                                {proj.subdomain}.sycord.site
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                              proj.build?.success === true
                                ? "border-green-500/30 text-green-500 bg-green-500/5"
                                : proj.build?.success === false
                                ? "border-red-500/30 text-red-500 bg-red-500/5"
                                : "border-muted-foreground/30 text-muted-foreground bg-muted/5"
                            }`}>
                              {proj.build?.success === true ? "Built" : proj.build?.success === false ? "Build Failed" : proj.build?.attempted ? "Building" : "Static"}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-muted-foreground">Files: </span>
                            <span className="text-foreground font-medium">{proj.files_count ?? "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Domain: </span>
                            <span className="text-foreground font-mono">{proj.domain || "—"}</span>
                          </div>
                          {proj.deployed_at && (
                            <div>
                              <span className="text-muted-foreground">Deployed: </span>
                              <span className="text-foreground">{new Date(proj.deployed_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        {proj.build?.error && (
                          <div className="mt-2 p-2 bg-red-500/5 border border-red-500/20 rounded text-[11px] text-red-500">
                            Build error: {proj.build.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tickets</h2>
              <p className="text-sm text-muted-foreground">Support ticket management</p>
            </div>
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-lg">
              <AlertCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">Coming soon</p>
              <p className="text-xs text-muted-foreground mt-1">Support ticket system is under development</p>
            </div>
          </div>
        )}

        {/* PAP & TOS Tab */}
        {activeTab === "paptos" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Legal Documents</h2>
              <p className="text-sm text-muted-foreground">Privacy policy and terms of service</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Privacy Policy</CardTitle>
                  <CardDescription className="text-xs">Adatvédelmi Irányelvek</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    className="font-mono text-xs min-h-[280px] bg-accent/20 border-border leading-relaxed resize-none"
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                  />
                  <Button
                    onClick={() => toast.success("Privacy policy saved")}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Terms of Service</CardTitle>
                  <CardDescription className="text-xs">ÁSZF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    className="font-mono text-xs min-h-[280px] bg-accent/20 border-border leading-relaxed resize-none"
                    value={termsOfService}
                    onChange={(e) => setTermsOfService(e.target.value)}
                  />
                  <Button
                    onClick={() => toast.success("Terms of service saved")}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
