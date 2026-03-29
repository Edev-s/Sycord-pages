"use client"

import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, Check } from "lucide-react"

interface UpgradePromptModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradePromptModal({ isOpen, onClose }: UpgradePromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center text-white">
            Upgrade to Create More Projects
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-base pt-2">
            You've reached your free plan limit of 1 project. Upgrade to unlock unlimited projects and premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Unlimited Projects</p>
                <p className="text-sm text-gray-400">Create as many websites as you need</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Custom Domains</p>
                <p className="text-sm text-gray-400">Use your own domain names</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Priority Support</p>
                <p className="text-sm text-gray-400">Get help when you need it</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">Advanced AI Features</p>
                <p className="text-sm text-gray-400">Access to premium AI tools</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 text-white hover:bg-white/5"
          >
            Maybe Later
          </Button>
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
          >
            <Link href="/subscriptions">
              View Plans
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
