"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ProjectOnboardingProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

const projectTypes = [
  { id: "portfolio", label: "Portfolio", bgColor: "bg-purple-500/20", borderColor: "border-purple-500/30" },
  { id: "blog", label: "Blog", bgColor: "bg-blue-500/20", borderColor: "border-blue-500/30" },
  { id: "ecommerce", label: "E-commerce", bgColor: "bg-green-500/20", borderColor: "border-green-500/30" },
  { id: "business", label: "Business", bgColor: "bg-orange-500/20", borderColor: "border-orange-500/30" },
  { id: "landing", label: "Landing Page", bgColor: "bg-pink-500/20", borderColor: "border-pink-500/30" },
  { id: "other", label: "Other", bgColor: "bg-gray-500/20", borderColor: "border-gray-500/30" },
]

export function ProjectOnboarding({ onSubmit, onCancel }: ProjectOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    projectType: "",
    businessName: "",
    experienceLevel: "",
  })

  const handleNext = () => {
    if (currentStep === 1 && !formData.projectType) return
    if (currentStep === 2 && !formData.businessName.trim()) return
    if (currentStep === 3 && !formData.experienceLevel) return

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      onSubmit(formData)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-left leading-tight">
              Choose the type of<br />you product....
            </h2>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, projectType: type.id })}
                  className={`aspect-[4/3] rounded-2xl border-2 transition-all duration-200 ${
                    formData.projectType === type.id
                      ? `${type.bgColor} ${type.borderColor} scale-95`
                      : "bg-gray-700/30 border-gray-600/30 hover:border-gray-500/50 hover:bg-gray-700/40"
                  }`}
                >
                  <span className="text-sm font-medium text-white/90">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold text-white text-left leading-tight">
                How do we will call<br />your business?
              </h2>
              {formData.businessName.trim() && (
                <p className="text-lg text-emerald-400 font-medium animate-in slide-in-from-top-2 duration-200">
                  <span className="text-emerald-400">Nice</span> name!
                </p>
              )}
            </div>
            
            <div className="space-y-6 pt-8">
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-transparent border-none text-5xl md:text-6xl font-bold text-gray-400 placeholder-gray-600 focus:outline-none focus:text-white transition-colors text-center"
                placeholder="My flower shop"
                autoFocus
              />
              
              <div className="flex justify-center gap-2 pt-4">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dot) => (
                  <div
                    key={dot}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      dot === Math.min(formData.businessName.length, 8)
                        ? "bg-white"
                        : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-left leading-tight">
              Do you previously<br />owned/managed a<br />website?
            </h2>
            
            <div className="space-y-4 pt-8">
              <button
                onClick={() => setFormData({ ...formData, experienceLevel: "new" })}
                className={`w-full max-w-md mx-auto block px-8 py-5 rounded-2xl text-xl font-medium transition-all duration-200 ${
                  formData.experienceLevel === "new"
                    ? "bg-white/20 text-white border-2 border-white/30"
                    : "bg-gray-700/40 text-gray-300 border-2 border-gray-600/30 hover:bg-gray-700/60 hover:border-gray-500/50"
                }`}
              >
                I am new at this.
              </button>
              
              <button
                onClick={() => setFormData({ ...formData, experienceLevel: "professional" })}
                className={`w-full max-w-md mx-auto block px-8 py-5 rounded-2xl text-xl font-medium transition-all duration-200 ${
                  formData.experienceLevel === "professional"
                    ? "bg-white/20 text-white border-2 border-white/30"
                    : "bg-gray-700/40 text-gray-300 border-2 border-gray-600/30 hover:bg-gray-700/60 hover:border-gray-500/50"
                }`}
              >
                I am professional
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.projectType
      case 2:
        return !!formData.businessName.trim()
      case 3:
        return !!formData.experienceLevel
      default:
        return false
    }
  }

  return (
    <div className="min-h-[600px] flex flex-col">
      <div className="flex-1 px-4 py-8">
        {renderStep()}
      </div>
      
      <div className="flex justify-between items-center px-4 py-6 border-t border-white/5">
        <Button
          variant="ghost"
          onClick={currentStep === 1 ? onCancel : handleBack}
          className="text-gray-400 hover:text-white"
        >
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        
        <div className="flex gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? "w-8 bg-white"
                  : step < currentStep
                    ? "w-6 bg-emerald-400"
                    : "w-6 bg-gray-600"
              }`}
            />
          ))}
        </div>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="bg-white text-black hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed px-8"
        >
          {currentStep === 3 ? "Create" : "Next"}
        </Button>
      </div>
    </div>
  )
}
