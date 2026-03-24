"use client"

import { useState, useEffect, useCallback } from "react"
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
  CheckCircle2,
  ArrowRight,
} from "lucide-react"
import { themes } from "@/lib/webshop-types"
import { toast } from "sonner"

const steps = [
  { id: 1, name: "Type" },
  { id: 2, name: "Name" },
  { id: 3, name: "Previously managed" },
  { id: 4, name: "Done" },
]

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
  const [formData, setFormData] = useState({
    websiteType: "",
    businessName: "",
    previouslyManaged: "",
    selectedStyle: "modern",
    status: "pending",
  })

  if (status === "unauthenticated") {
    router.push("/login")
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

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!formData.websiteType
      case 2:
        return !!formData.businessName
      case 3:
        return !!formData.previouslyManaged
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!isStepValid()) return
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      if (nextStep === 4) {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 4) {
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
      const subdomain = generateSubdomain(formData.businessName)

      if (!formData.businessName || !formData.websiteType) {
        throw new Error("Business name and website type are required")
      }
      if (!subdomain) {
        throw new Error("Could not generate a valid subdomain from your business name")
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
                }}
                autoFocus
              />
              {formData.businessName && (
                <p className="text-sm text-white/30 pl-1">
                  Your site will be available at{" "}
                  <span className="text-white/50">{generateSubdomain(formData.businessName)}.pages.dev</span>
                </p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="flex flex-col h-full">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Have you previously
              <br />
              managed a website?
            </h1>
            <p className="text-sm text-white/40 mb-10 md:mb-16">
              This helps us tailor the experience for you
            </p>

            <div className="max-w-xl space-y-3">
              {experienceOptions.map(({ id, label, description }) => (
                <button
                  key={id}
                  onClick={() => setFormData({ ...formData, previouslyManaged: id })}
                  className={`w-full px-6 py-5 rounded-2xl text-left transition-all duration-300 ${
                    formData.previouslyManaged === id
                      ? "bg-white/15 ring-2 ring-white/30 shadow-lg shadow-white/5"
                      : "bg-white/[0.07] hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`text-base font-semibold block mb-1 transition-colors ${
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
          <div className="flex flex-col items-center justify-center h-full text-center">
            {isLoading && !isSubmitted ? (
              <>
                <div className="h-16 w-16 rounded-full border-2 border-white/10 border-t-white/60 animate-spin mb-8" />
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  Setting things up...
                </h1>
                <p className="text-sm text-white/40 max-w-sm">
                  We&apos;re creating your project and preparing everything for you.
                </p>
              </>
            ) : isSubmitted ? (
              <>
                <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center mb-8">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
                  All done!
                </h1>
                <p className="text-sm text-white/40 max-w-sm mb-3">
                  Your project <span className="text-white/70">{formData.businessName}</span> has been created
                  and is ready to go.
                </p>
                <p className="text-xs text-white/30 mb-10">
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
                  className="px-8 py-3 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 transition-all duration-300 flex items-center gap-2"
                >
                  Go to your project
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  Something went wrong
                </h1>
                <p className="text-sm text-white/40 max-w-sm mb-8">
                  There was an issue creating your project. Please try again.
                </p>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 transition-all"
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

  const showBottomNav = currentStep < 4

  return (
    <div className="fixed inset-0 bg-[#0e0e10] overflow-hidden">
      {/* Minimalist gradient - subtle blue glow at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-blue-950/20 via-blue-950/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-blue-600/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Main content */}
      <div className="relative h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6">
          {currentStep < 4 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{currentStep === 1 ? "Dashboard" : "Back"}</span>
            </button>
          ) : (
            <div />
          )}

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

        {/* Bottom navigation - hidden on "Done" step */}
        {showBottomNav && (
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
                {currentStep === 3 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
