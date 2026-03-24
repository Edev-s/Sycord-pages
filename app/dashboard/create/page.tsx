"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  Briefcase,
  ShoppingCart,
  BookOpen,
  HelpCircle,
  Globe,
  ArrowLeft,
  Check,
  ImageIcon,
} from "lucide-react"
import { themes } from "@/lib/webshop-types"
import { toast } from "sonner"

const steps = [
  { id: 1, name: "Type" },
  { id: 2, name: "Name" },
  { id: 3, name: "Domain" },
  { id: 4, name: "Style" },
]

const websiteTypes = [
  { id: "service", label: "Service", icon: Briefcase, description: "Business & services" },
  { id: "hosting", label: "Hosting", icon: Globe, description: "Hosting provider" },
  { id: "webshop", label: "Webshop", icon: ShoppingCart, description: "Online store" },
  { id: "blog", label: "Blog", icon: BookOpen, description: "Blog & content" },
  { id: "portfolio", label: "Portfolio", icon: ImageIcon, description: "Showcase your work" },
  { id: "other", label: "Other", icon: HelpCircle, description: "Something else" },
]

export default function CreateProjectPage() {
  const router = useRouter()
  const { status } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasDomain, setHasDomain] = useState(false)
  const [formData, setFormData] = useState({
    websiteType: "",
    businessName: "",
    domain: "",
    subdomain: "",
    selectedStyle: "modern",
    status: "pending",
  })
  const [suggestedDomains, setSuggestedDomains] = useState<string[]>([])
  const [subdomainError, setSubdomainError] = useState("")

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const generateDomainSuggestions = (name: string) => {
    if (!name.trim()) {
      setSuggestedDomains([])
      return
    }
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20)
    setSuggestedDomains([`${slug}.com`, `${slug}.hu`, `${slug}online.hu`])
  }

  const validateSubdomain = (value: string) => {
    if (!value) {
      setSubdomainError("Subdomain is required")
      return false
    }
    if (value.length < 3) {
      setSubdomainError("At least 3 characters")
      return false
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      setSubdomainError("Only lowercase letters, numbers and hyphens")
      return false
    }
    if (value.startsWith("-") || value.endsWith("-")) {
      setSubdomainError("Cannot start or end with a hyphen")
      return false
    }
    setSubdomainError("")
    return true
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!formData.websiteType
      case 2:
        return !!formData.businessName
      case 3:
        return hasDomain ? !!formData.domain : !!formData.subdomain && !subdomainError
      case 4:
        return !!formData.selectedStyle
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!isStepValid()) return
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push("/dashboard")
    }
  }

  const handleSubmit = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const theme = themes[formData.selectedStyle as keyof typeof themes]

      if (!formData.businessName || !formData.websiteType) {
        throw new Error("Business name and website type are required")
      }
      if (!formData.domain && !formData.subdomain) {
        throw new Error("Either a domain or subdomain is required")
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          websiteType: formData.websiteType,
          domain: formData.domain || null,
          subdomain: formData.subdomain || null,
          theme: formData.selectedStyle,
          primaryColor: theme.primary,
          secondaryColor: theme.secondary,
          headerStyle: "simple",
          productsPerPage: 12,
          currency: "EUR",
          showPrices: true,
          layout: "grid",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to create project")
      }

      const newProject = await response.json()

      await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: newProject._id }),
      }).catch((err) => console.error("Initial auto-deploy failed", err))

      toast.success("Project created successfully!")
      router.push(`/dashboard/sites/${newProject._id}`)
    } catch (error) {
      console.error("Project creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create project")
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Choose the type of
              <br />
              your product....
            </h1>
            <p className="text-sm text-white/40 mb-10 md:mb-16">
              Select what best describes your project
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 max-w-xl">
              {websiteTypes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setFormData({ ...formData, websiteType: id })}
                  className={`group relative aspect-[4/3] rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                    formData.websiteType === id
                      ? "bg-white/15 ring-2 ring-white/30 shadow-lg shadow-white/5"
                      : "bg-white/[0.07] hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 sm:h-7 sm:w-7 transition-colors ${
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

      case 2:
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              What&apos;s the name of
              <br />
              your business?
            </h1>
            <p className="text-sm text-white/40 mb-10 md:mb-16">
              This will be displayed on your website
            </p>

            <div className="max-w-xl space-y-4">
              <input
                type="text"
                className="w-full px-5 py-4 rounded-2xl bg-white/[0.07] border-0 text-white placeholder:text-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="e.g. My Business"
                value={formData.businessName}
                onChange={(e) => {
                  const value = e.target.value
                  setFormData({ ...formData, businessName: value })
                  generateDomainSuggestions(value)
                }}
                autoFocus
              />
              {formData.businessName && (
                <p className="text-sm text-white/30 pl-1">
                  Looks good! Press next to continue.
                </p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Set up your
              <br />
              domain....
            </h1>
            <p className="text-sm text-white/40 mb-10 md:mb-12">
              Choose how people will access your site
            </p>

            <div className="max-w-xl space-y-6">
              {/* Domain toggle */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setHasDomain(false)
                    setFormData({ ...formData, domain: "", subdomain: "" })
                    setSubdomainError("")
                  }}
                  className={`flex-1 px-5 py-3 rounded-2xl text-sm font-medium transition-all ${
                    !hasDomain
                      ? "bg-white/15 text-white ring-1 ring-white/20"
                      : "bg-white/[0.07] text-white/40 hover:bg-white/10 hover:text-white/60"
                  }`}
                >
                  I don&apos;t have a domain
                </button>
                <button
                  onClick={() => {
                    setHasDomain(true)
                    setFormData({ ...formData, domain: "", subdomain: "" })
                    setSubdomainError("")
                  }}
                  className={`flex-1 px-5 py-3 rounded-2xl text-sm font-medium transition-all ${
                    hasDomain
                      ? "bg-white/15 text-white ring-1 ring-white/20"
                      : "bg-white/[0.07] text-white/40 hover:bg-white/10 hover:text-white/60"
                  }`}
                >
                  I have a domain
                </button>
              </div>

              {!hasDomain ? (
                <div className="space-y-4">
                  <div className="px-5 py-4 rounded-2xl bg-white/[0.05] border border-white/10">
                    <p className="text-xs text-white/30 mb-1">Your site URL</p>
                    <p className="text-lg font-semibold text-white">
                      {formData.subdomain || "yoursite"}.pages.dev
                    </p>
                  </div>
                  <input
                    type="text"
                    className={`w-full px-5 py-4 rounded-2xl bg-white/[0.07] border-0 text-white placeholder:text-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all ${
                      subdomainError ? "ring-2 ring-red-500/50" : ""
                    }`}
                    placeholder="e.g. mytestsite"
                    value={formData.subdomain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().trim()
                      setFormData({ ...formData, subdomain: value, domain: "" })
                      validateSubdomain(value)
                    }}
                    autoFocus
                  />
                  {subdomainError && (
                    <p className="text-sm text-red-400 pl-1">{subdomainError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestedDomains.length > 0 && (
                    <>
                      <p className="text-xs text-white/30">Suggested domains</p>
                      <div className="space-y-2">
                        {suggestedDomains.map((domain) => (
                          <button
                            key={domain}
                            onClick={() =>
                              setFormData({ ...formData, domain, subdomain: "" })
                            }
                            className={`w-full px-5 py-3 rounded-2xl text-left transition-all ${
                              formData.domain === domain
                                ? "bg-white/15 text-white ring-1 ring-white/20"
                                : "bg-white/[0.07] text-white/60 hover:bg-white/10"
                            }`}
                          >
                            {domain}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <p className="text-xs text-white/30 mb-2">Custom domain</p>
                    <input
                      type="text"
                      placeholder="e.g. mydomain.com"
                      className="w-full px-5 py-4 rounded-2xl bg-white/[0.07] border-0 text-white placeholder:text-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                      value={formData.domain}
                      onChange={(e) => {
                        const value = e.target.value.trim()
                        setFormData({ ...formData, domain: value })
                      }}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Pick a style for
              <br />
              your website....
            </h1>
            <p className="text-sm text-white/40 mb-10 md:mb-12">
              You can always change this later
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setFormData({ ...formData, selectedStyle: key })}
                  className={`group p-4 rounded-2xl transition-all duration-300 ${
                    formData.selectedStyle === key
                      ? "bg-white/15 ring-2 ring-white/30 shadow-lg shadow-white/5"
                      : "bg-white/[0.07] hover:bg-white/10"
                  }`}
                >
                  <div className="flex gap-1.5 h-8 rounded-lg overflow-hidden mb-3">
                    <div className="flex-1 rounded-sm" style={{ backgroundColor: theme.primary }} />
                    <div className="flex-1 rounded-sm" style={{ backgroundColor: theme.secondary }} />
                    <div className="flex-1 rounded-sm" style={{ backgroundColor: theme.accent }} />
                  </div>
                  <h3
                    className={`font-semibold text-sm text-left transition-colors ${
                      formData.selectedStyle === key ? "text-white" : "text-white/60"
                    }`}
                  >
                    {theme.name}
                  </h3>
                  <p className="text-xs text-white/30 text-left line-clamp-1 mt-0.5">
                    {theme.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0c0c0e] overflow-hidden">
      {/* Blue glow effect - bottom right */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-50px] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Splash SVG decoration */}
      <svg
        className="absolute bottom-8 right-8 w-24 h-24 text-white/[0.03] pointer-events-none"
        viewBox="0 0 120 120"
        fill="currentColor"
      >
        <path d="M60 10c-5 15-20 25-30 40-8 12-10 28 0 40s30 18 45 10 25-25 20-45c-3-12-10-22-18-30S65 12 60 10z" />
        <circle cx="35" cy="30" r="4" opacity="0.5" />
        <circle cx="85" cy="25" r="3" opacity="0.4" />
        <circle cx="25" cy="55" r="2.5" opacity="0.3" />
      </svg>

      {/* Main content */}
      <div className="relative h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{currentStep === 1 ? "Dashboard" : "Back"}</span>
          </button>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                    currentStep > step.id
                      ? "bg-white text-black"
                      : currentStep === step.id
                        ? "bg-white/20 text-white ring-1 ring-white/30"
                        : "bg-white/[0.07] text-white/30"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-8 h-px transition-colors ${
                      currentStep > step.id ? "bg-white/40" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step label */}
          <span className="text-xs text-white/30 min-w-[60px] text-right">
            {currentStep}/{steps.length}
          </span>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 md:px-16 lg:px-24 py-6 sm:py-10">
          {renderStepContent()}
        </div>

        {/* Bottom navigation */}
        <div className="px-6 sm:px-10 py-6 border-t border-white/[0.06]">
          <div className="flex items-center justify-between max-w-xl">
            <button
              onClick={handleBack}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid() || isLoading}
              className={`px-8 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                isStepValid() && !isLoading
                  ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10"
                  : "bg-white/10 text-white/20 cursor-not-allowed"
              }`}
            >
              {isLoading
                ? "Creating..."
                : currentStep === steps.length
                  ? "Create Project"
                  : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
