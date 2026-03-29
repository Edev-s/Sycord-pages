"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ProjectOnboarding } from "./project-onboarding"
import { UpgradePromptModal } from "./upgrade-prompt-modal"
import { themes } from "@/lib/webshop-types"
import { toast } from "sonner"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  projectCount?: number
  userSubscription?: string
}

export function CreateProjectModal({ isOpen, onClose, projectCount = 0, userSubscription = "Free" }: CreateProjectModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Check if user is on free plan and already has a project
  useEffect(() => {
    if (isOpen && userSubscription === "Free" && projectCount >= 1) {
      setShowUpgradePrompt(true)
    }
  }, [isOpen, userSubscription, projectCount])

  const handleFormSubmit = async (formData: any) => {
    if (isLoading) return

    // Double check free plan limit
    if (userSubscription === "Free" && projectCount >= 1) {
      setShowUpgradePrompt(true)
      return
    }

    console.log("[v0] Onboarding form submitted with data:", formData)
    setIsLoading(true)

    try {
      // Map onboarding data to project creation format
      const projectData = {
        businessName: formData.businessName,
        websiteType: formData.projectType,
        experienceLevel: formData.experienceLevel,
        subdomain: formData.businessName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .substring(0, 20),
        theme: "modern",
        primaryColor: themes.modern.primary,
        secondaryColor: themes.modern.secondary,
        headerStyle: "simple",
        productsPerPage: 12,
        currency: "EUR",
        showPrices: true,
        layout: "grid",
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to create project")
      }

      const newProject = await response.json()
      console.log("[v0] Project created successfully:", newProject._id)

      // Auto-deploy the idle page in background
      await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: newProject._id }),
      }).catch(err => console.error("Initial auto-deploy failed", err));

      toast.success("Project created successfully!")

      setIsLoading(false)
      onClose()

      // Wait a bit for modal to close before redirecting
      setTimeout(() => {
        router.push(`/dashboard/sites/${newProject._id}`)
      }, 100)
    } catch (error) {
      console.error("[v0] Project creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create project")
      setIsLoading(false)
    }
  }

  // Show upgrade prompt if user is on free plan with existing project
  if (showUpgradePrompt) {
    return (
      <UpgradePromptModal
        isOpen={showUpgradePrompt}
        onClose={() => {
          setShowUpgradePrompt(false)
          onClose()
        }}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-[#1a1a1a] border-white/10">
        <ProjectOnboarding 
          onSubmit={handleFormSubmit} 
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
