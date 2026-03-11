"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Info, Tag } from "lucide-react"
import { useRef, useState } from "react"

// Corporate supporter logos as SVG components
function GitHubLogo({ className }: { className?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg className={className} viewBox="0 0 98 96" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
      </svg>
      <span className="text-lg font-semibold">GitHub</span>
    </div>
  )
}

function CloudflareLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40" fill="currentColor">
      <path d="M54.8 17.6c-.3-1-1.1-1.6-2.1-1.6h-2.5l-.2-.4c-.5-1.5-1.8-2.6-3.5-2.6h-7.7c-1.7 0-3 1.1-3.5 2.6l-.2.4h-2.5c-1 0-1.8.6-2.1 1.6l-.4 1.6h25.1l-.4-1.6zm2.6 3.2H22.6l-.6 2.4c-.2.8.3 1.4 1.1 1.4h33.8c.8 0 1.5-.6 1.1-1.4l-.6-2.4z"/>
    </svg>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <span className="text-2xl font-medium tracking-tight">Google</span>
  )
}

// Supporter icons marquee component
function SupporterMarquee() {
  const supporters = [
    { name: "GitHub", logo: GitHubLogo },
    { name: "Cloudflare", logo: CloudflareLogo },
    { name: "Google", logo: GoogleLogo },
  ]

  return (
    <div className="relative overflow-hidden py-6">
      <div className="flex animate-marquee">
        {[...supporters, ...supporters, ...supporters, ...supporters, ...supporters, ...supporters].map((supporter, index) => (
          <div
            key={`${supporter.name}-${index}`}
            className="flex items-center justify-center mx-12 min-w-[140px]"
          >
            <supporter.logo className="h-5 w-auto text-muted-foreground/70" />
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
    features: [
      "1 website",
      "Basic AI generation",
      "Sycord subdomain",
    ],
  },
  {
    name: "Pro",
    price: "9",
    features: [
      "5 websites",
      "Advanced AI generation",
      "Custom domain",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: "29",
    features: [
      "Unlimited websites",
      "Premium AI generation",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    price: "99",
    features: [
      "Unlimited everything",
      "Dedicated support",
      "Custom integrations",
    ],
  },
]

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft
      const cardWidth = scrollRef.current.offsetWidth * 0.85
      const newIndex = Math.round(scrollLeft / cardWidth)
      setActiveIndex(Math.min(newIndex, plans.length - 1))
    }
  }

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth * 0.85
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: "smooth"
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/90 rounded-sm flex items-center justify-center">
              <div className="w-3 h-2 bg-[#0a0a0a]"></div>
            </div>
            <span className="text-lg font-semibold text-white">Sycord</span>
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
      <section className="relative pt-20 pb-8 overflow-hidden min-h-[60vh]">
        <div className="px-6 relative z-10">
          <h1 className="text-[2.5rem] leading-[1.1] font-bold mb-10 max-w-[280px]">
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

        {/* iPhone mockup - positioned at right edge */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[20%] w-[320px] h-[500px]">
          <Image
            src="/iphone-mockup.jpg"
            alt="iPhone showing Sycord app"
            fill
            className="object-contain object-right"
            priority
          />
        </div>
      </section>

      {/* Corporate Supporters Section */}
      <section className="py-4">
        <SupporterMarquee />
        
        <div className="flex justify-center mt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1c1c1e] text-sm text-[#8e8e93]">
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
            className={`h-2 rounded-full transition-all ${
              index === activeIndex 
                ? "w-8 bg-[#6b6b6b]" 
                : "w-2 bg-[#3a3a3c]"
            }`}
          />
        ))}
      </div>

      {/* Pricing Section - Horizontal Scrollable */}
      <section className="pb-8">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className="flex-shrink-0 w-[85vw] max-w-[400px] snap-center rounded-2xl bg-[#1c1c1e] border border-white/10 overflow-hidden"
            >
              <div className="p-5">
                {/* Plan header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#2c2c2e]">
                      <Tag className="h-5 w-5 text-[#6b6b6b]" />
                    </div>
                    <span className="text-xl font-semibold text-[#8e8e93]">{plan.name}</span>
                  </div>
                  
                  <div className="w-24 h-8 bg-[#2c2c2e] rounded-lg"></div>
                </div>

                {/* Features list */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-500" />
                      </div>
                      <span className="text-sm text-[#8e8e93]">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-[#6b6b6b]">/month</span>
                </div>

                <Button className="w-full bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white rounded-xl h-12">
                  Get started
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="px-4 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white/90 rounded-sm flex items-center justify-center">
                <div className="w-2.5 h-1.5 bg-[#0a0a0a]"></div>
              </div>
              <span className="text-sm text-[#6b6b6b]">2024 Sycord. Minden jog fenntartva.</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
