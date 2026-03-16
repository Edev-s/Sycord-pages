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
  Calendar,
  ExternalLink
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
  websites: Array<{ id: string; businessName: string; subdomain: string }>
}

const tabs = [
  { id: "overview" as const, label: "Overview", icon: BarChart3 },
  { id: "users" as const, label: "Users", icon: Users },
  { id: "server" as const, label: "Server", icon: Server },
  { id: "tickets" as const, label: "Tickets", icon: AlertCircle },
  { id: "paptos" as const, label: "Legal", icon: BookOpen },
]

type TabId = "overview" | "users" | "server" | "tickets" | "paptos"

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
