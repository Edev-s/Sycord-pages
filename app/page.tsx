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

/** Hook to track if an element is in viewport */
function useInView() {
  const ref = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, isInView }
}

export default function LandingPage() {
  const featureImages = [
    {
      src: "https://github.com/user-attachments/assets/6f4659c9-0989-47c0-b282-731ae5961df7",
      alt: "Best AI model on the market — Gemini 3.1",
    },
    {
      src: "https://github.com/user-attachments/assets/95665e35-5f9c-4a6d-9255-8a5b9dfd5d01",
      alt: "Share it! better with friend",
    },
    {
      src: "https://github.com/user-attachments/assets/9c1a2ed9-1179-4e69-9c24-40058dc0e53d",
      alt: "building never been this easy",
    },
  ]
  const { scrollRef: featuresScrollRef, activeIndex: featuresActiveIndex } = useCarouselIndex(featureImages.length)
  const { ref: videoSectionRef, isInView: isVideoInView } = useInView()

  return (
    <div className="min-h-screen bg-[#101010] flex flex-col items-center overflow-x-hidden overflow-y-visible font-sans">
      {/* Header — visible on all screen sizes */}
      <header className="flex w-full px-4 md:px-8 py-4 md:py-6 items-center justify-between z-20 sticky top-0 bg-[#101010]/95 backdrop-blur-sm border-b border-white/5">
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

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              <span className="text-white">Create </span>
              <span className="text-[#8A8E91]">your</span>
              <span className="text-[#8A8E91]"> website </span>
              <span className="text-white">under 5</span>
              <br />
              <span className="text-white">minute!</span>
            </h1>

            {/* Description */}
            <p className="text-white text-[17px] md:text-xl font-medium leading-relaxed mb-5 max-w-md">
              Describe your idea, Sycord&apos;s AI designs, codes and deploys your website instantly.
              No coding or design skills required.
            </p>

            {/* Sponsor logos marquee */}
            <div className="relative overflow-hidden mb-6 max-w-sm">
              <div className="flex animate-marquee whitespace-nowrap">
                {[...Array(2)].map((_, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-8 px-4">
                    {/* GitHub */}
                    <svg className="h-5 w-auto opacity-25 flex-shrink-0" viewBox="0 0 98 96" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
                    </svg>
                    {/* Google */}
                    <svg className="h-5 w-auto opacity-25 flex-shrink-0" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {/* Cloudflare */}
                    <svg className="h-5 w-auto opacity-25 flex-shrink-0" viewBox="0 0 200 80" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M147.8 57.3l3.2-11.1c.9-3.2.5-6.1-1.2-8.2-1.6-1.9-4-3-6.7-3.1l-87.2-.9c-.4 0-.7-.2-.9-.5-.2-.3-.2-.7-.1-1 .2-.5.7-.9 1.2-.9l87.6-.9c6.8-.3 14.2-5.8 16.7-12.5l3.2-8.5c.2-.4.2-.8.1-1.2C158.8 3.6 150.3 0 140.8 0c-14.3 0-26.5 9-31.2 21.7-4.3-3.2-9.8-4.8-15.6-4.1-10 1.2-18 9.3-19 19.3-.3 2.7-.1 5.3.6 7.7C60.3 45.2 48 57 48 57.3h99.8z"/>
                      <path d="M161.6 33.8c-.6 0-1.1 0-1.7.1-.4.1-.8.3-.9.8l-2.3 8c-.9 3.2-.5 6.1 1.2 8.2 1.6 1.9 4 3 6.7 3.1l18.5.9c.4 0 .7.2.9.5.2.3.2.7.1 1-.2.5-.7.9-1.2.9l-18.9.9c-6.8.3-14.2 5.8-16.7 12.5l-.9 2.3c-.2.5.1 1 .7 1 0 0 45.9 0 46.1 0 .4 0 .8-.3.9-.7 1.1-3.5 1.7-7.3 1.7-11.2-.1-15.4-12.6-28-28.1-28.3z"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>

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
          <div 
            className={`rounded-t-[48px] md:rounded-t-[72px] pt-14 pb-10 overflow-hidden transition-all duration-700 ${
              isVideoInView 
                ? 'bg-[#101010] border-transparent' 
                : 'bg-[#101010]/85 backdrop-blur-xl border border-white/10'
            }`}
          >
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
                      className="relative w-[75vw] md:w-auto aspect-square flex-shrink-0 md:flex-shrink rounded-3xl overflow-hidden"
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {/* Badge label — removed to only show image */}
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover object-center"
                        loading="lazy"
                        sizes="(max-width: 768px) 75vw, 33vw"
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
        <section ref={videoSectionRef} className="w-full py-14 md:py-20 border-t border-b border-white/5 bg-[#101010] overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-center text-[#8A8E91] text-xs md:text-sm font-medium mb-4">Introducing</p>
            <h2 className="text-center text-white text-lg md:text-2xl font-bold mb-10 md:mb-14">Meet Syra, Your AI Builder</h2>
            <div className="flex flex-col md:flex-row md:items-center md:gap-10">
              <div className="relative w-full md:w-3/5 flex-shrink-0 rounded-2xl overflow-hidden bg-[#181818]/90 backdrop-blur-xl border border-white/10">
                <video
                  className="w-full h-auto rounded-2xl"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/Meet%20syra%20your%20ai%20builder.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="mt-6 md:mt-0 md:w-2/5">
                <p className="text-white text-base md:text-lg font-medium leading-relaxed mb-3">
                  Start building for free
                </p>
                <p className="text-[#8A8E91] text-sm md:text-base leading-relaxed">
                  You receive 200 credits on your first login — that&apos;s enough to start your business and build your first project.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Always Online Services Section */}
        <RevealSection className="w-full py-16 md:py-24 bg-[#101010] overflow-hidden">
          <div className="relative max-w-6xl mx-auto px-6 md:px-8 min-h-[420px] md:min-h-[480px]">
            {/* Heading */}
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-2 text-left max-w-md">
              we provide{" "}
              <span className="text-[#22c55e]">always online</span>
              <span className="inline-flex items-center ml-2 align-middle">
                <span className="relative flex h-4 w-4 md:h-5 md:w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-50"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 bg-[#22c55e]"></span>
                </span>
              </span>
              <br />
              <span className="text-white">services</span>
            </h2>

            {/* Floating domain pills */}
            <div className="absolute top-28 md:top-32 right-0 md:right-4 flex flex-col gap-5 items-end pr-0">
              {[
                { anim: "animate-float-1", offset: "translate-x-[30%] md:translate-x-[20%]" },
                { anim: "animate-float-2", offset: "-translate-x-4 md:translate-x-0" },
                { anim: "animate-float-3", offset: "translate-x-[15%] md:translate-x-[10%]" },
              ].map((pill, i) => (
                <div key={i} className={`${pill.anim} ${pill.offset}`}>
                  <div className="bg-[#2a2a2c] rounded-full px-5 py-2.5 text-sm md:text-base text-[#b0b0b0] font-medium whitespace-nowrap shadow-lg shadow-black/20">
                    <span className="text-white font-semibold">myplant</span>.sycord.site
                  </div>
                </div>
              ))}
            </div>

            {/* Green uptime bars — static, no animation */}
            <div className="absolute bottom-4 md:bottom-8 left-6 md:left-8 flex items-end gap-[3px]">
              {[28, 40, 20, 44, 16, 36, 24, 48, 18, 32, 42, 14, 38, 26, 46].map((h, i) => (
                <div
                  key={i}
                  className="w-[6px] md:w-[8px] rounded-full bg-[#22c55e]"
                  style={{ height: `${h}px` }}
                />
              ))}
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
              <div className="frosted-card rounded-2xl p-8 flex flex-col relative overflow-hidden">
                {/* Decorative illustration */}
                <svg className="absolute -right-6 -top-6 w-28 h-28 opacity-[0.06]" viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="56" cy="56" r="50" stroke="white" strokeWidth="2"/>
                  <circle cx="56" cy="56" r="30" stroke="white" strokeWidth="1.5"/>
                  <path d="M56 6v100M6 56h100" stroke="white" strokeWidth="1"/>
                </svg>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                </div>
                <h3 className="text-2xl font-bold text-[#6B6E71] mb-2">Sycord</h3>
                <p className="text-[#8A8E91] text-sm mb-6">Basic app</p>
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
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">1 Project</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Syra Lite</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#6B6E71] flex-shrink-0" />
                    <span className="text-white/50 text-sm">Limited Integration</span>
                  </li>
                </ul>
              </div>

              {/* Sycord+ Plan - Featured */}
              <div className="frosted-glass-dark rounded-2xl p-8 border-2 border-yellow-500/40 flex flex-col relative overflow-hidden transform scale-105 z-10 shadow-[0_0_40px_-10px_rgba(234,179,8,0.15)]">
                {/* Decorative illustration - lightning pattern */}
                <svg className="absolute -right-4 -top-4 w-32 h-32 opacity-[0.08]" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M70 8L40 56h28L54 120l40-64H66L84 8H70z" stroke="url(#yellowGrad)" strokeWidth="2" fill="none"/>
                  <defs>
                    <linearGradient id="yellowGrad" x1="54" y1="8" x2="54" y2="120" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EAB308"/>
                      <stop offset="1" stopColor="#CA8A04"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1">
                  <span className="text-yellow-500 text-xs font-semibold">Most Popular</span>
                </div>
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sycord+</h3>
                <p className="text-[#8A8E91] text-sm mb-6">Complex apps</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">$2</span>
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
                    <span className="text-white text-sm font-medium">3 Projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Syra Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Integration</span>
                  </li>
                </ul>
              </div>

              {/* Sycord Enterprise Plan */}
              <div className="frosted-card rounded-2xl p-8 flex flex-col relative overflow-hidden">
                <svg className="absolute -right-6 -top-6 w-32 h-32 opacity-[0.08]" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M64 8l4 24 24-4-24 4 4 24-4-24-24 4 24-4-4-24z" stroke="#A855F7" strokeWidth="1.5"/>
                </svg>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sycord Enterprise</h3>
                <p className="text-[#8A8E91] text-sm mb-6">Security system</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">$10</span>
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
                    <span className="text-white/80 text-sm">5 Projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Syra Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Integration</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mobile Layout - Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-4 w-max px-0">
                {/* Sycord Plan */}
                <div className="w-72 frosted-card rounded-2xl p-5 flex-shrink-0 relative overflow-hidden">
                  {/* Decorative illustration */}
                  <svg className="absolute -right-4 -top-4 w-20 h-20 opacity-[0.06]" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="36" stroke="white" strokeWidth="1.5"/>
                    <circle cx="40" cy="40" r="22" stroke="white" strokeWidth="1"/>
                  </svg>
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  </div>
                  <h3 className="text-xl font-bold text-[#6B6E71] mb-1">Sycord</h3>
                  <p className="text-[#8A8E91] text-xs mb-4">Basic app</p>
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
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">1 Project</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Syra Lite</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-[#6B6E71] flex-shrink-0" />
                      <span className="text-white/50 text-xs">Limited Integration</span>
                    </li>
                  </ul>
                </div>

                {/* Sycord+ Plan */}
                <div className="w-72 frosted-glass-dark rounded-2xl p-5 flex-shrink-0 relative overflow-hidden border-2 border-yellow-500/40 shadow-[0_0_20px_-5px_rgba(234,179,8,0.15)]">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                  <div className="absolute -right-4 -top-4 w-16 h-16 opacity-10">
                    <Zap className="w-full h-full text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Sycord+</h3>
                  <p className="text-[#8A8E91] text-xs mb-4">Complex apps</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">$2</span>
                    <span className="text-[#8A8E91] text-xs">/mo</span>
                  </div>
                  <Button 
                    asChild
                    className="w-full bg-white hover:bg-white/90 text-[#18191B] font-semibold text-xs h-9 rounded-full mb-4"
                  >
                    <Link href="/login">Upgrade Now</Link>
                  </Button>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white text-xs font-medium">3 Projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Syra Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Integration</span>
                    </li>
                  </ul>
                </div>

                {/* Sycord Enterprise Plan */}
                <div className="w-72 frosted-card rounded-2xl p-5 flex-shrink-0 relative overflow-hidden">
                  <svg className="absolute -right-4 -top-4 w-20 h-20 opacity-[0.06]" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 4L70 21v36L40 74L10 57V21l30-17z" stroke="white" strokeWidth="1.5"/>
                  </svg>
                  <div className="flex items-center gap-1 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Sycord Enterprise</h3>
                  <p className="text-[#8A8E91] text-xs mb-4">Security system</p>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">$10</span>
                    <span className="text-[#8A8E91] text-xs">/mo</span>
                  </div>
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/5 text-white text-xs h-9 rounded-full mb-4"
                  >
                    <Link href="/contact">Contact Sales</Link>
                  </Button>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">5 Projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Syra Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Integration</span>
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
