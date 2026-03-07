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
  Smartphone,
  Monitor,
  Link,
  HelpCircle,
  Activity,
  HardDrive,
  MessageSquare,
  Bot,
  Eye,
  CheckCircle2,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileType,
  ChevronRight,
  Code,
} from "lucide-react"
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

// File tree node interface
interface FileTreeNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileTreeNode[]
  page?: GeneratedPage
}

// Helper function to get file icon based on extension
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return FileCode
    case 'json':
      return FileType
    case 'css':
      return FileType
    case 'html':
      return FileText
    case 'md':
      return FileText
    default:
      return File
  }
}

// Build file tree from flat file list
const buildFileTree = (pages: GeneratedPage[]): FileTreeNode[] => {
  const root: FileTreeNode[] = []
  
  pages.forEach(page => {
    const parts = page.name.split('/')
    let currentLevel = root
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      const path = parts.slice(0, index + 1).join('/')
      
      let existing = currentLevel.find(n => n.name === part)
      
      if (!existing) {
        const newNode: FileTreeNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: path,
          page: isFile ? page : undefined,
          children: isFile ? undefined : []
        }
        currentLevel.push(newNode)
        existing = newNode
      }
      
      if (!isFile && existing.children) {
        currentLevel = existing.children
      }
    })
  })
  
  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    }).map(node => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined
    }))
  }
  
  return sortNodes(root)
}

