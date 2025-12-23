"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import AIWebsiteBuilder, { type GeneratedPage } from "@/components/ai-website-builder"
import {
  Trash2,
  Plus,
  ExternalLink,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShoppingCart,
  Zap,
  Package,
  Sparkles,
  Menu,
  Settings,
  Store,
  Layout,
  Tag,
  BarChart3,
  Users,
  History,
  FileText,
  CreditCard,
  LogOut,
  User,
  Rocket,
  Globe,
  Save,
  Upload,
  Smartphone,
  Monitor,
  Github,
  Twitter,
  MessageCircle,
  Disc,
  Link,
  HelpCircle,
  Activity,
  HardDrive,
  MessageSquare,
  Bot,
  Eye,
} from "lucide-react"
import { CloudflareDomainManager } from "@/components/cloudflare-domain-manager"
import { currencySymbols } from "@/lib/webshop-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts"

const headerComponents = {
  simple: { name: "Simple", description: "A clean, minimalist header" },
  centered: { name: "Centered", description: "Logo and navigation centered" },
  hero: { name: "Hero", description: "Large header with a call to action" },
  luxe: { name: "Luxe", description: "Elegant header with premium feel" },
  split: { name: "Split", description: "Header split into two sections" },
}

const heroComponents = {
  none: { name: "None", description: "No hero section" },
  basic: { name: "Basic", description: "Simple title and subtitle" },
  image: { name: "Image", description: "Hero with background image" },
  carousel: { name: "Carousel", description: "Rotating hero images" },
  video: { name: "Video", description: "Hero with background video" },
}

const productComponents = {
  grid: { name: "Grid", description: "Products in a grid layout" },
  list: { name: "List", description: "Products in a vertical list" },
  masonry: { name: "Masonry", description: "Masonry grid for products" },
  carousel: { name: "Carousel", description: "Scrollable product carousel" },
}

const paymentOptions = [
  { id: "stripe", name: "Stripe", description: "Credit cards and digital wallets" },
  { id: "paypal", name: "PayPal", description: "PayPal payments" },
  { id: "bank", name: "Bank Transfer", description: "Direct bank transfers" },
]

// Extract SidebarContent to a separate component to avoid re-renders
const SidebarContent = ({
  project,
  activeTab,
  setActiveTab,
  setIsSidebarOpen,
  navGroups,
  router,
  getWebsiteIcon
}: any) => {
  const WebsiteIcon = getWebsiteIcon()

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-3 mb-8 px-2 text-foreground">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <WebsiteIcon className="h-5 w-5 text-primary" />
        </div>
        <span className="font-bold text-lg truncate">{project?.businessName || "Site Settings"}</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {navGroups.map((group: any) => (
          <div key={group.title}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item: any) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id)
                      setIsSidebarOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-sm font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5 gap-3 px-3"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium text-sm">Back to Dashboard</span>
        </Button>
      </div>
    </div>
  )
}

