"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Info, Tag } from "lucide-react"
import { useRef, useState, useEffect } from "react"

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
      "Basic analytics",
    ],
    buttonText: "Get started",
    highlighted: false,
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
      "Remove Sycord branding",
    ],
    buttonText: "Start free trial",
    highlighted: true,
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
      "White-label option",
      "API access",
    ],
    buttonText: "Contact sales",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "99",
    description: "For large organizations",
    features: [
      "Everything in Business",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option",
    ],
    buttonText: "Contact sales",
    highlighted: false,
  },
]

// Supporter logos component - infinite scroll from right to left
function SupporterMarquee() {
  return (
    <div className="relative overflow-hidden py-6">
      <div className="flex animate-marquee whitespace-nowrap">
        {/* Triple the items for seamless loop */}
        {[...Array(3)].map((_, setIndex) => (
          <div key={setIndex} className="flex items-center gap-16 mx-8">
            {/* GitHub with icon and text */}
            <div className="flex items-center gap-2 min-w-max">
              <svg className="h-5 w-5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-white/70 font-semibold text-lg">GitHub</span>
            </div>
            
            {/* Cloudflare - simple cloud icon */}
            <div className="flex items-center min-w-max">
              <svg className="h-8 w-12 text-white/70" viewBox="0 0 48 32" fill="currentColor">
                <path d="M40 16c0-0.5 0-1-0.1-1.5C39.1 7.9 33.4 3 26.5 3c-5.1 0-9.6 2.9-11.9 7.2C13.7 9.4 12.4 9 11 9c-4.4 0-8 3.6-8 8 0 0.3 0 0.6 0 0.9C1.2 19 0 21.3 0 24c0 4.4 3.6 8 8 8h30c5.5 0 10-4.5 10-10 0-4.1-2.5-7.6-6-9.1C41.7 13.3 41 14.6 40 16z"/>
              </svg>
            </div>
            
            {/* Google text logo */}
            <div className="flex items-center min-w-max">
              <span className="text-white/70 font-normal text-2xl tracking-tight" style={{ fontFamily: 'Product Sans, Arial, sans-serif' }}>Google</span>
            </div>
            
            {/* Vercel triangle */}
            <div className="flex items-center min-w-max">
              <svg className="h-5 w-5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L24 22H0L12 1Z"/>
              </svg>
            </div>
            
            {/* AWS */}
            <div className="flex items-center min-w-max">
              <span className="text-white/70 font-bold text-lg tracking-wider">AWS</span>
            </div>
            
            {/* Microsoft */}
            <div className="flex items-center gap-1.5 min-w-max">
              <svg className="h-4 w-4 text-white/70" viewBox="0 0 23 23" fill="currentColor">
                <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/>
              </svg>
              <span className="text-white/70 font-normal text-lg">Microsoft</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Handle scroll to update active dot
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft
      const cardWidth = scrollContainer.offsetWidth * 0.85
      const newIndex = Math.round(scrollLeft / cardWidth)
      setActiveIndex(Math.min(newIndex, plans.length - 1))
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to specific plan
  const scrollToIndex = (index: number) => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return
    const cardWidth = scrollContainer.offsetWidth * 0.85
    scrollContainer.scrollTo({ left: cardWidth * index, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={24} height={24} />
            <span className="text-lg font-semibold text-white">Sycord</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/5 text-sm">
                Bejelentkezes
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-white/90 text-sm rounded-full px-5 font-medium">
                Kezdes
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-8 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="relative">
            {/* Text content */}
            <div className="max-w-md relative z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8">
                <span className="text-white">Create </span>
                <span className="text-white/50">your website </span>
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

            {/* iPhone mockup - positioned to the right, partially visible */}
            <div className="absolute top-0 right-0 md:right-[-5%] lg:right-0 w-[55%] md:w-[45%] lg:w-[40%] max-w-[400px] translate-x-[15%] md:translate-x-[10%]">
              <Image
                src="/iphone-mockup.png"
                alt="iPhone showing Sycord"
                width={400}
                height={600}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Supporters Section */}
      <section className="py-6 md:py-10">
        <div className="w-full">
          <SupporterMarquee />
          
          <div className="flex justify-center mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2a2c] text-sm text-white/60">
              <span>Corporate Supporters:</span>
              <Info className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Page indicator dots */}
      <div className="flex justify-center gap-2 py-6">
        {plans.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? "w-8 bg-white/40" 
                : "w-2 bg-white/20"
            }`}
            aria-label={`Go to plan ${index + 1}`}
          />
        ))}
      </div>

      {/* Pricing Section - Horizontal Scrollable */}
      <section className="pb-12">
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`flex-shrink-0 w-[85vw] md:w-[400px] snap-center rounded-2xl border ${
                plan.highlighted 
                  ? "border-white/20 bg-[#1c1c1e]" 
                  : "border-white/10 bg-[#1c1c1e]"
              } overflow-hidden`}
            >
              {plan.highlighted && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 text-xs font-medium bg-white text-black rounded-full">
                    Popular
                  </span>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5">
                      <Tag className="h-5 w-5 text-white/60" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  </div>
                  
                  <Button
                    className={`rounded-full px-5 text-sm ${
                      plan.highlighted 
                        ? "bg-white text-black hover:bg-white/90" 
                        : "bg-[#3a3a3c] text-white hover:bg-[#4a4a4c]"
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>

                <p className="text-sm text-white/50 mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/50">/month</span>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-green-500" />
                      </div>
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={20} height={20} />
              <span className="text-sm text-white/50">2024 Sycord. Minden jog fenntartva.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-white/50 hover:text-white">
                Twitter
              </Link>
              <Link href="#" className="text-sm text-white/50 hover:text-white">
                GitHub
              </Link>
              <Link href="#" className="text-sm text-white/50 hover:text-white">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
