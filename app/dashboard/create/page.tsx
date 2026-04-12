"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Briefcase,
  ShoppingCart,
  BookOpen,
  HelpCircle,
  Globe,
  ArrowLeft,
  ImageIcon,
  CheckCircle2,
  ArrowRight,
  Check,
  Zap,
  Upload,
  X,
} from "lucide-react"
import { themes } from "@/lib/webshop-types"
import { toast } from "sonner"

const websiteTypes = [
  { id: "service", label: "Service", icon: Briefcase, description: "Business & services" },
  { id: "hosting", label: "Hosting", icon: Globe, description: "Hosting provider" },
  { id: "webshop", label: "Webshop", icon: ShoppingCart, description: "Online store" },
  { id: "blog", label: "Blog", icon: BookOpen, description: "Blog & content" },
  { id: "portfolio", label: "Portfolio", icon: ImageIcon, description: "Showcase your work" },
  { id: "other", label: "Other", icon: HelpCircle, description: "Something else" },
]

const experienceOptions = [
  { id: "yes", label: "Yes, I have", description: "I've built or managed a website before" },
  { id: "no", label: "No, this is my first", description: "I'm new to website building" },
]

export default function CreateProjectPage() {
  const router = useRouter()
  const { status } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<{ isPremium: boolean; subscription: string } | null>(null)
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const subdomainCheckTimer = useRef<NodeJS.Timeout | null>(null)
  const [promoDismissed, setPromoDismissed] = useState(false)
  const [existingProjectCount, setExistingProjectCount] = useState<number | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    websiteType: "",
    businessName: "",
    logo: null as File | null,
    previouslyManaged: "",
    selectedStyle: "modern",
    status: "pending",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        const [statusRes, projectsRes] = await Promise.all([
          fetch("/api/user/status"),
          fetch("/api/projects"),
        ])
        if (statusRes.ok) {
          const data = await statusRes.json()
          setUserPlan({ isPremium: data.isPremium, subscription: data.subscription })
        }
        if (projectsRes.ok) {
          const projects = await projectsRes.json()
          setExistingProjectCount(Array.isArray(projects) ? projects.length : 0)
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err)
      }
    }
    if (status === "authenticated") {
      fetchUserPlan()
    }
  }, [status])

  if (status === "unauthenticated") {
    return null
  }

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 20)
  }

  const checkSubdomainAvailability = (name: string) => {
    const subdomain = generateSubdomain(name)
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus("idle")
      return
    }

    setSubdomainStatus("checking")

    if (subdomainCheckTimer.current) {
      clearTimeout(subdomainCheckTimer.current)
    }

    subdomainCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`)
        const data = await res.json()
        setSubdomainStatus(data.available ? "available" : "taken")
      } catch {
        setSubdomainStatus("idle")
      }
    }, 500)
  }

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
      setFormData({ ...formData, logo: file })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setFormData({ ...formData, logo: null })
    if (logoInputRef.current) {
      logoInputRef.current.value = ""
    }
  }

  const handleTypeSelect = (typeId: string) => {
    setFormData({ ...formData, websiteType: typeId })
    setTimeout(() => setCurrentStep(2), 350)
  }

  const handleNameSubmit = () => {
    if (!formData.businessName.trim()) return
    if (subdomainStatus === "taken") {
      toast.error("That subdomain is already taken. Please choose a different name.")
      return
    }
    if (subdomainStatus === "checking") {
      toast.error("Please wait while we check subdomain availability.")
      return
    }
    setCurrentStep(3)
  }

  const handleExperienceSelect = (optionId: string) => {
    setFormData({ ...formData, previouslyManaged: optionId })
    setTimeout(() => {
      setCurrentStep(4)
      handleSubmit()
    }, 350)
  }

  const handleSubmit = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const theme = themes[formData.selectedStyle as keyof typeof themes]
      const subdomain = generateSubdomain(formData.businessName)

      if (!formData.businessName || !formData.websiteType) {
        throw new Error("Business name and website type are required")
      }
      if (!subdomain) {
        throw new Error("Could not generate a valid subdomain from your business name")
      }

      // Upload logo if present
      let logoUrl = null
      if (formData.logo) {
        const logoFormData = new FormData()
        logoFormData.append("file", formData.logo)
        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: logoFormData,
          })
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            logoUrl = uploadData.url
          }
        } catch (err) {
          console.error("Logo upload failed:", err)
        }
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          websiteType: formData.websiteType,
          domain: null,
          subdomain: subdomain,
          theme: formData.selectedStyle,
          primaryColor: theme.primary,
          secondaryColor: theme.secondary,
          headerStyle: "simple",
          productsPerPage: 12,
          currency: "EUR",
          showPrices: true,
          layout: "grid",
          logo: logoUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to create project")
      }

      const newProject = await response.json()
      setCreatedProjectId(newProject._id)

      await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: newProject._id }),
      }).catch((err) => console.error("Initial auto-deploy failed", err))

      toast.success("Project created successfully!")
      setIsSubmitted(true)
      setIsLoading(false)
    } catch (error) {
      console.error("Project creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create project")
      setIsLoading(false)
      setCurrentStep(3)
    }
  }

  // Show upgrade notice for free users who already created their first project
  const showUpgradeNotice = userPlan && !userPlan.isPremium && existingProjectCount !== null && existingProjectCount >= 1 && currentStep === 1 && !formData.websiteType && !promoDismissed

  const renderStepContent = () => {
    if (showUpgradeNotice) {
      return (
        <div className="flex flex-col h-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
            oh no! you already
            <br />
            created your first
            <br />
            <span className="text-blue-400">free</span> project.
          </h1>

          <div className="mt-8 sm:mt-12 md:mt-16 max-w-sm">
            <div className="rounded-2xl border border-yellow-500/30 bg-white/[0.04] p-5 sm:p-6">
              <div className="flex items-center gap-1.5 mb-3">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-400">Popular</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Sycord+</h2>
              <p className="text-sm text-white/40 mb-4">Growing business</p>
              <div className="mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-white">$9</span>
                <span className="text-sm text-white/40">/mo</span>
              </div>
              <button
                onClick={() => router.push("/subscriptions")}
                className="w-full py-3 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all duration-300 mb-5 min-h-[44px]"
              >
                Upgrade
              </button>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white/70">Unlimited Sites</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white/70">50 GB Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-white/70">AI Builder</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => setPromoDismissed(true)}
              className="text-sm text-white/30 hover:text-white/60 transition-colors min-h-[44px] px-4"
            >
              Continue with Free
            </button>
          </div>
        </div>
      )
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4">
              Choose the type of
              <br />
              your product....
            </h1>
            <p className="text-xs sm:text-sm text-white/40 mb-6 sm:mb-10 md:mb-16">
              Select what best describes your project
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5 max-w-xl">
              {websiteTypes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTypeSelect(id)}
                  className={`group relative aspect-[4/3] rounded-xl sm:rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 min-h-[100px] ${
                    formData.websiteType === id
                      ? "bg-white/15 ring-2 ring-white/30 shadow-lg shadow-white/5"
                      : "bg-white/[0.07] hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-colors ${
                      formData.websiteType === id ? "text-white" : "text-white/40 group-hover:text-white/60"
                    }`}
                  />
                  <span
                    className={`text-xs sm:text-sm font-medium transition-colors ${
                      formData.websiteType === id ? "text-white" : "text-white/40 group-hover:text-white/60"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )

      case 2: {
        const selectedType = websiteTypes.find((t) => t.id === formData.websiteType)
        const TypeIcon = selectedType?.icon
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 sm:mb-4">
              Name & Brand
            </h1>
            {formData.businessName ? (
              <p className="text-xs sm:text-sm mb-6 sm:mb-10">
                <span className="text-emerald-400 font-medium">Nice</span>{" "}
                <span className="text-white/40">name!</span>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-white/40 mb-6 sm:mb-10">
                Enter your business name and add a logo
              </p>
            )}

            <div className="flex-1 flex flex-col items-center justify-start pt-6 sm:pt-10 px-4 sm:px-0">
              {selectedType && TypeIcon && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.07] mb-6">
                  <TypeIcon className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs text-white/40">{selectedType.label}</span>
                </div>
              )}

              {/* Logo Upload */}
              <div className="mb-6 sm:mb-8">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleLogoUpload(e.target.files[0])
                    }
                  }}
                  className="hidden"
                />
                {logoPreview ? (
                  <div className="relative group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-2">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                    </div>
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500/90 hover:bg-red-500 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-5 w-5 text-white/40" />
                    <span className="text-[10px] sm:text-xs text-white/40">Add Logo</span>
                  </button>
                )}
              </div>

              {/* Business Name Input */}
              <input
                type="text"
                className="w-full max-w-md bg-transparent border-0 text-white/70 text-xl sm:text-2xl md:text-3xl text-center focus:outline-none placeholder:text-white/20 min-h-[44px]"
                placeholder="My Business"
                value={formData.businessName}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ ...formData, businessName: value })
                  checkSubdomainAvailability(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNameSubmit()
                  }
                }}
                autoFocus
              />
              {formData.businessName && (
                <div className="mt-4">
                  {subdomainStatus === "checking" && (
                    <p className="text-xs text-white/30">Checking availability...</p>
                  )}
                  {subdomainStatus === "available" && (
                    <p className="text-xs text-emerald-400/70">
                      {generateSubdomain(formData.businessName)}.pages.dev is available
                    </p>
                  )}
                  {subdomainStatus === "taken" && (
                    <p className="text-xs text-red-400/70">
                      {generateSubdomain(formData.businessName)}.pages.dev is already taken
                    </p>
                  )}
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleNameSubmit}
                disabled={!formData.businessName.trim() || subdomainStatus === "taken" || subdomainStatus === "checking"}
                className="mt-8 px-8 py-3 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      }

      case 3:
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4">
              Have you previously
              <br />
              managed a website?
            </h1>
            <p className="text-xs sm:text-sm text-white/40 mb-6 sm:mb-10 md:mb-16">
              This helps us tailor the experience for you
            </p>

            <div className="max-w-xl space-y-3">
              {experienceOptions.map(({ id, label, description }) => (
                <button
                  key={id}
                  onClick={() => handleExperienceSelect(id)}
                  className={`w-full px-5 sm:px-6 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-left transition-all duration-300 min-h-[72px] ${
                    formData.previouslyManaged === id
                      ? "bg-white/15 ring-2 ring-white/30 shadow-lg shadow-white/5"
                      : "bg-white/[0.07] hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`text-sm sm:text-base font-semibold block mb-1 transition-colors ${
                      formData.previouslyManaged === id ? "text-white" : "text-white/60"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-white/30">{description}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            {isLoading && !isSubmitted ? (
              <>
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-white/10 border-t-white/60 animate-spin mb-6 sm:mb-8" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                  Setting things up...
                </h1>
                <p className="text-xs sm:text-sm text-white/40 max-w-sm">
                  {"We're creating your project and preparing everything for you."}
                </p>
              </>
            ) : isSubmitted ? (
              <>
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/10 flex items-center justify-center mb-6 sm:mb-8">
                  <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
                  All done!
                </h1>
                <p className="text-xs sm:text-sm text-white/40 max-w-sm mb-3">
                  Your project <span className="text-white/70">{formData.businessName}</span> has been created
                  and is ready to go.
                </p>
                <p className="text-xs text-white/30 mb-8 sm:mb-10">
                  Available at{" "}
                  <span className="text-white/50">{generateSubdomain(formData.businessName)}.pages.dev</span>
                </p>
                <button
                  onClick={() => {
                    if (createdProjectId) {
                      router.push(`/dashboard/sites/${createdProjectId}`)
                    } else {
                      router.push("/dashboard")
                    }
                  }}
                  className="px-6 sm:px-8 py-3 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 transition-all duration-300 flex items-center gap-2 min-h-[44px]"
                >
                  Go to your project
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                  Something went wrong
                </h1>
                <p className="text-xs sm:text-sm text-white/40 max-w-sm mb-6 sm:mb-8">
                  There was an issue creating your project. Please try again.
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 sm:px-8 py-3 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 transition-all min-h-[44px]"
                >
                  Go back
                </button>
              </>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-[#101010] overflow-hidden">
      {/* Minimalist gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[250px] bg-gradient-to-t from-[#0a1628]/40 via-[#0a1225]/15 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[150px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Main content */}
      <div className="relative h-full flex flex-col">
        {/* Top bar */}
        {currentStep < 4 && (
          <div className="flex items-center px-4 sm:px-6 md:px-10 py-4 sm:py-6">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1)
                } else {
                  router.push("/dashboard")
                }
              }}
              className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm min-h-[44px] min-w-[44px] justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 py-4 sm:py-6 md:py-10">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}
