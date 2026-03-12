"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Globe, Shield, Megaphone, Info, Tag } from "lucide-react"
import { Countdown } from "@/components/countdown"
import { StatusBadge } from "@/components/status-badge"
import { useRef, useState, useEffect } from "react"

// SVG Icons for supporters
const GitHubIcon = () => (
  <svg viewBox="0 0 98 96" className="h-6 w-6 md:h-8 md:w-8" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
  </svg>
)

const CloudflareIcon = () => (
  <svg viewBox="0 0 100 40" className="h-6 w-6 md:h-8 md:w-8" fill="currentColor">
    <path d="M75.8 25.6l.8-2.7c.5-1.8.3-3.5-.6-4.7-.8-1.1-2.1-1.8-3.7-2l-31.5-.6c-.1 0-.3-.1-.3-.2-.1-.1 0-.3.1-.4.1-.1.3-.2.4-.2l31.8-.6c3.1-.2 6.4-2.7 7.5-5.7l1.4-3.8c.1-.2.1-.3.1-.5C79.2 2.1 76.3 0 72.8 0c-3.6 0-6.7 2.3-7.8 5.5 0 0-1.5-.6-3.1-.2-1.5.4-2.7 1.5-3.1 3-.1.2-.1.5-.1.7-4.6.4-8.2 4.2-8.4 8.9 0 .2 0 .4 0 .5l.4 7.2h25.1z" />
    <path d="M83.6 9.7c-.2 0-.4 0-.6.1l-.3.7c-.4 1.4-.2 2.7.5 3.7.6.9 1.6 1.4 2.8 1.5l6.5.4c.1 0 .2.1.2.1.1.1 0 .2-.1.3-.1.1-.2.1-.3.2l-6.7.4c-2.4.2-5 2.1-5.9 4.5l-.4 1c0 .1 0 .2.1.3.1.1.2.1.3.1h22.5c.2 0 .4-.1.4-.3.1-.6.2-1.2.2-1.9C102.7 14.1 93.8 9.7 83.6 9.7z" opacity=".7" />
  </svg>
)

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 md:h-8 md:w-8" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

// Pricing plans data
const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "$",
    features: ["1 website", "1 GB storage", "Basic support"],
    color: "bg-emerald-500",
    isFree: true
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    currency: "$",
    features: ["5 websites", "50 GB storage", "Priority support", "Custom domain"],
    color: "bg-blue-500",
    isPopular: true,
    isFree: false
  },
  {
    id: "business",
    name: "Business",
    price: 29,
    currency: "$",
    features: ["Unlimited websites", "500 GB storage", "24/7 support", "Custom domains", "API access"],
    color: "bg-purple-500",
    isFree: false
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    currency: "$",
    features: ["Everything in Business", "Dedicated support", "SLA guarantee", "Custom integrations"],
    color: "bg-orange-500",
    isFree: false
  }
]

