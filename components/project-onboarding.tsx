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
          <div className="space-y-12 animate-in fade-in duration-300">
            <h2 className="text-4xl md:text-5xl font-bold text-white text-left leading-tight">
              Choose the type of<br />you product....
            </h2>
            <div className="grid grid-cols-3 gap-6 pt-8">
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, projectType: type.id })}
                  className={`aspect-[4/3] rounded-3xl border-2 transition-all duration-200 flex items-center justify-center ${
                    formData.projectType === type.id
                      ? `${type.bgColor} ${type.borderColor} scale-95`
                      : "bg-gray-700/20 border-gray-700/40 hover:border-gray-600/60 hover:bg-gray-700/30"
                  }`}
                >
                  {/* Empty cards matching the screenshot */}
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-12 animate-in fade-in duration-300">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white text-left leading-tight">
                How do we will call<br />your business?
              </h2>
              {formData.businessName.trim() && (
                <p className="text-xl font-medium animate-in slide-in-from-top-2 duration-200">
                  <span className="text-emerald-400">Nice</span> <span className="text-white">name!</span>
                </p>
              )}
            </div>
            
            <div className="space-y-8 pt-12">
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-transparent border-none text-6xl md:text-7xl font-bold text-gray-500 placeholder-gray-700 focus:outline-none focus:text-gray-400 transition-colors text-center"
                placeholder="My flower shop"
                autoFocus
              />
              
              <div className="flex justify-center gap-2.5 pt-6">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((dot) => (
                  <div
                    key={dot}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                      dot === Math.min(formData.businessName.length, 8)
                        ? "bg-white scale-110"
                        : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-12 animate-in fade-in duration-300">
            <h2 className="text-4xl md:text-5xl font-bold text-white text-left leading-tight">
              Do you previously<br />owned/managed a<br />website?
            </h2>
            
            <div className="space-y-5 pt-16">
              <button
                onClick={() => setFormData({ ...formData, experienceLevel: "new" })}
                className={`w-full max-w-xl mx-auto block px-10 py-6 rounded-3xl text-2xl font-medium transition-all duration-200 ${
                  formData.experienceLevel === "new"
                    ? "bg-gray-700/60 text-white border-2 border-gray-600/40"
                    : "bg-gray-800/40 text-gray-400 border-2 border-gray-700/30 hover:bg-gray-700/50 hover:border-gray-600/40 hover:text-gray-300"
                }`}
              >
                I am new at this.
              </button>
              
              <button
                onClick={() => setFormData({ ...formData, experienceLevel: "professional" })}
                className={`w-full max-w-xl mx-auto block px-10 py-6 rounded-3xl text-2xl font-medium transition-all duration-200 ${
                  formData.experienceLevel === "professional"
                    ? "bg-gray-700/60 text-white border-2 border-gray-600/40"
                    : "bg-gray-800/40 text-gray-400 border-2 border-gray-700/30 hover:bg-gray-700/50 hover:border-gray-600/40 hover:text-gray-300"
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
    <div className="min-h-[650px] flex flex-col">
      <div className="flex-1 px-8 py-12">
        {renderStep()}
      </div>
      
      <div className="flex justify-between items-center px-8 py-8 border-t border-white/5">
        <Button
          variant="ghost"
          onClick={currentStep === 1 ? onCancel : handleBack}
          className="text-gray-500 hover:text-white hover:bg-transparent"
        >
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        
        <div className="flex gap-2.5">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? "w-10 bg-white"
                  : step < currentStep
                    ? "w-8 bg-emerald-400"
                    : "w-8 bg-gray-700"
              }`}
            />
          ))}
        </div>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="bg-white text-black hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed px-10 py-6 text-base font-medium rounded-full"
        >
          {currentStep === 3 ? "Create" : "Next"}
        </Button>
      </div>
    </div>
  )
}