// File Tree Item Component
const FileTreeItem = ({ 
  node, 
  depth = 0, 
  onSelectFile, 
  selectedPage,
  onDeleteFile,
  expandedFolders,
  toggleFolder
}: { 
  node: FileTreeNode
  depth?: number
  onSelectFile: (page: GeneratedPage) => void
  selectedPage: GeneratedPage | null
  onDeleteFile: (name: string) => void
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
}) => {
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedPage?.name === node.page?.name
  const FileIcon = node.type === 'file' ? getFileIcon(node.name) : (isExpanded ? FolderOpen : Folder)
  
  return (
    <div>
      <button
        onClick={() => {
          if (node.type === 'folder') {
            toggleFolder(node.path)
          } else if (node.page) {
            onSelectFile(node.page)
          }
        }}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/5 transition-colors group",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {node.type === 'folder' ? (
          <ChevronRight className={cn(
            "h-3 w-3 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )} />
        ) : (
          <span className="w-3" />
        )}
        <FileIcon className={cn(
          "h-4 w-4 flex-shrink-0",
          node.type === 'folder' ? "text-yellow-500" : "text-blue-400"
        )} />
        <span className="truncate flex-1 text-left">{node.name}</span>
        {node.type === 'file' && node.page?.usedFor && (
          <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded hidden group-hover:block truncate max-w-[100px]">
            {node.page.usedFor}
          </span>
        )}
      </button>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <FileTreeItem 
              key={i} 
              node={child} 
              depth={depth + 1}
              onSelectFile={onSelectFile}
              selectedPage={selectedPage}
              onDeleteFile={onDeleteFile}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// File Tree View Component
const FileTreeView = ({ 
  pages, 
  onSelectFile, 
  selectedPage,
  onDeleteFile 
}: { 
  pages: GeneratedPage[]
  onSelectFile: (page: GeneratedPage) => void
  selectedPage: GeneratedPage | null
  onDeleteFile: (name: string) => void
}) => {
  const getInitialExpandedFolders = () => {
    const folders = new Set<string>()
    pages.forEach(page => {
      const parts = page.name.split('/')
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join('/'))
      }
    })
    return folders
  }
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(getInitialExpandedFolders)
  
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }
  
  const tree = buildFileTree(pages)
  
  return (
    <div className="py-2 max-h-[400px] overflow-y-auto custom-scrollbar">
      {tree.map((node, i) => (
        <FileTreeItem 
          key={i} 
          node={node}
          onSelectFile={onSelectFile}
          selectedPage={selectedPage}
          onDeleteFile={onDeleteFile}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
        />
      ))}
    </div>
  )
}

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
  const [projectLoading, setProjectLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)

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
    "styles" | "products" | "payments" | "ai" | "pages" | "orders" | "customers" | "analytics" | "discount"
  >("styles")
  const [activeSubTab, setActiveSubTab] = useState<"limits" | "connections" | "help">("limits")

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
  
  // Selected page for preview in Pages tab
  const [selectedPage, setSelectedPage] = useState<GeneratedPage | null>(null)

  // Deployment State
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [deployResult, setDeployResult] = useState<{ url?: string; message?: string } | null>(null)

  // Auto-Fix State
  const [logs, setLogs] = useState<string[]>([])
  const [hasDeployError, setHasDeployError] = useState(false)
  const [autoFixLogs, setAutoFixLogs] = useState<string[] | null>(null)

  const fetchLogs = async (repoIdOverride?: string) => {
    const targetId = repoIdOverride || project?.githubRepoId
    if (!targetId) return

    try {
        const res = await fetch(`https://micro1.sycord.com/api/logs?project_id=${targetId}&limit=50`)
        if (res.ok) {
            const data = await res.json()
            if (data.success && Array.isArray(data.logs)) {
                setLogs(data.logs)
                // Extract URL from logs if present
                const combinedLogs = data.logs.join('\n')
                const urlMatch = combinedLogs.match(/Take a peek over at[\s\S]*?(https:\/\/[a-zA-Z0-9.-]+\.pages\.dev)/)

                if (urlMatch && urlMatch[1]) {
                    const url = urlMatch[1].trim().replace(/\.$/, '')
                    setProject((prev: any) => ({ ...prev, cloudflareUrl: url }))
                    setDeployResult((prev: any) => ({ ...prev, url, message: "Deployed to Cloudflare Pages!" }))
                    setDeploySuccess(true)
                    setHasDeployError(false)
                }

                // Simple error detection in logs
                const combined = combinedLogs.toLowerCase()
                const successFound = combined.includes('take a peek over at') || combined.includes('deployment complete')

                const errorFound = !successFound && data.logs.some((log: string) =>
                    log.toLowerCase().includes('error') ||
                    log.toLowerCase().includes('fail') ||
                    log.toLowerCase().includes('exception')
                )

                // Only set error if we haven't already found success (URL extraction above sets it to false)
                if (!urlMatch) {
                    setHasDeployError(errorFound)
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch logs", e)
    }
  }

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
                  timestamp: p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now(),
                  usedFor: p.usedFor || ''
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

        await Promise.all([fetchProject, fetchSettings, fetchProducts])
        console.log("[v0] All data fetches completed")
        fetchLogs()
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

  const handleDeletePage = async (pageName: string) => {
    if (!confirm(`Are you sure you want to delete ${pageName}? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/projects/${id}/pages?name=${encodeURIComponent(pageName)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete page")
      }

      setGeneratedPages(prev => prev.filter(p => p.name !== pageName))
    } catch (error: any) {
      alert(error.message)
    }
  }

  const startAutoFix = () => {
    setAutoFixLogs(logs)
    setActiveTab("ai")
  }

  const pollForDomain = async (repoId: string, attempts = 0) => {
    if (attempts >= 40) return

    try {
      const res = await fetch(`/api/deploy/${repoId}/domain`)
      const data = await res.json()

      if (data.success && data.domain) {
        setProject((prev: any) => ({ ...prev, cloudflareUrl: data.domain }))
        setDeployResult((prev: any) => ({
            ...prev,
            url: data.domain,
            message: "Deployed to Cloudflare Pages!"
        }))
        fetchLogs(repoId)
      } else {
        setTimeout(() => pollForDomain(repoId, attempts + 1), 3000)
      }
    } catch (e) {
      console.error("Polling error:", e)
    }
  }

  const handleDeploy = async () => {
    if (isDeploying) return
    
    setIsDeploying(true)
    setDeployProgress(0)
    setDeploySuccess(false)
    setDeployResult(null)
    setDeployError(null)

    const PROGRESS_INTERVAL_MS = 400
    const PROGRESS_INCREMENT = 10
    const MAX_SIMULATED_PROGRESS = 80

    try {
      const progressInterval = setInterval(() => {
        setDeployProgress(prev => {
          const nextProgress = prev + PROGRESS_INCREMENT
          if (nextProgress >= MAX_SIMULATED_PROGRESS) {
            clearInterval(progressInterval)
            return MAX_SIMULATED_PROGRESS
          }
          return nextProgress
        })
      }, PROGRESS_INTERVAL_MS)

      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Deployment failed")
      }

      const result = await response.json()

      setDeployProgress(100)
      setDeploySuccess(true)
      setDeployResult({
        url: result.url,
        message: result.message || `Successfully deployed ${result.filesCount} file(s) to GitHub`
      })

      if (result.repoId) {
          setProject((prev: any) => ({ ...prev, githubRepoId: result.repoId }))
          if (!result.cloudflareUrl) {
              pollForDomain(result.repoId)
          } else {
              setProject((prev: any) => ({ ...prev, cloudflareUrl: result.cloudflareUrl }))
          }
          fetchLogs(result.repoId)
      }

      const SUCCESS_DISPLAY_DURATION_MS = 5000
      setTimeout(() => {
        setDeploySuccess(false)
        setDeployProgress(0)
      }, SUCCESS_DISPLAY_DURATION_MS)

    } catch (err: any) {
      setDeployError(err.message || "Deployment failed")
      setDeployProgress(0)
      setHasDeployError(true)
      setTimeout(fetchLogs, 1000)
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

  const userInitials = session?.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"
  const previewUrl = project?.cloudflareUrl || null
  const displayUrl = previewUrl ? previewUrl.replace(/^https?:\/\//, "") : null

  // Mock stats
  const stats = {
    changes: { used: generatedPages.length, limit: 300, label: "MESSAGES REMAIN", icon: MessageSquare },
    aiBuilds: { used: generatedPages.length, limit: 100, label: "/MO AI BUILDS", icon: Bot },
    storage: { used: parseFloat((generatedPages.length * 0.2 + products.length * 0.1).toFixed(1)), limit: 50, label: "MB STORAGE", icon: HardDrive },
    products: { used: products.length, limit: 500, label: "PRODUCTS", icon: Package },
    visitors: 0
  }
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
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={cn("border-b border-white/10 bg-background/50 backdrop-blur-sm z-20 shrink-0")}>
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
             <div className="flex items-center gap-3 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="-ml-2">
                <Menu className="h-5 w-5" />
              </Button>
              <span className="font-semibold text-lg truncate max-w-[150px]">{project?.businessName}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => router.push("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
              <span>/</span>
              <span className="text-foreground font-medium">{project?.businessName}</span>
              <span>/</span>
              <span className="capitalize text-foreground">{activeTab.replace("-", " ")}</span>
            </div>

            <div className="flex items-center gap-3 ml-auto">
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
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
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
                   <DropdownMenuItem onClick={() => router.push("/profile")}><User className="mr-2 h-4 w-4"/>Profile</DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-destructive"><LogOut className="mr-2 h-4 w-4"/>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className={cn("flex-1 relative", activeTab === "ai" ? "p-0 overflow-hidden" : "overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 custom-scrollbar")}>
          <div className={cn("mx-auto", activeTab === "ai" ? "h-full w-full max-w-none p-0 pb-0 space-y-0" : "max-w-6xl space-y-8 pb-10")}>

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

            {/* TAB CONTENT: STYLES */}
            {activeTab === "styles" && (
              <div className="flex flex-col gap-8 max-w-[800px] mx-auto mt-2 w-full animate-in fade-in slide-in-from-bottom-2 px-2">
                {/* 1. Main Panel and Green Badge */}
                <div className="relative">
                  <div className="w-full aspect-[2/1] bg-[#222222] rounded-3xl"></div>
                  <div className="absolute -bottom-6 left-0 flex items-center bg-[#10b981] rounded-lg shadow-lg h-[52px] overflow-hidden">
                    <div className="h-full w-[52px] bg-[#064e3b] flex items-center justify-center">
                      <div className="w-[22px] h-[22px] border-[2.5px] border-[#10b981] rotate-45 rounded-sm"></div>
                    </div>
                    <div className="px-5 font-bold text-white text-[16px] tracking-wide">
                      Your site is now live!
                    </div>
                  </div>
                </div>

                {/* 2. Action Row */}
                <div className="flex items-center justify-between px-2 mt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-[26px] h-[26px] bg-[#333333] rounded-md"></div>
                    <span className="text-white font-medium text-[16px]">Domain.com</span>
                  </div>
                  <div className="w-[140px] h-[36px] bg-[#333333] rounded-lg"></div>
                </div>

                {/* 3. Secondary Wide Panel */}
                <div className="w-full h-[120px] bg-[#161616] rounded-2xl"></div>

                {/* 4. Bottom Grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="h-[100px] border-2 border-[#222222] rounded-2xl"></div>
                  <div className="h-[100px] border-2 border-[#222222] rounded-2xl"></div>
                  <div className="h-[100px] border-2 border-[#222222] rounded-2xl"></div>
                </div>
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
              <div className="h-full w-full flex flex-col">
                <div className="flex-1 bg-background overflow-hidden relative">
                  {id ? (
                    <div className="absolute inset-0 overflow-hidden custom-scrollbar">
                      <AIWebsiteBuilder
                        projectId={id}
                        generatedPages={generatedPages}
                        setGeneratedPages={setGeneratedPages}
                        autoFixLogs={autoFixLogs}
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
                      <p className="text-muted-foreground">Manage AI-generated content (Vite + TypeScript)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {generatedPages.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete ALL generated pages? This cannot be undone.")) return;
                            try {
                              const res = await fetch(`/api/projects/${id}/pages?all=true`, { method: "DELETE" });
                              if (res.ok) {
                                setGeneratedPages([]);
                                setSelectedPage(null);
                              } else {
                                throw new Error("Failed to delete all pages");
                              }
                            } catch (e: any) {
                              alert(e.message);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete All
                        </Button>
                      )}
                      <Button onClick={() => setActiveTab("ai")}>
                         <Sparkles className="h-4 w-4 mr-2" />
                         Generate New
                      </Button>
                    </div>
                  </div>

                  {generatedPages.length === 0 ? (
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center bg-white/5">
                       <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                       <h3 className="text-lg font-medium mb-2">No pages yet</h3>
                       <Button variant="link" onClick={() => setActiveTab("ai")}>Go to AI Builder</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* File Tree View */}
                      <Card className="lg:col-span-1 bg-card/50 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Folder className="h-4 w-4 text-primary" />
                            Project Structure
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {generatedPages.length} files generated
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <FileTreeView 
                            pages={generatedPages} 
                            onSelectFile={(page) => setSelectedPage(page)}
                            selectedPage={selectedPage}
                            onDeleteFile={handleDeletePage}
                          />
                        </CardContent>
                      </Card>

                      {/* File Preview */}
                      <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <FileCode className="h-4 w-4 text-primary" />
                              {selectedPage ? selectedPage.name : 'Select a file'}
                            </span>
                            {selectedPage && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                  {new Date(selectedPage.timestamp).toLocaleDateString()}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                                  onClick={() => handleDeletePage(selectedPage.name)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </CardTitle>
                          {selectedPage?.usedFor && (
                            <CardDescription className="text-xs flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              Purpose: {selectedPage.usedFor}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          {selectedPage ? (
                            <div className="relative">
                              <pre className="bg-black/40 rounded-lg border border-white/5 p-4 overflow-auto max-h-[500px] text-xs font-mono text-muted-foreground custom-scrollbar">
                                <code>{selectedPage.code}</code>
                              </pre>
                              <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 bg-black/60 px-2 py-1 rounded">
                                {selectedPage.code.length} bytes
                              </div>
                            </div>
                          ) : (
                            <div className="h-64 bg-black/20 rounded-lg border border-white/5 flex items-center justify-center">
                              <p className="text-muted-foreground text-sm">Select a file from the tree to preview</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
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
