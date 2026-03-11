"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Info, Tag } from "lucide-react"
import { useRef, useState, useEffect } from "react"

// GitHub logo with text
function GitHubLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className="h-5 w-5" viewBox="0 0 98 96" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
      </svg>
      <span className="font-semibold text-sm">GitHub</span>
    </div>
  )
}

// Simple cloud icon for Cloudflare
function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    </svg>
  )
}

// Google text logo
function GoogleLogo({ className }: { className?: string }) {
  return (
    <span className={`font-medium tracking-tight ${className}`} style={{ fontFamily: 'Product Sans, Arial, sans-serif' }}>
      Google
    </span>
  )
}

// Vercel logo
function VercelLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className="h-4 w-4" viewBox="0 0 76 65" fill="currentColor">
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/>
      </svg>
      <span className="font-semibold text-sm">Vercel</span>
    </div>
  )
}

// AWS logo
function AWSLogo({ className }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      AWS
    </span>
  )
}

// Microsoft logo
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className="h-4 w-4" viewBox="0 0 23 23" fill="currentColor">
        <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/>
      </svg>
      <span className="font-semibold text-sm">Microsoft</span>
    </div>
  )
}

// Supporter icons marquee component - continuous loop moving left
function SupporterMarquee() {
  const supporters = [
    { name: "GitHub", Component: GitHubLogo },
    { name: "Cloudflare", Component: CloudIcon, isIcon: true },
    { name: "Google", Component: GoogleLogo, isText: true },
    { name: "Vercel", Component: VercelLogo },
    { name: "AWS", Component: AWSLogo, isText: true },
    { name: "Microsoft", Component: MicrosoftLogo },
  ]

  return (
    <div className="relative overflow-hidden py-6">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...supporters, ...supporters, ...supporters].map((supporter, index) => (
          <div
            key={`${supporter.name}-${index}`}
            className="flex items-center justify-center mx-10 flex-shrink-0"
          >
            {supporter.isIcon ? (
              <supporter.Component className="h-6 w-8 text-muted-foreground/70" />
            ) : supporter.isText ? (
              <supporter.Component className="text-lg text-muted-foreground/70" />
            ) : (
              <supporter.Component className="text-muted-foreground/70" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Pricing plans data
const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    features: [
      "1 website",
      "Basic AI generation",
      "Sycord subdomain",
      "Community support",
    ],
    buttonText: "Get started",
    popular: false,
  },
  {
    name: "Pro",
    price: "9",
    description: "For growing businesses",
    features: [
      "5 websites",
      "Advanced AI generation",
      "Custom domain",
      "Priority support",
      "Advanced analytics",
    ],
    buttonText: "Start free trial",
    popular: true,
  },
  {
    name: "Business",
    price: "29",
    description: "For teams and agencies",
    features: [
      "Unlimited websites",
      "Premium AI generation",
      "Multiple custom domains",
      "24/7 dedicated support",
      "Full analytics suite",
      "API access",
    ],
    buttonText: "Contact sales",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "99",
    description: "Custom solutions",
    features: [
      "Everything in Business",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    buttonText: "Contact sales",
    popular: false,
  },
]

export default function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Handle scroll to update active dot
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const cardWidth = container.offsetWidth * 0.85 + 16 // card width + gap
      const index = Math.round(scrollLeft / cardWidth)
      setActiveIndex(Math.min(index, plans.length - 1))
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll to specific plan
  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current
    if (!container) return
    const cardWidth = container.offsetWidth * 0.85 + 16
    container.scrollTo({ left: index * cardWidth, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={24} height={24} />
            <span className="text-base font-semibold text-white">Sycord</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-white/80 text-sm px-3 h-9">
                Bejelentkezes
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-white/90 text-sm rounded-lg px-4 h-9 font-medium">
                Kezdes
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-4">
        {/* iPhone mockup - positioned at right edge */}
        <div className="absolute top-8 right-0 w-[55%] h-[350px] overflow-hidden pointer-events-none">
          <div className="relative w-full h-full">
            <Image
              src="/iphone-mockup.jpg"
              alt="iPhone showing Sycord"
              fill
              className="object-cover object-left"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 px-5 pt-8 pb-12">
          <h1 className="text-[2rem] leading-tight font-bold mb-10 max-w-[65%]">
            <span className="text-white">Create </span>
            <span className="text-[#6b6b6b]">your website </span>
            <span className="text-white">under 5 minute!</span>
          </h1>
          
          <Link href="/login">
            <Button 
              className="bg-[#3a3a3c] hover:bg-[#4a4a4c] text-white text-base px-8 py-6 rounded-full font-medium"
            >
              Get started
            </Button>
          </Link>
        </div>
      </section>

      {/* Corporate Supporters Section */}
      <section className="pt-8 pb-2">
        <SupporterMarquee />
        
        <div className="flex justify-center mt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2a2c] text-sm text-[#888]">
            <span>Corporate Supporters:</span>
            <Info className="h-4 w-4" />
          </div>
        </div>
      </section>

      {/* Page indicator dots */}
      <div className="flex justify-center gap-2 py-6">
        {plans.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`transition-all duration-300 ${
              index === activeIndex 
                ? "w-6 h-2 rounded-full bg-[#6b6b6b]" 
                : "w-2 h-2 rounded-full bg-[#3a3a3c]"
            }`}
            aria-label={`Go to plan ${index + 1}`}
          />
        ))}
      </div>

      {/* Pricing Section - Horizontal Scrollable */}
      <section className="pb-8">
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex-shrink-0 w-[85%] snap-center"
            >
              <div
                className={`relative rounded-2xl border ${
                  plan.popular 
                    ? "border-white/20 bg-[#1a1a1c]" 
                    : "border-[#2a2a2c] bg-[#1a1a1c]"
                } p-5 min-h-[320px]`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 text-xs font-medium bg-white text-black rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                
                {/* Header row with icon, name, and button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#2a2a2c]">
                      <Tag className="h-5 w-5 text-[#6b6b6b]" />
                    </div>
                    <span className="text-xl font-semibold text-white">{plan.name}</span>
                  </div>
                  
                  <Button
                    variant="secondary"
                    className="rounded-lg px-4 h-9 bg-[#2a2a2c] hover:bg-[#3a3a3c] text-white/80 text-sm"
                  >
                    {plan.buttonText}
                  </Button>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-[#6b6b6b]">/month</span>
                </div>

                <p className="text-sm text-[#6b6b6b] mb-6">{plan.description}</p>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-500" />
                      </div>
                      <span className="text-sm text-[#888]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2c] mt-8">
        <div className="px-4 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={20} height={20} />
              <span className="text-xs text-[#6b6b6b]">2024 Sycord. Minden jog fenntartva.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-xs text-[#6b6b6b] hover:text-white">
                Twitter
              </Link>
              <Link href="#" className="text-xs text-[#6b6b6b] hover:text-white">
                GitHub
              </Link>
              <Link href="#" className="text-xs text-[#6b6b6b] hover:text-white">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
