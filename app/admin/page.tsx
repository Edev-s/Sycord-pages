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
  Key,
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
  Terminal,
  Save,
  RotateCcw
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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "env" | "monitors" | "prompts">("overview")
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

  useEffect(() => {
    if (session?.user?.email !== "dmarton336@gmail.com") {
      router.push("/dashboard")
      return
    }

    fetchUsers()
    fetchMonitors()
  }, [session, router])

  useEffect(() => {
    if (activeTab === 'prompts') {
        fetchPrompts()
    }
  }, [activeTab])

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
              <span className="font-medium text-sm">User Management</span>
            </button>
            <button
              onClick={() => { setActiveTab("prompts"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "prompts"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Terminal className="h-5 w-5" />
              <span className="font-medium text-sm">AI Prompts</span>
            </button>
            <button
              onClick={() => { setActiveTab("env"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "env"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Key className="h-5 w-5" />
              <span className="font-medium text-sm">Env Setup</span>
            </button>
            <button
              onClick={() => { setActiveTab("monitors"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === "monitors"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Activity className="h-5 w-5" />
              <span className="font-medium text-sm">Monitors</span>
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

          {/* Header Card */}
          <div className="relative rounded-xl overflow-hidden bg-card border border-border shadow-sm group mb-8">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-purple-600/20 w-full" />
            <div className="absolute top-20 left-6">
               <div className="w-24 h-24 rounded-full border-4 border-background bg-muted overflow-hidden flex items-center justify-center">
                  <Shield className="h-10 w-10 text-primary" />
               </div>
            </div>
            <div className="pt-14 pb-6 px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="mt-2">
                 <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                 <p className="text-muted-foreground text-sm">Manage users, subscriptions, and platform health</p>
              </div>
              <div className="flex gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1">
                    v1.0.0
                  </Badge>
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* ... (Existing Overview Content) ... */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                    <Users className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{users.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Premium</CardTitle>
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{users.filter((u) => u.isPremium).length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Websites</CardTitle>
                    <Globe2 className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {users.reduce((acc, u) => acc + u.projectCount, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total created</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* ... (Existing Users Content) ... */}
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
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                     <h3 className="font-bold text-lg text-foreground">{user.name}</h3>
                                                                       </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>{user.email}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                   {user.isPremium ? (
                                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                                      <Zap className="h-3 w-3 mr-1" /> Premium
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground">Free</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground font-mono">{user.userId.substring(0,8)}...</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-4">
                                <div className="bg-muted/30 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Projects</p>
                                  <p className="font-semibold text-foreground">{user.projectCount}</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Joined</p>
                                  <p className="font-semibold text-foreground">{formatDate(user.createdAt)}</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg col-span-2">
                                   <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                                   <p className="font-mono text-xs text-foreground">{user.ip}</p>
                                </div>
                              </div>

                               {user.websites.length > 0 && (
                                <div className="pt-2">
                                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Websites</p>
                                  <div className="flex flex-wrap gap-2">
                                    {user.websites.map((website) => (
                                      <a
                                        key={website.id}
                                        href={`https://${website.subdomain}.ltpd.xyz`}
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

                            <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                              <Button
                                size="sm"
                                variant={user.isPremium ? "outline" : "default"}
                                onClick={() => togglePremium(user.userId, user.isPremium)}
                                disabled={updatingUser === user.userId}
                                className="w-full"
                              >
                                {user.isPremium ? "Downgrade" : "Upgrade"}
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

          {/* AI Prompts Tab (NEW) */}
          {activeTab === "prompts" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                      <div>
                          <h2 className="text-xl font-bold flex items-center gap-2">
                              <Terminal className="h-6 w-6 text-primary" />
                              Global System Prompts
                          </h2>
                          <p className="text-muted-foreground">Manage AI behavior across all user projects.</p>
                      </div>
                      <Button onClick={savePrompts} disabled={promptsSaving}>
                          {promptsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Changes
                      </Button>
                  </div>

                  {promptsLoading ? (
                      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="bg-card border-border shadow-sm">
                              <CardHeader>
                                  <CardTitle className="text-lg">Auto-Fix: Diagnosis Phase</CardTitle>
                                  <CardDescription>Step 1: Analyze logs and identify the file.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <Textarea
                                      className="font-mono text-xs min-h-[300px] bg-background/50 leading-relaxed"
                                      value={prompts.autoFixDiagnosis}
                                      onChange={(e) => setPrompts({...prompts, autoFixDiagnosis: e.target.value})}
                                  />
                                  <div className="mt-2 text-[10px] text-muted-foreground">
                                      Vars: {'{{LOGS}}'}, {'{{FILE_STRUCTURE}}'}, {'{{MEMORY_SECTION}}'}
                                  </div>
                              </CardContent>
                          </Card>

                          <Card className="bg-card border-border shadow-sm">
                              <CardHeader>
                                  <CardTitle className="text-lg">Auto-Fix: Resolution Phase</CardTitle>
                                  <CardDescription>Step 2: Provide the corrected code content.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <Textarea
                                      className="font-mono text-xs min-h-[300px] bg-background/50 leading-relaxed"
                                      value={prompts.autoFixResolution}
                                      onChange={(e) => setPrompts({...prompts, autoFixResolution: e.target.value})}
                                  />
                                  <div className="mt-2 text-[10px] text-muted-foreground">
                                      Vars: {'{{LOGS}}'}, {'{{FILE_STRUCTURE}}'}, {'{{FILENAME}}'}, {'{{FILE_CONTENT}}'}
                                  </div>
                              </CardContent>
                          </Card>

                          <Card className="bg-card border-border shadow-sm">
                              <CardHeader>
                                  <CardTitle className="text-lg">Builder: Plan Generation</CardTitle>
                                  <CardDescription>Generates the file structure blueprint.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <Textarea
                                      className="font-mono text-xs min-h-[300px] bg-background/50 leading-relaxed"
                                      value={prompts.builderPlan}
                                      onChange={(e) => setPrompts({...prompts, builderPlan: e.target.value})}
                                  />
                                  <div className="mt-2 text-[10px] text-muted-foreground">
                                      Vars: {'{{HISTORY}}'}, {'{{REQUEST}}'}
                                  </div>
                              </CardContent>
                          </Card>

                          <Card className="bg-card border-border shadow-sm">
                              <CardHeader>
                                  <CardTitle className="text-lg">Builder: Code Generation</CardTitle>
                                  <CardDescription>Generates individual file content.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <Textarea
                                      className="font-mono text-xs min-h-[300px] bg-background/50 leading-relaxed"
                                      value={prompts.builderCode}
                                      onChange={(e) => setPrompts({...prompts, builderCode: e.target.value})}
                                  />
                                  <div className="mt-2 text-[10px] text-muted-foreground">
                                      Vars: {'{{FILENAME}}'}, {'{{USEDFOR}}'}, {'{{FILE_STRUCTURE}}'}, {'{{MEMORY}}'}
                                  </div>
                              </CardContent>
                          </Card>
                      </div>
                  )}
              </div>
          )}

          {/* Monitors Tab */}
          {activeTab === "monitors" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* ... (Existing Monitors Content) ... */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-5 w-5 text-primary" />
                    Server Monitors
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage icons for your status page monitors. Choose from preset icons or upload custom PNG images.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {monitorsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                      <p className="text-muted-foreground text-sm">Loading monitors...</p>
                    </div>
                  ) : monitors.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No monitors found</p>
                      <p className="text-muted-foreground text-sm">Check your Cronitor configuration.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monitors.map((monitor) => (
                        <div 
                          key={monitor.id} 
                          className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-muted/30 rounded-xl border border-border hover:border-primary/30 transition-all duration-200 gap-4"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${monitor.statusCode === 200 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate">{monitor.name}</p>
                              <p className="text-xs text-muted-foreground font-mono truncate">{monitor.id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                            {editingIcon === monitor.id ? (
                              <div className="flex flex-col gap-3 w-full md:w-auto bg-card p-4 rounded-lg border border-border shadow-lg">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground">Choose Icon</p>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingIcon(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                {/* Preset Icons */}
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Preset Icons</p>
                                  <div className="flex flex-wrap gap-2 max-w-[400px]">
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
                              <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-2.5 px-4 py-2 bg-background border border-border rounded-lg">
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Environment Variables Guide Tab */}
          {activeTab === "env" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* ... (Existing Env Content) ... */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Server className="h-5 w-5 text-primary" />
                    Environment Configuration
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Required environment variables for the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-5 bg-muted/30 rounded-xl border border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                        <Key className="h-4 w-4 text-primary" /> Required Environment Variables
                      </h3>
                      <div className="space-y-4 font-mono text-sm">
                        <div className="flex flex-col gap-2">
                          <span className="text-foreground font-semibold select-all">MONGO_URI</span>
                          <div className="bg-background border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
                            MongoDB connection string
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-foreground font-semibold select-all">AUTH_SECRET</span>
                          <div className="bg-background border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
                            NextAuth secret for session encryption
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-foreground font-semibold select-all">GOOGLE_CLIENT_ID</span>
                          <div className="bg-background border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
                            Google OAuth client ID
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-foreground font-semibold select-all">GOOGLE_CLIENT_SECRET</span>
                          <div className="bg-background border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
                            Google OAuth client secret
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-foreground font-semibold select-all">NEXTAUTH_URL</span>
                          <div className="bg-background border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
                            Application URL (e.g., https://ltpd.xyz)
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-foreground font-semibold select-all">CRONITOR_API</span>
                          <div className="bg-background border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground">
                            Cronitor API key for server status and history
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
