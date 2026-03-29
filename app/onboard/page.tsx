"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Zap, Check, Briefcase, BookOpen, ShoppingCart, User2, FileText, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const projectTypes = [
  { id: "service", label: "Service", icon: Briefcase },
  { id: "blog", label: "Blog", icon: BookOpen },
  { id: "ecommerce", label: "Store", icon: ShoppingCart },
  { id: "portfolio", label: "Portfolio", icon: User2 },
  { id: "landing", label: "Landing Page", icon: FileText },
  { id: "other", label: "Other", icon: MoreHorizontal },
]

type Step = "type" | "name" | "profession" | "done"

export default function OnboardPage() {
  const router = useRouter()
  const { status } = useSession()
  const [step, setStep] = useState<Step>("type")
  const [formData, setFormData] = useState({
    projectType: "",
    businessName: "",
    experienceLevel: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      checkProjectCount()
    }
  }, [status])

  useEffect(() => {
    if (step === "name" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [step])

  const checkProjectCount = async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const projects = await res.json()
        if (Array.isArray(projects) && projects.length >= 1) {
          setStep("done")
        }
      }
    } catch {
      // proceed to normal flow
    } finally {
      setInitializing(false)
    }
  }

  const handleCreateProject = async (experienceLevel: string) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const subdomain = formData.businessName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .substring(0, 20)

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          websiteType: formData.projectType,
          experienceLevel,
          subdomain,
          theme: "modern",
          primaryColor: "#ffffff",
          secondaryColor: "#000000",
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

      // Auto-deploy idle page in background
      fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: newProject._id }),
      }).catch((err) => console.error("Initial auto-deploy failed", err))

      router.push(`/dashboard/sites/${newProject._id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project")
      setIsLoading(false)
    }
  }

  if (initializing || status === "loading") {
    return (
      <div className="min-h-screen bg-[#18191B] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#18191B] relative overflow-hidden flex flex-col">
      {/* Blue radial glow – bottom right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[480px] w-[480px] translate-x-1/4 translate-y-1/4 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(10,40,80,0.55) 0%, transparent 70%)",
        }}
      />

      {/* Step content */}
      <div className="relative z-10 flex flex-1 flex-col px-5 sm:px-8 pt-16 sm:pt-24">
        {step === "type" && (
          <div className="animate-in fade-in duration-300">
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              Choose the type of
              <br />
              you product....
            </h1>

            <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {projectTypes.map((type) => {
                const Icon = type.icon
                const selected = formData.projectType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setFormData((d) => ({ ...d, projectType: type.id }))
                      setTimeout(() => setStep("name"), 180)
                    }}
                    className={`flex flex-col items-center justify-center gap-3 rounded-3xl py-8 sm:py-10 transition-all duration-200 ${
                      selected
                        ? "bg-white/10 scale-95 ring-2 ring-white/30"
                        : "bg-[#2a2a2e]/70 hover:bg-[#3a3a3e]/80"
                    }`}
                  >
                    <Icon className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${selected ? "text-white" : "text-white/50"}`} strokeWidth={1.5} />
                    <span className={`text-sm sm:text-base font-medium transition-colors ${selected ? "text-white" : "text-white/50"}`}>
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === "name" && (
          <div className="animate-in fade-in duration-300">
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              How do we will call
              <br />
              your business?
            </h1>

            {formData.businessName.trim() ? (
              <p className="mt-4 text-lg font-medium animate-in slide-in-from-top-2 duration-200">
                <span className="text-emerald-400">Nice</span>{" "}
                <span className="text-white">name!</span>
              </p>
            ) : (
              <div className="mt-4 h-7" />
            )}

            <div className="mt-24 flex flex-col items-center">
              <input
                ref={inputRef}
                type="text"
                value={formData.businessName}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, businessName: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formData.businessName.trim()) {
                    setStep("profession")
                  }
                }}
                className="w-full bg-transparent border-none text-center text-4xl font-bold text-white/40 placeholder-white/20 focus:outline-none focus:text-white/60 transition-colors sm:text-6xl"
                placeholder="My flower shop"
              />

              {/* Dot progress indicator */}
              <div className="mt-6 flex gap-2.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                      i < formData.businessName.length
                        ? "bg-white"
                        : "bg-[#3a3a3a]"
                    }`}
                  />
                ))}
              </div>
            </div>

            {formData.businessName.trim() && (
              <div className="mt-16 flex justify-center">
                <button
                  onClick={() => setStep("profession")}
                  className="rounded-full bg-white px-10 py-4 text-base font-semibold text-black transition hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {step === "profession" && (
          <div className="animate-in fade-in duration-300">
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              Do you previously
              <br />
              owned/managed a
              <br />
              websit?
            </h1>

            <div className="mt-16 sm:mt-24 flex flex-col gap-4">
              <button
                onClick={() => {
                  setFormData((d) => ({ ...d, experienceLevel: "new" }))
                  handleCreateProject("new")
                }}
                className="w-full rounded-[20px] bg-[#3a3a3a]/70 px-8 py-6 text-2xl font-medium text-white/80 transition hover:bg-[#4a4a4a]/80 hover:text-white"
              >
                I am new at this.
              </button>

              <button
                onClick={() => {
                  setFormData((d) => ({
                    ...d,
                    experienceLevel: "professional",
                  }))
                  handleCreateProject("professional")
                }}
                className="w-full rounded-[20px] bg-[#3a3a3a]/70 px-8 py-6 text-2xl font-medium text-white/80 transition hover:bg-[#4a4a4a]/80 hover:text-white"
              >
                I am professional
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="animate-in fade-in duration-300">
            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              oh no! you alread
              <br />
              created your first{" "}
              <span className="text-cyan-400">free</span> project.
            </h1>

            <div className="mt-20">
              {/* Sycord+ plan card */}
              <div className="rounded-2xl border border-amber-500/40 bg-[#1e1e22] p-6">
                {/* Badge */}
                <div className="mb-4 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-400" fill="currentColor" />
                  <span className="text-xs font-semibold text-amber-400">
                    Popular
                  </span>
                </div>

                {/* Plan name & description */}
                <p className="text-2xl font-bold text-white">Sycord+</p>
                <p className="mt-0.5 text-sm text-white/50">Growing business</p>

                {/* Price */}
                <p className="mt-4 text-white">
                  <span className="text-4xl font-bold">$9</span>
                  <span className="text-base text-white/50">/mo</span>
                </p>

                {/* CTA */}
                <Link
                  href="/subscriptions"
                  className="mt-5 block w-full rounded-xl bg-[#2e2e34] py-3.5 text-center text-sm font-medium text-white/70 transition hover:bg-[#383840] hover:text-white"
                >
                  Upgrade Now
                </Link>

                {/* Features */}
                <div className="mt-6 space-y-2.5">
                  {["Unlimited Sites", "50 GB Storage", "AI Builder"].map(
                    (feature) => (
                      <div key={feature} className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                        <span className="text-sm text-white/70">{feature}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-white/40 transition hover:text-white/70"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back button (type and name steps) */}
      {(step === "name" || step === "type") && (
        <div className="relative z-10 px-8 pb-10">
          <button
            onClick={() => {
              if (step === "name") setStep("type")
              else router.push("/dashboard")
            }}
            className="text-sm text-white/40 transition hover:text-white/70"
          >
            {step === "type" ? "Cancel" : "Back"}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#18191B]/70">
          <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}
    </div>
  )
}