export default function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.scrollWidth / pricingPlans.length
      scrollContainerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft
        const cardWidth = scrollContainerRef.current.scrollWidth / pricingPlans.length
        const newIndex = Math.round(scrollLeft / cardWidth)
        setActiveIndex(newIndex)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span className="text-xl font-semibold text-foreground">Sycord</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funkciók
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Árak
            </Link>
            <Link href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dokumentáció
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground text-sm md:text-base">
                Bejelentkezés
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-white/90 text-sm md:text-base">Kezdés</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Redesigned to match mockup */}
      <section className="relative pt-16 pb-8 md:pt-24 md:pb-16 overflow-hidden bg-background">
        <div className="container mx-auto px-4 md:px-6">
          {/* Hero Content */}
          <div className="max-w-3xl mx-auto md:mx-0 text-left mb-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Create <span className="text-muted-foreground">your website</span> in under 5 minutes!
            </h1>
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl px-8 py-6 text-lg font-medium"
              >
                Get started
              </Button>
            </Link>
          </div>

          {/* Corporate Supporters Section */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-12 mb-6">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors flex items-center gap-2">
                <GitHubIcon />
                <span className="text-sm md:text-base font-semibold">GitHub</span>
              </a>
              <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                <CloudflareIcon />
              </a>
              <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                <GoogleIcon />
              </a>
            </div>
            <div className="flex justify-center md:justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/60 text-sm text-muted-foreground">
                <span>Corporate Supporters:</span>
                <Info className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Plan Indicator Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {pricingPlans.map((plan, index) => (
              <button
                key={plan.id}
                onClick={() => scrollToIndex(index)}
                className={`w-3 h-3 md:w-2.5 md:h-2.5 rounded-full transition-all ${
                  index === activeIndex 
                    ? 'bg-white w-6 md:w-5' 
                    : 'bg-zinc-600 hover:bg-zinc-500'
                }`}
                aria-label={`Go to ${plan.name} plan`}
              />
            ))}
          </div>

          {/* Scrollable Pricing Plans */}
          <div 
            id="pricing"
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-2 lg:grid-cols-4 custom-scrollbar"
          >
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="flex-shrink-0 w-[280px] md:w-auto snap-center bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg ${plan.color} flex items-center justify-center`}>
                    <Tag className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">{plan.currency}{plan.price}</span>
                  {!plan.isFree && <span className="text-muted-foreground text-sm">/mo</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button 
                    variant={plan.isPopular ? "default" : "outline"}
                    className={`w-full rounded-xl ${plan.isPopular ? 'bg-white text-black hover:bg-white/90' : 'border-zinc-700 hover:bg-zinc-800'}`}
                  >
                    {plan.isFree ? "Start Free" : "Get Started"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-foreground mb-1">100M+</div>
              <div className="text-sm text-muted-foreground mb-2">API kérések naponta</div>
              <div className="text-xs text-muted-foreground/60">Powered by Next.js</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-foreground mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground mb-2">Rendelkezésre állás</div>
              <div className="text-xs text-muted-foreground/60">Cloudflare</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-foreground mb-1">10K</div>
              <div className="text-sm text-muted-foreground mb-2">Aktív felhasználók</div>
              <div className="text-xs text-muted-foreground/60">Growing Daily</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-foreground mb-1">24/7</div>
              <div className="text-sm text-muted-foreground mb-2">Támogatás</div>
              <div className="text-xs text-muted-foreground/60">GitHub</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Erőteljes Funkciók Modern Alkalmazásokhoz
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A Sycord mindent biztosít, amire szüksége van az alkalmazás egyszerű létrehozásához és skálázásához.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-8 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Villámgyors Teljesítmény</h3>
              <p className="text-muted-foreground leading-relaxed">
                Platformunk a sebességre van optimalizálva, biztosítva a zökkenőmentes felhasználói élményt.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-8 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4 text-white">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Globális Skálázhatóság</h3>
              <p className="text-muted-foreground leading-relaxed">
                Telepítse alkalmazását világszerte a robusztus infrastruktúránkkal.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-8 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Csúcskategóriás Biztonság</h3>
              <p className="text-muted-foreground leading-relaxed">
                A biztonságot helyezzük előtérbe az adatai és a felhasználói védelme érdekében.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center border border-border rounded-2xl p-12 bg-card">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Készen áll a kezdésre?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Hozzon létre egy fiókot és kezdje el ma az alkalmazás építését.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 text-base px-8">
              Fiók létrehozása
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Termék</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Funkciók
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Árak
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Sablonok
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Cég</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Rólunk
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                    Kapcsolat
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Karrier
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Források</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Dokumentáció
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Támogatás
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Állapot
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Jogi</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Adatvédelem
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Feltételek
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Biztonság
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center mb-6">
            <StatusBadge />
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={24} height={24} />
              <span className="text-sm text-muted-foreground">© 2024 Sycord. Minden jog fenntartva.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Twitter
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                GitHub
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