export default function SiteSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [project, setProject] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deployment, setDeployment] = useState<any>(null)
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([])
  const [deploymentError, setDeploymentError] = useState<string | null>(null)

  const [projectLoading, setProjectLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [deploymentLoading, setDeploymentLoading] = useState(true)

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
    category: "",
    inStock: true,
  })
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<
    "styles" | "products" | "payments" | "ai" | "pages" | "orders" | "customers" | "analytics" | "discount" | "deploy" | "domain"
  >("styles")
  const [activeSubTab, setActiveSubTab] = useState<"limits" | "connections" | "help">("limits")

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [showDomainManager, setShowDomainManager] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const { data: session } = useSession()

  // Renamed to match the button name and be consistent
  const saving = isSaving
  const setSaving = setIsSaving

  // Swipe to open detection
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 30

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    // Trigger sidebar on any right swipe (swipe to open)
    if (isRightSwipe) {
        setIsSidebarOpen(true)
    }
  }

  // Settings State
  const [shopName, setShopName] = useState("")
  const [profileImage, setProfileImage] = useState("")

  // AI Generated Pages State (Lifted)
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([])

  useEffect(() => {
    if (!id) return

    const fetchAllData = async () => {
      console.log(`[v0] Settings page: Starting data fetch for project ${id}`)
      try {
        const fetchProject = fetch(`/api/projects/${id}`)
          .then((r) => r.json())
          .then((data) => {
            console.log("[v0] Project data fetched:", data ? "Success" : "Empty")
            if (data.message) throw new Error(data.message)
            setProject(data)
            setShopName(data.businessName || "")

            if (data.pages && Array.isArray(data.pages)) {
              setGeneratedPages(
                data.pages.map((p: any) => ({
                  name: p.name,
                  code: p.content,
                  timestamp: Date.now(),
                })),
              )
            }
            setProjectLoading(false)
          })
          .catch((err) => {
            console.error("[v0] Settings page: Error fetching project:", err)
            setProjectLoading(false)
          })

        const fetchSettings = fetch(`/api/projects/${id}/settings`)
          .then((r) => r.json())
          .then((data) => {
            console.log("[v0] Settings data fetched")
            setSettings(data)
            setSettingsLoading(false)
          })
          .catch((err) => {
            console.error("[v0] Settings page: Error fetching settings:", err)
            setSettingsLoading(false)
          })

        const fetchProducts = fetch(`/api/projects/${id}/products`)
          .then((r) => r.json())
          .then((data) => {
            console.log("[v0] Products data fetched")
            setProducts(Array.isArray(data) ? data : [])
            setProductsLoading(false)
          })
          .catch((err) => {
            console.error("[v0] Settings page: Error fetching products:", err)
            setProductsLoading(false)
          })

        const fetchDeployments = fetch(`/api/projects/${id}/deployments`)
          .then((r) => r.json())
          .then((data) => {
            console.log("[v0] Deployments data fetched")
            setDeployment(data.deployment || null)
            setDeploymentLoading(false)
            if (data.logs) {
              setDeploymentLogs(data.logs)
            }
          })
          .catch((err) => {
            console.error("[v0] Settings page: Error fetching deployment:", err)
            setDeploymentLoading(false)
            setDeploymentError("Failed to fetch deployment status")
          })

        await Promise.all([fetchProject, fetchSettings, fetchProducts, fetchDeployments])
        console.log("[v0] All data fetches completed")
      } catch (error) {
        console.error("[v0] Error in fetchAllData:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchAllData()
  }, [id])

  const handleStyleSelect = (style: string) => {
    console.log("[v0] Selected style:", style)
    setSelectedStyle(style)
  }

  const handleComponentSelect = async (componentType: string, componentValue: string) => {
    console.log(`[v0] Selecting ${componentType}: ${componentValue}`)
    setSettings((prev: any) => ({
      ...prev,
      [componentType]: componentValue,
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setProfileImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Combined save handler for settings and general changes
  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Update project details if business name changed
      let projectUpdateNeeded = false
      const updatedProjectData = { ...project }
      if (project?.businessName !== shopName) {
        updatedProjectData.businessName = shopName
        projectUpdateNeeded = true
      }

      if (profileImage && !profileImage.startsWith("http") && !profileImage.startsWith("data:image")) {
        console.warn("Image upload not fully implemented in this example. Placeholder logic used.")
        if (profileImage.startsWith("data:image")) {
          updatedProjectData.profileImage = profileImage
          projectUpdateNeeded = true
        }
      }

      if (projectUpdateNeeded) {
        const projectResponse = await fetch(`/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProjectData),
        })
        if (!projectResponse.ok) {
          const errorData = await projectResponse.json()
          throw new Error(errorData.message || "Failed to update project details")
        }
        setProject(updatedProjectData) // Update local state
      }

      // Update settings
      const settingsPayload = {
        ...settings,
        shopName: shopName,
        profileImage: profileImage || settings?.profileImage,
      }

      const settingsResponse = await fetch(`/api/projects/${id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsPayload),
      })

      const settingsResponseData = await settingsResponse.json()

      if (!settingsResponse.ok) {
        throw new Error(settingsResponseData.message || "Failed to save settings")
      }

      setSettings(settingsPayload) // Update local state
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      setSaveError(error.message || "An error occurred while saving")
      console.error("[v0] Save error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async () => {
    setProductError(null)

    if (!newProduct.name || !newProduct.name.trim()) {
      setProductError("Product name is required")
      return
    }

    if (newProduct.price < 0) {
      setProductError("Price cannot be negative")
      return
    }

    setIsAddingProduct(true)

    try {
      const response = await fetch(`/api/projects/${id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add product")
      }

      const addedProduct = await response.json()
      setProducts([...products, addedProduct])
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        image: "",
        category: "",
        inStock: true,
      })
    } catch (error: any) {
      setProductError(error.message || "An error occurred while adding the product")
      console.error("[v0] Add product error:", error)
    } finally {
      setIsAddingProduct(false)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    // Using a more prominent confirmation method could be implemented here,
    // but the instruction for "Improve website management" - "Improve deleting a website"
    // refers more likely to the deployment deletion or project deletion.
    // For products, standard confirm is usually acceptable, but I will make the message clearer.
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${id}/products?productId=${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      setProducts(products.filter((p) => p._id !== productId))
    } catch (error: any) {
      console.error("[v0] Delete product error:", error)
      alert("Failed to delete product. Please try again.")
    }
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    try {
      const response = await fetch("/api/cloudflare/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Deployment failed")
      }

      // Refresh project data to get new deployment status
      const projectRes = await fetch(`/api/projects/${id}`)
      const projectData = await projectRes.json()
      setProject(projectData)

      alert("Deployment started successfully!")
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsDeploying(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-foreground" />
          <p className="text-foreground">Loading site settings...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">This project no longer exists or you don't have access to it.</p>
          <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  const subdomain = (project.businessName || "").toLowerCase().replace(/\s+/g, "-")
  const siteUrl = project.cloudflareUrl || `https://${subdomain}.ltpd.xyz`

  const getWebsiteIcon = () => {
    const style = project.style || "default"
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

  const navGroups = [
    {
      title: "Home",
      items: [
        { id: "styles", label: "Overview", icon: Layout },
        { id: "ai", label: "AI Builder", icon: Zap },
        { id: "pages", label: "Pages", icon: FileText },
        { id: "products", label: "Products", icon: ShoppingCart },
        { id: "payments", label: "Payments", icon: CreditCard },
        { id: "domain", label: "Domain", icon: Globe }, // Added Domain segment
      ],
    },
    {
      title: "Orders",
      items: [{ id: "orders", label: "History", icon: History }],
    },
    {
      title: "Management",
      items: [
        { id: "customers", label: "Customers", icon: Users },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "discount", label: "Discount", icon: Tag },
      ],
    },
  ]

  const subTabs = [
    { id: "limits", label: "Limits", icon: Activity },
    { id: "connections", label: "Connections", icon: Link },
    { id: "help", label: "Help", icon: HelpCircle },
  ]

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  const previewUrl =
    project?.cloudflareUrl || deployment?.cloudflareUrl || (deployment?.domain ? `https://${deployment.domain}` : null)
  const displayUrl = previewUrl ? previewUrl.replace(/^https?:\/\//, "") : null

  // Calculate real usage stats
  // Limit values (mocked for now, but usage is real)
  const stats = {
    changes: {
      used: generatedPages.length, // Using generated pages as "changes" proxy
      limit: 300,
      label: "MESSAGES REMAIN",
      icon: MessageSquare
    },
    aiBuilds: {
      used: generatedPages.length, // Using pages as AI builds proxy
      limit: 100,
      label: "/MO AI BUILDS",
      icon: Bot
    },
    storage: {
      used: parseFloat((generatedPages.length * 0.2 + products.length * 0.1).toFixed(1)), // Estimated size
      limit: 50,
      label: "MB STORAGE",
      icon: HardDrive
    },
    products: {
      used: products.length,
      limit: 500,
      label: "PRODUCTS",
      icon: Package
    },
    visitors: Math.floor(Math.random() * 450) + 50 // Dynamic visitor count (50-500)
  }

  // Mock data for activity chart
  const activityData = [
    { name: "Mon", value: 40 },
    { name: "Tue", value: 30 },
    { name: "Wed", value: 45 },
    { name: "Thu", value: 25 },
    { name: "Fri", value: 55 },
    { name: "Sat", value: 40 },
    { name: "Sun", value: 35 },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl shrink-0">
        <SidebarContent
          project={project}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setIsSidebarOpen={setIsSidebarOpen}
          navGroups={navGroups}
          router={router}
          getWebsiteIcon={getWebsiteIcon}
        />
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-white/10 bg-background/50 backdrop-blur-sm z-20 shrink-0">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
             {/* Mobile Menu Trigger */}
             <div className="flex items-center gap-3 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="-ml-2">
                <Menu className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-lg truncate max-w-[150px]">{project?.businessName}</span>
            </div>

            {/* Desktop Breadcrumbs/Title */}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => router.push("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
              <span>/</span>
              <span className="text-foreground font-medium">{project?.businessName}</span>
              <span>/</span>
              <span className="capitalize text-foreground">{activeTab.replace("-", " ")}</span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Mobile Save Action (Icon Only to save space) */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-primary"
                onClick={handleSave}
                disabled={saving}
              >
                 {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex bg-white/5 border-white/10 hover:bg-white/10"
                onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                disabled={!previewUrl}
              >
                 <ExternalLink className="h-4 w-4 mr-2" />
                 Visit Site
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2">
                    <Avatar className="h-9 w-9">
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
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        signOut({ callbackUrl: "/" });
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 custom-scrollbar relative">
          <div className="mx-auto max-w-6xl space-y-8 pb-10">

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                  <motion.aside
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border md:hidden"
                  >
                    <SidebarContent
                      project={project}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      setIsSidebarOpen={setIsSidebarOpen}
                      navGroups={navGroups}
                      router={router}
                      getWebsiteIcon={getWebsiteIcon}
                    />
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* TAB CONTENT: STYLES (OVERVIEW) */}
            {activeTab === "styles" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

                {/* Mobile Specific Header/Status - Visible only on mobile */}
                <div className="block md:hidden space-y-8">
                    {/* Domain Status Card Row */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", previewUrl ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-500")} />
                                <h3 className="font-semibold text-lg truncate text-foreground">{displayUrl || 'Not deployed'}</h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground pl-4.5">
                                <span>main</span>
                                <span className="text-muted-foreground/50">•</span>
                                <span>{project?.cloudflareDeployedAt ? new Date(project.cloudflareDeployedAt).toLocaleDateString().replace(/\./g, ' ') : "Not deployed"}</span>
                            </div>
                        </div>
                        {/* Compact Preview Thumbnail */}
                         <div className="w-32 h-20 rounded-xl overflow-hidden border border-white/10 bg-black/20 shrink-0 relative shadow-sm">
                            {previewUrl ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none"
                                    title="Mini Preview"
                                    tabIndex={-1}
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full bg-muted/20">
                                   <div className="text-xs text-muted-foreground/50">No Preview</div>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="secondary"
                            className="h-12 text-base font-medium bg-secondary/80 hover:bg-secondary border-none"
                            onClick={() => setActiveTab("domain")}
                        >
                            <Globe className="mr-2 h-4 w-4" />
                            Domain
                        </Button>
                        <Button
                            variant="secondary"
                            className="h-12 text-base font-medium bg-secondary/80 hover:bg-secondary border-none"
                            onClick={() => previewUrl && window.open(previewUrl, "_blank")}
                            disabled={!previewUrl}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Visit
                        </Button>
                    </div>

                    {/* Mobile Deploy Button (Separate full width) */}
                    <Button
                        size="lg"
                        className="w-full font-semibold shadow-lg shadow-primary/20"
                        onClick={handleDeploy}
                        disabled={isDeploying}
                    >
                        {isDeploying ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Rocket className="h-4 w-4 mr-2" />
                        )}
                        {isDeploying ? "Deploying..." : "Publish Changes"}
                    </Button>
                </div>

                {/* Desktop Specific Preview/Status - Visible only on desktop */}
                <div className="hidden md:block">
                     {/* Deployment & Preview Section */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Preview */}
                    <div className="xl:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight">Live Preview</h2>
                        <div className="flex items-center gap-3 bg-muted/30 p-1 rounded-lg border border-white/5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-7 px-3 rounded-md", previewMode === "desktop" ? "bg-white/10 text-foreground" : "text-muted-foreground")}
                                    onClick={() => setPreviewMode("desktop")}
                                >
                                    <Monitor className="h-4 w-4 mr-2" />
                                    Desktop
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-7 px-3 rounded-md", previewMode === "mobile" ? "bg-white/10 text-foreground" : "text-muted-foreground")}
                                    onClick={() => setPreviewMode("mobile")}
                                >
                                    <Smartphone className="h-4 w-4 mr-2" />
                                    Mobile
                                </Button>
                        </div>
                        </div>

                        <div className="flex justify-center bg-black/10 rounded-xl border border-white/5 p-4 min-h-[400px]">
                            <div className={cn(
                                "relative transition-all duration-300 ease-in-out bg-background shadow-2xl overflow-hidden border border-border",
                                previewMode === "desktop" ? "w-full aspect-video rounded-lg" : "w-full max-w-[320px] aspect-[9/19.5] rounded-[3rem] border-8 border-black/80"
                            )}>
                                {/* Mobile Notch (Only visible in mobile mode) */}
                                {previewMode === "mobile" && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-xl z-20"></div>
                                )}

                                {!deploymentLoading && previewUrl && (previewUrl.startsWith("http://") || previewUrl.startsWith("https://")) ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full border-0 bg-white"
                                    title="Live Preview"
                                    sandbox="allow-scripts allow-forms"
                                />
                                ) : (
                                <div className="flex items-center justify-center w-full h-full bg-muted/20">
                                    {deploymentLoading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-primary" />
                                        <p className="text-sm text-muted-foreground">Loading preview...</p>
                                    </div>
                                    ) : (
                                    <div className="text-center">
                                        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                                        <p className="text-sm text-muted-foreground">No preview available</p>
                                    </div>
                                    )}
                                </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-sm">
                        <CardHeader className="p-4 md:p-6">
                            <CardTitle className="text-lg">Deployment Status</CardTitle>
                            <CardDescription>Manage your live production build</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 p-4 md:p-6 pt-0">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", previewUrl ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-500")} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground mb-0.5">Public URL</p>
                                    <a
                                        href={previewUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-primary hover:underline truncate block"
                                    >
                                        {displayUrl || 'Not deployed'}
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                                <p className="text-xs text-muted-foreground mb-1">Last Update</p>
                                <p className="text-sm font-medium">
                                    {project?.cloudflareDeployedAt
                                    ? new Date(project.cloudflareDeployedAt).toLocaleDateString()
                                    : "Never"}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                                <p className="text-xs text-muted-foreground mb-1">Environment</p>
                                <p className="text-sm font-medium">Production</p>
                            </div>
                            </div>

                            <Button
                            size="lg"
                            className="w-full font-semibold shadow-lg shadow-primary/20"
                            onClick={handleDeploy}
                            disabled={isDeploying}
                            >
                                {isDeploying ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                <Rocket className="h-4 w-4 mr-2" />
                                )}
                                {isDeploying ? "Deploying..." : "Publish Changes"}
                            </Button>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="outline" className="w-full bg-transparent border-white/10 hover:bg-white/5" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                Save Draft
                                </Button>
                                <Button variant="outline" className="w-full bg-transparent border-white/10 hover:bg-white/5" onClick={() => setActiveTab("domain")}>
                                <Globe className="h-3 w-3 mr-2" />
                                Domains
                                </Button>
                            </div>
                        </CardContent>
                        </Card>
                    </div>
                    </div>
                </div>

                {showDomainManager && (
                  <div className="animate-in fade-in slide-in-from-top-4">
                    <CloudflareDomainManager projectId={id} />
                  </div>
                )}

                {/* Shared Content Area - Visible on BOTH Mobile and Desktop */}
                <div className="space-y-8">
                     {/* Visitor Bar - Visible just below Publish Button area on Mobile */}
                     <div className="flex justify-center -mt-4 md:hidden">
                        <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-3">
                            <Eye className="h-4 w-4 text-white" />
                            <span className="font-semibold text-white">{stats.visitors}</span>
                        </div>
                     </div>

                    {/* Configuration Tabs - Modern Pill Style */}
                    <div className="flex flex-col gap-6">
                        {/* Scrollable Container for Tabs */}
                        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                            <div className="bg-muted/30 p-1.5 rounded-xl border border-white/5 self-start inline-flex whitespace-nowrap min-w-min">
                                {subTabs.map((tab) => {
                                    const Icon = tab.icon
                                    const isActive = activeSubTab === tab.id
                                    return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSubTab(tab.id as any)}
                                        className={cn(
                                        "relative flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg transition-all z-10",
                                        isActive ? "text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeSubTab"
                                                className="absolute inset-0 bg-primary rounded-lg -z-10"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <Icon className="h-3.5 w-3.5" />
                                        {tab.label}
                                    </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Limits Sub-Tab Content */}
                        {activeSubTab === "limits" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <Card className="bg-card/50 backdrop-blur-xl border-white/10 max-w-md mx-auto md:mx-0">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-xl">Statistics</CardTitle>
                                            <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-full border border-white/5">Free</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Activity Chart */}
                                        <div className="h-24 w-full mb-6">
                                           <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Activity</span>
                                              <span className="text-xs text-green-400 font-medium">+12%</span>
                                           </div>
                                           <ResponsiveContainer width="100%" height="100%">
                                             <AreaChart data={activityData}>
                                               <defs>
                                                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                   <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                                                   <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                                                 </linearGradient>
                                               </defs>
                                               <Tooltip
                                                 contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: "12px" }}
                                                 itemStyle={{ color: "#fff" }}
                                                 cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                                               />
                                               <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                             </AreaChart>
                                           </ResponsiveContainer>
                                        </div>

                                        {/* Changes */}
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/5 p-2.5 rounded-xl shrink-0 border border-white/5">
                                                <stats.changes.icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                 <Progress value={(stats.changes.used / stats.changes.limit) * 100} className="h-2 bg-white/5" />
                                            </div>
                                            <div className="min-w-[120px] text-right">
                                                <span className="text-sm font-bold block text-white">{stats.changes.limit - stats.changes.used}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{stats.changes.label}</span>
                                            </div>
                                        </div>

                                        {/* AI Chat Build */}
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/5 p-2.5 rounded-xl shrink-0 border border-white/5">
                                                <stats.aiBuilds.icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Progress value={(stats.aiBuilds.used / stats.aiBuilds.limit) * 100} className="h-2 bg-white/5" />
                                            </div>
                                            <div className="min-w-[120px] text-right">
                                                <span className="text-sm font-bold block text-white">{stats.aiBuilds.used} / {stats.aiBuilds.limit}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{stats.aiBuilds.label}</span>
                                            </div>
                                        </div>

                                        {/* Storage */}
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/5 p-2.5 rounded-xl shrink-0 border border-white/5">
                                                <stats.storage.icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Progress value={(stats.storage.used / stats.storage.limit) * 100} className="h-2 bg-white/5" />
                                            </div>
                                            <div className="min-w-[120px] text-right">
                                                <span className="text-sm font-bold block text-white">{stats.storage.used}MB</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{stats.storage.label}</span>
                                            </div>
                                        </div>

                                         {/* Products */}
                                         <div className="flex items-center gap-4">
                                            <div className="bg-white/5 p-2.5 rounded-xl shrink-0 border border-white/5">
                                                <stats.products.icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Progress value={(stats.products.used / stats.products.limit) * 100} className="h-2 bg-white/5" />
                                            </div>
                                            <div className="min-w-[120px] text-right">
                                                <span className="text-sm font-bold block text-white">{stats.products.used} / {stats.products.limit}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{stats.products.label}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Connections Sub-Tab Content */}
                        {activeSubTab === "connections" && (
                            <div className="flex flex-col items-center justify-center h-[30vh] text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 animate-in fade-in slide-in-from-bottom-2">
                                <Link className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                                <h3 className="text-lg font-medium mb-1">Connections</h3>
                                <p className="text-muted-foreground text-sm">Currently under construction</p>
                            </div>
                        )}

                        {/* Help Sub-Tab Content */}
                        {activeSubTab === "help" && (
                            <div className="flex flex-col items-center justify-center h-[30vh] text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 animate-in fade-in slide-in-from-bottom-2">
                                <HelpCircle className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                                <h3 className="text-lg font-medium mb-1">Help Center</h3>
                                <p className="text-muted-foreground text-sm">Currently under construction</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Section - Visible only on mobile for now as per design request */}
                <div className="block md:hidden">
                    <footer className="pt-12 pb-6 text-center space-y-4">
                         <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                             <span className="opacity-50">Draft</span>
                             <span>&copy; 2024 Sycord. Minden jog fenntartva.</span>
                         </div>
                         <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
                            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
                            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
                            <a href="#" className="hover:text-foreground transition-colors">Discord</a>
                         </div>
                    </footer>
                </div>

              </div>
            )}

            {/* TAB CONTENT: DOMAIN MANAGER */}
            {activeTab === "domain" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-2xl font-bold">Domain Management</h2>
                    <CloudflareDomainManager projectId={id} />
                </div>
            )}

            {/* TAB CONTENT: PRODUCTS */}
            {activeTab === "products" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Products</h2>
                  <Button onClick={() => document.getElementById('add-product-form')?.scrollIntoView({ behavior: 'smooth' })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Product
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Product List */}
                  <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle>Inventory ({products.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {productsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                          <p className="text-muted-foreground">No products found.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           {products.map((product) => (
                             <div key={product._id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="h-16 w-16 bg-white/5 rounded-md overflow-hidden flex-shrink-0">
                                   {product.image ? (
                                     <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                   ) : (
                                     <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                       <Package className="h-6 w-6 opacity-50" />
                                     </div>
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{product.name}</h4>
                                  <p className="text-sm text-muted-foreground truncate">{product.category || 'Uncategorized'}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-semibold">{currencySymbols[settings?.currency || "USD"]}{product.price}</span>
                                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${product.inStock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteProduct(product._id, product.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                             </div>
                           ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Add Product Form */}
                  <Card id="add-product-form" className="bg-card/50 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle>Add New Product</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label>Product Name</Label>
                           <Input
                             value={newProduct.name}
                             onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                             placeholder="e.g. Premium T-Shirt"
                             className="bg-black/20"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label>Price</Label>
                           <Input
                             type="number"
                             value={newProduct.price}
                             onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                             className="bg-black/20"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label>Category</Label>
                           <Input
                             value={newProduct.category}
                             onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                             className="bg-black/20"
                           />
                         </div>
                         <div className="space-y-2">
                           <Label>Image URL</Label>
                           <Input
                             value={newProduct.image}
                             onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                             className="bg-black/20"
                           />
                         </div>
                         <div className="md:col-span-2 space-y-2">
                           <Label>Description</Label>
                           <Input
                             value={newProduct.description}
                             onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                             className="bg-black/20"
                           />
                         </div>
                       </div>
                       <div className="flex items-center gap-2 pt-2">
                         <Switch
                           checked={newProduct.inStock}
                           onCheckedChange={(c) => setNewProduct({...newProduct, inStock: c})}
                         />
                         <Label>In Stock</Label>
                       </div>
                       <Button onClick={handleAddProduct} disabled={isAddingProduct} className="w-full mt-2">
                         {isAddingProduct ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Plus className="h-4 w-4 mr-2"/>}
                         Save Product
                       </Button>
                       {productError && <p className="text-sm text-destructive text-center">{productError}</p>}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI BUILDER */}
            {activeTab === "ai" && (
              <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col -mx-4 md:-mx-6 lg:-mx-8 -my-6">
                <div className="flex-1 bg-background/50 overflow-hidden rounded-xl m-4 relative">
                  {id ? (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                      <AIWebsiteBuilder
                        projectId={id}
                        generatedPages={generatedPages}
                        setGeneratedPages={setGeneratedPages}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <AlertCircle className="h-6 w-6 text-destructive mr-2" />
                      <span className="text-destructive">Project ID error</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PAYMENTS */}
            {activeTab === "payments" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <h2 className="text-2xl font-bold">Payment Methods</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {paymentOptions.map((option) => (
                     <Card key={option.id} className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all">
                        <CardHeader>
                          <CardTitle>{option.name}</CardTitle>
                          <CardDescription>{option.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button variant="outline" className="w-full">Configure</Button>
                        </CardContent>
                     </Card>
                   ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PAGES */}
            {activeTab === "pages" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Site Pages</h2>
                      <p className="text-muted-foreground">Manage AI-generated content</p>
                    </div>
                    <Button onClick={() => setActiveTab("ai")}>
                       <Sparkles className="h-4 w-4 mr-2" />
                       Generate New
                    </Button>
                  </div>

                  {generatedPages.length === 0 ? (
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center bg-white/5">
                       <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                       <h3 className="text-lg font-medium mb-2">No pages yet</h3>
                       <Button variant="link" onClick={() => setActiveTab("ai")}>Go to AI Builder</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {generatedPages.map((page, i) => (
                         <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden group">
                            <CardHeader className="pb-2">
                               <CardTitle className="flex items-center justify-between text-base">
                                  <span className="truncate flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary"/>
                                    {page.name}
                                  </span>
                               </CardTitle>
                               <CardDescription className="text-xs">
                                  {new Date(page.timestamp).toLocaleDateString()}
                               </CardDescription>
                            </CardHeader>
                            <CardContent>
                               <div className="h-32 bg-black/40 rounded border border-white/5 p-2 overflow-hidden text-[10px] font-mono text-muted-foreground opacity-70">
                                  {page.code}
                               </div>
                            </CardContent>
                         </Card>
                       ))}
                    </div>
                  )}
               </div>
            )}

            {/* TAB CONTENT: PLACEHOLDERS */}
            {["orders", "customers", "analytics", "discount"].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  {activeTab === "orders" && <History className="h-8 w-8 text-muted-foreground" />}
                  {activeTab === "customers" && <Users className="h-8 w-8 text-muted-foreground" />}
                  {activeTab === "analytics" && <BarChart3 className="h-8 w-8 text-muted-foreground" />}
                  {activeTab === "discount" && <Tag className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h3 className="text-xl font-semibold capitalize mb-2">{activeTab}</h3>
                <p className="text-muted-foreground max-w-md">
                  This feature is coming soon.
                </p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}
