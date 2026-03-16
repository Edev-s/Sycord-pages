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
  UserCheck
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

export default function AdminPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "server" | "tickets" | "paptos">("overview")
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

  if (!session?.user?.email?.includes("dmarton336@gmail.com")) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mobile Navigation Controls */}
      <div className="fixed top-4 left-4 z-30 md:hidden">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="shadow-lg bg-background/60 backdrop-blur-md border border-border text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="shadow-lg bg-background/60 backdrop-blur-md border border-border text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } backdrop-blur-xl bg-sidebar border-r border-sidebar-border flex flex-col`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-8 text-sidebar-foreground">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg truncate">Admin Panel</span>
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "overview"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium text-sm">Overview</span>
            </button>
            <button
              onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "users"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium text-sm">Users</span>
            </button>
            <button
              onClick={() => { setActiveTab("server"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "server"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Server className="h-5 w-5" />
              <span className="font-medium text-sm">Server</span>
            </button>
            <button
              onClick={() => { setActiveTab("tickets"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "tickets"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Tickets</span>
            </button>
            <button
              onClick={() => { setActiveTab("paptos"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "paptos"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="font-medium text-sm">PAP & TOS</span>
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-sidebar-border space-y-2">
             <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent gap-3 px-4"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium text-sm">Back to Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive/70 hover:text-destructive hover:bg-destructive/10 gap-3 px-4"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm">Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      <main className="transition-all duration-300 md:ml-56 min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-8 max-w-7xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Sycord" width={32} height={32} />
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Manage users, servers, and platform settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
                v1.0.0
              </Badge>
              <div className="flex items-center gap-2 pl-3 border-l border-border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">{session?.user?.name}</span>
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">{users.length}</p>
                      <p className="text-[10px] text-muted-foreground">Registered accounts</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Premium / Subscribers</p>
                      <p className="text-2xl font-bold text-foreground">{users.filter((u) => u.isPremium).length}</p>
                      <p className="text-[10px] text-muted-foreground">Active subscriptions</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Globe2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Websites</p>
                      <p className="text-2xl font-bold text-foreground">
                        {users.reduce((acc, u) => acc + u.projectCount, 0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Total created</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 bg-card border-border rounded-xl shadow-sm"
                  />
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Fetching user data...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold">No users found</p>
                    <p className="text-muted-foreground text-sm">Try adjusting your search criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.userId}
                        className="border-border hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              {/* Profile Avatar */}
                              <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-primary">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>

                              <div className="flex-1 space-y-3 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-lg text-foreground">{user.name}</h3>
                                  {user.email === "dmarton336@gmail.com" ? (
                                    <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground">User</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">{user.email}</span>
                                </div>

                                {user.websites.length > 0 && (
                                  <div className="pt-1">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Websites</p>
                                    <div className="flex flex-wrap gap-2">
                                      {user.websites.map((website) => (
                                        <a
                                          key={website.id}
                                          href={`https://${website.subdomain}.pages.dev`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border rounded-md px-3 py-1.5 text-xs transition-colors"
                                        >
                                          <Globe2 className="h-3 w-3 text-muted-foreground" />
                                          <span className="font-medium">{website.businessName}</span>
                                          <span className="text-muted-foreground opacity-50">({website.subdomain})</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex md:flex-col items-end gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                              {/* Blocked Badge */}
                              {user.isBlocked && (
                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 w-full justify-center">
                                  <Ban className="h-3 w-3 mr-1" /> Blocked
                                </Badge>
                              )}
                              <div className="w-full">
                                <p className="text-xs text-muted-foreground mb-1.5">Subscription</p>
                                <select
                                  value={user.subscription || (user.isPremium ? "Sycord+" : "Free")}
                                  onChange={(e) => saveSubscription(user.userId, e.target.value)}
                                  disabled={updatingUser === user.userId}
                                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                >
                                  <option value="Free">Free</option>
                                  <option value="Sycord+">Sycord+</option>
                                  <option value="Sycord Enterprise">Sycord Enterprise</option>
                                </select>
                              </div>
                              <Button
                                size="sm"
                                variant={user.isBlocked ? "default" : "outline"}
                                className={`w-full ${user.isBlocked ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-red-500 border-red-500/30 hover:bg-red-500/10'}`}
                                onClick={() => toggleBlock(user.userId, user.isBlocked)}
                                disabled={updatingUser === user.userId}
                              >
                                {user.isBlocked ? (
                                  <><UserCheck className="h-4 w-4 mr-2" /> Unblock</>
                                ) : (
                                  <><Ban className="h-4 w-4 mr-2" /> Block</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteUser(user.userId, user.name)}
                                disabled={updatingUser === user.userId}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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

          {/* Server Tab (Monitors) */}
          {activeTab === "server" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {monitorsLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground text-sm">Loading monitors...</p>
                </div>
              ) : monitors.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No monitors found</p>
                  <p className="text-muted-foreground text-sm">Check your Cronitor configuration.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monitors.map((monitor) => (
                    <Card
                      key={monitor.id}
                      className="border-border hover:border-primary/30 transition-all shadow-sm hover:shadow-md"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${monitor.statusCode === 200 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{monitor.name}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">{monitor.id}</p>
                            <Badge
                              variant="outline"
                              className={`mt-2 text-xs ${monitor.statusCode === 200 ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}
                            >
                              {monitor.statusCode === 200 ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4">
                          {editingIcon === monitor.id ? (
                            <div className="flex flex-col gap-3 bg-muted/30 p-4 rounded-lg border border-border">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">Choose Icon</p>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingIcon(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Preset Icons */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Preset Icons</p>
                                <div className="flex flex-wrap gap-2">
                                  {availableIcons.map((item) => {
                                    const Icon = item.icon
                                    return (
                                      <button
                                        key={item.name}
                                        onClick={() => updateMonitorIcon(monitor.id, item.name, 'preset')}
                                        className={`p-2.5 rounded-lg hover:bg-accent transition-colors ${
                                          monitor.providerIcon === item.name && monitor.iconType !== 'custom'
                                            ? 'bg-accent text-accent-foreground ring-2 ring-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                        title={item.name}
                                      >
                                        <Icon className="h-5 w-5" />
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Custom Icon Upload */}
                              <div className="border-t border-border pt-3">
                                <p className="text-xs text-muted-foreground mb-2">Custom Icon (PNG/JPG, max 1MB)</p>
                                <label
                                  htmlFor={`icon-upload-${monitor.id}`}
                                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors text-sm font-medium"
                                >
                                  {uploadingIcon === monitor.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-4 w-4" />
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
                              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-background border border-border rounded-lg">
                                {monitor.iconType === 'custom' ? (
                                  <img
                                    src={monitor.providerIcon}
                                    alt="Custom icon"
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  (() => {
                                    const iconName = monitor.providerIcon || "Server"
                                    const iconEntry = availableIcons.find(i => i.name.toLowerCase() === iconName.toLowerCase())
                                    const Icon = iconEntry ? iconEntry.icon : Server
                                    return <Icon className="h-5 w-5 text-muted-foreground" />
                                  })()
                                )}
                                <span className="text-sm font-medium text-foreground">
                                  {monitor.iconType === 'custom' ? 'Custom' : (monitor.providerIcon || "Server")}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingIcon(monitor.id)}
                                className="whitespace-nowrap"
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Change Icon
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Tickets</h3>
                <p className="text-muted-foreground text-sm">Support ticket system coming soon.</p>
              </div>
            </div>
          )}

          {/* PAP & TOS Tab */}
          {activeTab === "paptos" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Privacy Policy (Adatvédelmi Irányelvek)</CardTitle>
                    <CardDescription>Edit and manage the platform privacy policy.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      className="font-mono text-xs min-h-[300px] bg-background/50 leading-relaxed"
                      value={privacyPolicy}
                      onChange={(e) => setPrivacyPolicy(e.target.value)}
                    />
                    <Button
                      onClick={() => toast.success("Privacy policy saved")}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Terms of Service (ÁSZF)</CardTitle>
                    <CardDescription>Edit and manage the platform terms of service.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      className="font-mono text-xs min-h-[300px] bg-background/50 leading-relaxed"
                      value={termsOfService}
                      onChange={(e) => setTermsOfService(e.target.value)}
                    />
                    <Button
                      onClick={() => toast.success("Terms of service saved")}
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
