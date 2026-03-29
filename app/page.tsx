"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Zap, Sparkles, ArrowRight } from "lucide-react"

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("scroll-visible")
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function RevealSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useScrollReveal()
  return (
    <section ref={ref} id={id} className={`scroll-hidden ${className}`}>
      {children}
    </section>
  )
}

/** Tracks which card in a horizontally-scrolling container is centred. */
function useCarouselIndex(count: number) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      const viewportCenter = el.scrollLeft + el.clientWidth / 2
      const cards = el.querySelectorAll("[data-carousel-card]")
      let closestIdx = 0
      let closestDist = Infinity
      cards.forEach((card, i) => {
        const cardEl = card as HTMLElement
        const cardCenter = cardEl.offsetLeft + cardEl.offsetWidth / 2
        const dist = Math.abs(viewportCenter - cardCenter)
        if (dist < closestDist) {
          closestDist = dist
          closestIdx = i
        }
      })
      setActiveIndex(closestIdx)
    }

    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [count])

  return { scrollRef, activeIndex }
}

export default function LandingPage() {
  const featureImages = [
    {
      src: "https://github.com/user-attachments/assets/6f4659c9-0989-47c0-b282-731ae5961df7",
      alt: "Best AI model on the market — Gemini 3.1",
      label: "Best AI model on the market",
    },
    {
      src: "https://github.com/user-attachments/assets/95665e35-5f9c-4a6d-9255-8a5b9dfd5d01",
      alt: "Share it! better with friend",
      label: "Share it! better with friend",
    },
    {
      src: "https://github.com/user-attachments/assets/9c1a2ed9-1179-4e69-9c24-40058dc0e53d",
      alt: "building never been this easy",
      label: "building never been this easy",
    },
  ]
  const { scrollRef: featuresScrollRef, activeIndex: featuresActiveIndex } = useCarouselIndex(featureImages.length)

  return (
    <div className="min-h-screen bg-[#101010] flex flex-col items-center overflow-x-hidden overflow-y-visible font-sans">
      {/* Header — desktop only; mobile header lives inside the hero */}
      <header className="hidden md:flex w-full px-4 md:px-8 py-4 md:py-6 items-center justify-between z-20 sticky top-0 bg-[#101010]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-3">
          <Image src="/logo.png" alt="Sycord Logo" width={28} height={28} className="opacity-90" priority />
          <span className="text-base md:text-xl font-bold text-white tracking-tight">Sycord</span>
        </div>
        <Button 
          asChild 
          className="bg-white text-[#18191B] hover:bg-white/90 text-xs md:text-sm font-semibold px-4 md:px-6 h-8 md:h-9 rounded-full"
        >
          <Link href="/login">Kezdés</Link>
        </Button>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col">

        {/* ── Hero Section (Mobile + Desktop) ── */}
        <section className="relative w-full overflow-visible min-h-[75vh] md:min-h-[70vh] pb-32 md:pb-40">
          {/* Metallic corrugated background - optimized with Next.js Image for instant loading */}
          <Image
            src="https://github.com/user-attachments/assets/2f738fc4-174b-45f8-9831-25fcf4fd788f"
            alt=""
            fill
            priority
            className="absolute inset-0 object-cover z-0"
            sizes="100vw"
          />
          {/* Gradient overlay — darkens for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent z-0" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-start h-full px-6 md:px-8 pt-12 md:pt-20 pb-12 max-w-6xl mx-auto">
            {/* Brand - mobile only (desktop has header) */}
            <div className="flex md:hidden items-center gap-3 mb-7">
              <Image
                src="/logo.png"
                alt="Sycord"
                width={40}
                height={40}
                className="opacity-90"
                priority
              />
              <span className="text-white text-3xl font-bold tracking-tight">sycord</span>
            </div>

            {/* Desktop headline */}
            <h1 className="hidden md:block text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              <span className="text-white">Create </span>
              <span className="text-[#8A8E91]">your</span>
              <span className="text-[#8A8E91]"> website </span>
              <span className="text-white">under 5</span>
              <br />
              <span className="text-white">minute!</span>
            </h1>

            {/* Description */}
            <p className="text-white text-[17px] md:text-xl font-medium leading-relaxed mb-7 max-w-md">
              Describe your idea, Sycord&apos;s AI designs, codes and deploys your website instantly.
              No coding or design skills required.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                asChild
                className="self-start bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full px-8 h-12 text-sm font-medium border border-white/20"
              >
                <Link href="/login">Get started</Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="hidden md:flex border-white/20 text-white hover:bg-white/5 text-sm font-medium px-8 h-12 rounded-full"
              >
                <Link href="#pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Old Desktop Hero removed - now unified ── */}
        
        {/* Features Section - overlaps the hero with frosted glass effect */}
        <div className="relative z-10 -mt-40 md:-mt-32">
          <div className="bg-[#101010]/85 backdrop-blur-xl border border-white/10 rounded-t-[48px] md:rounded-t-[72px] pt-14 pb-10 overflow-hidden">
            <RevealSection className="w-full py-8 md:py-16 md:px-8 relative">
              <div className="max-w-6xl md:mx-auto">
                {/* Heading — desktop only; on mobile the cards speak for themselves */}
                <h2 className="hidden md:block text-xl md:text-3xl font-bold text-white text-center mb-4 md:mb-2">Why Choose Sycord?</h2>
                <p className="hidden md:block text-sm md:text-base text-[#8A8E91] text-center mb-10 md:mb-12 max-w-xl mx-auto">
                  Everything you need to build and launch your website in minutes
                </p>

                {/* Scroll container: snap-to-center on mobile, plain grid on desktop */}
                <div
                  ref={featuresScrollRef}
                  className="overflow-x-scroll md:overflow-x-visible scrollbar-hide pb-4 md:pb-0 px-[12.5vw] md:px-0"
                  style={{ scrollSnapType: "x mandatory", scrollBehavior: "smooth" }}
                >
                  <div className="flex gap-4 md:gap-6 w-max md:w-full md:grid md:grid-cols-3">
                    {featureImages.map((img, i) => (
                    <div
                      key={i}
                      data-carousel-card
                      className="relative w-[75vw] md:w-auto h-64 sm:h-72 md:h-96 flex-shrink-0 md:flex-shrink rounded-3xl overflow-hidden"
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {/* Badge label — mobile only */}
                      <div className="md:hidden absolute top-3 left-3 z-10 bg-black/55 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
                        {img.label}
                      </div>
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 640px) 75vw, (max-width: 768px) 80vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel indicator dots — mobile only, state-driven */}
              <div className="flex md:hidden items-center justify-center gap-2 mt-5">
                {featureImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === featuresActiveIndex
                        ? "w-8 bg-white/65"
                        : "w-2.5 bg-white/25"
                    }`}
                  />
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
        </div>

        {/* Meet Syra Video Section */}
        <RevealSection className="w-full py-14 md:py-20 border-t border-b border-white/5 bg-[#101010] overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <p className="text-center text-[#8A8E91] text-xs md:text-sm font-medium mb-4">Introducing</p>
            <h2 className="text-center text-white text-lg md:text-2xl font-bold mb-10 md:mb-14">Meet Syra, Your AI Builder</h2>
            <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-[#181818]/90 backdrop-blur-xl border border-white/10">
              <video
                className="w-full h-auto rounded-2xl"
                controls
                preload="metadata"
                poster="/video-poster.jpg"
              >
                <source src="/Meet syra your ai builder.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </RevealSection>

        {/* Pricing Section */}
        <RevealSection id="pricing" className="w-full px-4 md:px-8 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-3">Simple, Transparent Pricing</h2>
            <p className="text-sm md:text-base text-[#8A8E91] text-center mb-10 md:mb-12 max-w-xl mx-auto">
              Choose the perfect plan for your needs. Always flexible to scale as you grow.
            </p>
            
            {/* Desktop Layout - 3 Column Grid */}
            <div className="hidden md:grid grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Sycord Plan */}
              <div className="frosted-card rounded-2xl p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                </div>
                <h3 className="text-2xl font-bold text-[#6B6E71] mb-2">Sycord</h3>
                <p className="text-[#8A8E91] text-sm mb-6">Perfect for getting started</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">$0</span>
                  <span className="text-[#8A8E91] text-sm">/month</span>
                </div>
                <Button 
                  asChild
                  className="w-full bg-[#3A3B3D] hover:bg-[#4A4B4D] text-white mb-6 h-10 rounded-full"
                >
                  <Link href="/login">Get Started</Link>
                </Button>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#6B6E71] flex-shrink-0" />
                    <span className="text-white/80 text-sm">1 Website</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#6B6E71] flex-shrink-0" />
                    <span className="text-white/80 text-sm">1 GB Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#6B6E71] flex-shrink-0" />
                    <span className="text-white/80 text-sm">Basic Templates</span>
                  </li>
                </ul>
              </div>

              {/* Sycord+ Plan - Featured */}
              <div className="frosted-glass-dark rounded-2xl p-8 border-2 border-yellow-500/40 flex flex-col relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1">
                  <span className="text-yellow-500 text-xs font-semibold">Most Popular</span>
                </div>
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sycord+</h3>
                <p className="text-[#8A8E91] text-sm mb-6">For growing businesses</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">$9</span>
                  <span className="text-[#8A8E91] text-sm">/month</span>
                </div>
                <Button 
                  asChild
                  className="w-full bg-white hover:bg-white/90 text-[#18191B] font-semibold mb-6 h-10 rounded-full"
                >
                  <Link href="/login">Upgrade Now</Link>
                </Button>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Unlimited Sites</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">50 GB Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">AI Builder</span>
                  </li>
                </ul>
              </div>

              {/* Sycord Enterprise Plan */}
              <div className="frosted-card rounded-2xl p-8 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sycord Enterprise</h3>
                <p className="text-[#8A8E91] text-sm mb-6">For enterprises</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">$29</span>
                  <span className="text-[#8A8E91] text-sm">/month</span>
                </div>
                <Button 
                  asChild
                  variant="outline"
                  className="w-full border-white/20 hover:bg-white/5 text-white mb-6 h-10 rounded-full"
                >
                  <Link href="/contact">Contact Sales</Link>
                </Button>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Everything in Sycord+</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">500 GB Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Priority Support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Layout - Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-4 w-max px-0">
                {/* Sycord Plan */}
                <div className="w-72 frosted-card rounded-2xl p-5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  </div>
                  <h3 className="text-xl font-bold text-[#6B6E71] mb-1">Sycord</h3>
                  <p className="text-[#8A8E91] text-xs mb-4">Getting started</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">$0</span>
                    <span className="text-[#8A8E91] text-xs">/mo</span>
                  </div>
                  <Button 
                    asChild
                    className="w-full bg-[#3A3B3D] hover:bg-[#4A4B4D] text-white text-xs h-9 rounded-full mb-4"
                  >
                    <Link href="/login">Get Started</Link>
                  </Button>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#6B6E71] flex-shrink-0" />
                      <span className="text-white/80 text-xs">1 Website</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#6B6E71] flex-shrink-0" />
                      <span className="text-white/80 text-xs">1 GB Storage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#6B6E71] flex-shrink-0" />
                      <span className="text-white/80 text-xs">Basic Templates</span>
                    </li>
                  </ul>
                </div>

                {/* Sycord+ Plan */}
                <div className="w-72 frosted-glass-dark rounded-2xl p-5 flex-shrink-0 border-2 border-yellow-500/40">
                  <div className="flex items-center gap-1 mb-3">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-[9px] font-semibold text-yellow-500">Popular</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Sycord+</h3>
                  <p className="text-[#8A8E91] text-xs mb-4">Growing business</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">$9</span>
                    <span className="text-[#8A8E91] text-xs">/mo</span>
                  </div>
                  <Button 
                    asChild
                    className="w-full bg-white hover:bg-white/90 text-[#18191B] text-xs h-9 rounded-full font-semibold mb-4"
                  >
                    <Link href="/login">Upgrade</Link>
                  </Button>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Unlimited Sites</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">50 GB Storage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">AI Builder</span>
                    </li>
                  </ul>
                </div>

                {/* Sycord Enterprise Plan */}
                <div className="w-72 frosted-card rounded-2xl p-5 flex-shrink-0">
                  <div className="flex items-center gap-1 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Sycord Enterprise</h3>
                  <p className="text-[#8A8E91] text-xs mb-4">Enterprises</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">$29</span>
                    <span className="text-[#8A8E91] text-xs">/mo</span>
                  </div>
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/5 text-white text-xs h-9 rounded-full mb-4"
                  >
                    <Link href="/contact">Contact</Link>
                  </Button>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Everything in Sycord+</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">500 GB Storage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Priority Support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* CTA Section */}
        <RevealSection className="w-full px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-2xl mx-auto frosted-glass rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Decorative background illustration */}
            <svg className="absolute -right-10 -top-10 w-40 h-40 opacity-[0.06]" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="80" r="78" stroke="white" strokeWidth="2"/>
              <circle cx="80" cy="80" r="55" stroke="white" strokeWidth="1.5"/>
              <circle cx="80" cy="80" r="32" stroke="white" strokeWidth="1"/>
              <line x1="80" y1="0" x2="80" y2="160" stroke="white" strokeWidth="1"/>
              <line x1="0" y1="80" x2="160" y2="80" stroke="white" strokeWidth="1"/>
            </svg>
            <svg className="absolute -left-8 -bottom-8 w-32 h-32 opacity-[0.05]" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="108" height="108" rx="20" stroke="white" strokeWidth="2"/>
              <rect x="30" y="30" width="68" height="68" rx="14" stroke="white" strokeWidth="1.5"/>
              <rect x="48" y="48" width="32" height="32" rx="8" stroke="white" strokeWidth="1"/>
            </svg>
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to build your website?</h2>
              <p className="text-[#8A8E91] mb-6 md:mb-8 text-sm md:text-base">
                Join thousands of creators and businesses already using Sycord to build amazing websites.
              </p>
              <Button 
                asChild
                className="bg-white text-[#18191B] hover:bg-white/90 font-semibold px-8 h-11 md:h-12 rounded-full"
              >
                <Link href="/login">Start Building Now</Link>
              </Button>
            </div>
          </div>
        </RevealSection>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 frosted-glass-light mt-8 md:mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-16 mb-10">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="Sycord Logo" width={24} height={24} className="opacity-90" />
                <span className="text-white font-bold text-base tracking-tight">Sycord</span>
              </div>
              <p className="text-[#8A8E91] text-xs max-w-[200px]">Build stunning websites in minutes. No coding required.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-14">
              <div>
                <h3 className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">Product</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs transition-colors">Features</Link></li>
                  <li><Link href="#pricing" className="text-[#8A8E91] hover:text-white text-xs transition-colors">Pricing</Link></li>
                  <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs transition-colors">Security</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">Company</h3>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-[#8A8E91] hover:text-white text-xs transition-colors">About</Link></li>
                  <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs transition-colors">Blog</Link></li>
                  <li><Link href="/contact" className="text-[#8A8E91] hover:text-white text-xs transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-3">Legal</h3>
                <ul className="space-y-2">
                  <li><Link href="/pap" className="text-[#8A8E91] hover:text-white text-xs transition-colors">Privacy</Link></li>
                  <li><Link href="/tos" className="text-[#8A8E91] hover:text-white text-xs transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[#8A8E91] text-[11px]">© {new Date().getFullYear()} Sycord. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-[#8A8E91] hover:text-white text-[11px] transition-colors">Twitter</Link>
              <Link href="#" className="text-[#8A8E91] hover:text-white text-[11px] transition-colors">GitHub</Link>
              <Link href="#" className="text-[#8A8E91] hover:text-white text-[11px] transition-colors">Discord</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
