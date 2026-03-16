"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef } from "react"
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#18191B] flex flex-col items-center overflow-x-hidden font-sans">
      {/* Header */}
      <header className="w-full px-4 md:px-8 py-4 md:py-6 flex items-center justify-between z-20 sticky top-0 bg-[#18191B]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-3">
          <Image src="/logo.png" alt="Sycord Logo" width={28} height={28} className="opacity-90" />
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
        
        {/* Hero Section */}
        <RevealSection className="w-full px-4 md:px-8 pt-8 md:pt-16 pb-8 md:pb-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-8 md:gap-12">
            <div className="flex-1 max-w-2xl">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                <span className="text-white">Create </span>
                <span className="text-[#8A8E91]">your</span>
                <br className="md:hidden" />
                <span className="text-[#8A8E91]"> website </span>
                <span className="text-white">under 5</span>
                <br />
                <span className="text-white">minute!</span>
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 md:mt-8">
                <Button 
                  asChild
                  className="bg-white text-[#18191B] hover:bg-white/90 text-sm font-semibold px-6 md:px-8 h-11 md:h-12 rounded-full min-h-[44px] flex items-center gap-2"
                >
                  <Link href="/login">
                    Get started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 text-sm font-medium px-6 md:px-8 h-11 md:h-12 rounded-full min-h-[44px]"
                >
                  <Link href="#pricing">View pricing</Link>
                </Button>
              </div>
            </div>
            
            {/* Hero Illustration */}
            <div className="flex-1 hidden md:flex justify-center">
              <div className="relative w-full max-w-md">
                <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                  {/* Browser window frame */}
                  <rect x="40" y="30" width="320" height="240" rx="16" fill="#252527" stroke="#3A3B3D" strokeWidth="1.5"/>
                  {/* Title bar */}
                  <rect x="40" y="30" width="320" height="36" rx="16" fill="#2E2E30"/>
                  <rect x="40" y="50" width="320" height="16" fill="#2E2E30"/>
                  {/* Traffic lights */}
                  <circle cx="62" cy="48" r="5" fill="#FF5F57"/>
                  <circle cx="80" cy="48" r="5" fill="#FEBC2E"/>
                  <circle cx="98" cy="48" r="5" fill="#28C840"/>
                  {/* URL bar */}
                  <rect x="120" y="41" width="160" height="14" rx="7" fill="#3A3B3D"/>
                  {/* Content blocks - hero area */}
                  <rect x="60" y="82" width="140" height="12" rx="6" fill="#4A4B4D"/>
                  <rect x="60" y="102" width="100" height="8" rx="4" fill="#3A3B3D"/>
                  <rect x="60" y="118" width="120" height="8" rx="4" fill="#3A3B3D"/>
                  {/* CTA button illustration */}
                  <rect x="60" y="140" width="80" height="24" rx="12" fill="white"/>
                  {/* Image placeholder */}
                  <rect x="220" y="82" width="120" height="90" rx="12" fill="#3A3B3D"/>
                  <circle cx="280" cy="115" r="20" fill="#4A4B4D" opacity="0.5"/>
                  <polygon points="270,125 290,110 280,130" fill="#6B6E71" opacity="0.5"/>
                  {/* Card section */}
                  <rect x="60" y="185" width="88" height="70" rx="10" fill="#2E2E30" stroke="#3A3B3D" strokeWidth="1"/>
                  <rect x="156" y="185" width="88" height="70" rx="10" fill="#2E2E30" stroke="#3A3B3D" strokeWidth="1"/>
                  <rect x="252" y="185" width="88" height="70" rx="10" fill="#2E2E30" stroke="#3A3B3D" strokeWidth="1"/>
                  {/* Card icons */}
                  <circle cx="82" cy="205" r="8" fill="#EAB308" opacity="0.3"/>
                  <circle cx="178" cy="205" r="8" fill="#3B82F6" opacity="0.3"/>
                  <circle cx="274" cy="205" r="8" fill="#22C55E" opacity="0.3"/>
                  {/* Card text lines */}
                  <rect x="72" y="222" width="60" height="5" rx="2.5" fill="#4A4B4D"/>
                  <rect x="72" y="232" width="44" height="4" rx="2" fill="#3A3B3D"/>
                  <rect x="168" y="222" width="60" height="5" rx="2.5" fill="#4A4B4D"/>
                  <rect x="168" y="232" width="44" height="4" rx="2" fill="#3A3B3D"/>
                  <rect x="264" y="222" width="60" height="5" rx="2.5" fill="#4A4B4D"/>
                  <rect x="264" y="232" width="44" height="4" rx="2" fill="#3A3B3D"/>
                  {/* Cursor */}
                  <g transform="translate(170, 135)">
                    <path d="M0 0L0 20L5.5 15L11 22L14 20.5L8.5 13.5L15 12L0 0Z" fill="white" stroke="#18191B" strokeWidth="1"/>
                  </g>
                  {/* Decorative sparkle */}
                  <g transform="translate(340, 28)">
                    <path d="M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6Z" fill="#EAB308" opacity="0.6"/>
                  </g>
                  <g transform="translate(20, 70)">
                    <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5Z" fill="#A855F7" opacity="0.4"/>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Features Section */}
        <RevealSection className="w-full px-4 md:px-8 py-8 md:py-16 relative">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl md:text-3xl font-bold text-white text-center mb-4 md:mb-2">Why Choose Sycord?</h2>
            <p className="text-sm md:text-base text-[#8A8E91] text-center mb-10 md:mb-12 max-w-xl mx-auto">
              Everything you need to build and launch your website in minutes
            </p>
            <div className="overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-4 md:gap-6 w-max md:w-full md:grid md:grid-cols-3 px-0">
                {[
                  { src: "https://github.com/user-attachments/assets/6f4659c9-0989-47c0-b282-731ae5961df7", alt: "Best AI model on the market — Gemini 3.1" },
                  { src: "https://github.com/user-attachments/assets/95665e35-5f9c-4a6d-9255-8a5b9dfd5d01", alt: "Why Choose Sycord — Feature 2" },
                  { src: "https://github.com/user-attachments/assets/9c1a2ed9-1179-4e69-9c24-40058dc0e53d", alt: "Why Choose Sycord — Feature 3" },
                ].map((img, i) => (
                  <div
                    key={i}
                    className="w-64 sm:w-72 md:w-auto h-72 sm:h-80 md:h-96 flex-shrink-0 rounded-3xl overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Powered By Section */}
        <RevealSection className="w-full py-14 md:py-20 border-t border-b border-white/5 bg-[#1F1F21] overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <p className="text-center text-[#8A8E91] text-xs md:text-sm font-medium mb-4">Powered by</p>
            <h2 className="text-center text-white text-lg md:text-2xl font-bold mb-12 md:mb-16">The technologies behind Sycord</h2>

            {/* Desktop: orbital layout with connecting illustration */}
            <div className="relative hidden md:block">
              {/* Central connecting SVG illustration */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Connecting lines between cards */}
                <line x1="200" y1="160" x2="400" y2="160" stroke="white" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="6 4" className="animate-dash"/>
                <line x1="400" y1="160" x2="600" y2="160" stroke="white" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="6 4" className="animate-dash"/>
                <line x1="300" y1="80" x2="500" y2="80" stroke="white" strokeOpacity="0.04" strokeWidth="1" strokeDasharray="4 6" className="animate-dash"/>
                <line x1="300" y1="240" x2="500" y2="240" stroke="white" strokeOpacity="0.04" strokeWidth="1" strokeDasharray="4 6" className="animate-dash"/>
                {/* Orbiting dots */}
                <circle cx="400" cy="160" r="2.5" fill="white" opacity="0.15" className="animate-orbit"/>
                <circle cx="400" cy="160" r="2" fill="#60A5FA" opacity="0.2" className="animate-orbit-reverse"/>
              </svg>

              <div className="grid grid-cols-4 gap-6 relative z-10">
                {/* Sycord */}
                <div className="animate-float-1 group">
                  <div className="bg-[#252527] rounded-2xl p-6 border border-white/[0.08] hover:border-white/20 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 rounded-xl bg-white/[0.08] animate-pulse-glow"></div>
                        <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M7 12.5L10.5 16L17 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className="text-white font-bold text-base mb-1.5">Sycord</h3>
                      <p className="text-[#6B6E71] text-xs leading-relaxed">Platform & Editor</p>
                    </div>
                  </div>
                </div>

                {/* Gemini */}
                <div className="animate-float-2 group">
                  <div className="bg-[#252527] rounded-2xl p-6 border border-white/[0.08] hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-blue-500/[0.08] flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 rounded-xl bg-blue-400/[0.1] animate-pulse-glow"></div>
                        <svg className="w-7 h-7 text-blue-400 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C12 2 15 8 18 10.5C21 13 22 12 22 12C22 12 21 13 18 13.5C15 14 12 22 12 22C12 22 9 14 6 13.5C3 13 2 12 2 12C2 12 3 13 6 10.5C9 8 12 2 12 2Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className="text-white font-bold text-base mb-1.5">Gemini</h3>
                      <p className="text-[#6B6E71] text-xs leading-relaxed">AI Engine</p>
                    </div>
                  </div>
                </div>

                {/* GitHub */}
                <div className="animate-float-3 group">
                  <div className="bg-[#252527] rounded-2xl p-6 border border-white/[0.08] hover:border-white/20 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 rounded-xl bg-white/[0.08] animate-pulse-glow"></div>
                        <svg className="w-7 h-7 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                        </svg>
                      </div>
                      <h3 className="text-white font-bold text-base mb-1.5">GitHub</h3>
                      <p className="text-[#6B6E71] text-xs leading-relaxed">Source & Deploy</p>
                    </div>
                  </div>
                </div>

                {/* Production */}
                <div className="animate-float-4 group">
                  <div className="bg-[#252527] rounded-2xl p-6 border border-white/[0.08] hover:border-green-500/30 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-green-500/[0.08] flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 rounded-xl bg-green-400/[0.1] animate-pulse-glow"></div>
                        <svg className="w-7 h-7 text-green-400 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <h3 className="text-white font-bold text-base mb-1.5">Production</h3>
                      <p className="text-[#6B6E71] text-xs leading-relaxed">Live Hosting</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative background glow spots */}
              <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-500/[0.04] rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Mobile: horizontal scroll cards */}
            <div className="md:hidden overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-4 w-max px-0">
                {/* Sycord */}
                <div className="w-44 animate-float-1">
                  <div className="bg-[#252527] rounded-2xl p-5 border border-white/[0.08]">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-3 relative">
                      <div className="absolute inset-0 rounded-xl bg-white/[0.08] animate-pulse-glow"></div>
                      <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 12.5L10.5 16L17 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">Sycord</h3>
                    <p className="text-[#6B6E71] text-[11px]">Platform & Editor</p>
                  </div>
                </div>
                {/* Gemini */}
                <div className="w-44 animate-float-2">
                  <div className="bg-[#252527] rounded-2xl p-5 border border-white/[0.08]">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/[0.08] flex items-center justify-center mb-3 relative">
                      <div className="absolute inset-0 rounded-xl bg-blue-400/[0.1] animate-pulse-glow"></div>
                      <svg className="w-6 h-6 text-blue-400 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C12 2 15 8 18 10.5C21 13 22 12 22 12C22 12 21 13 18 13.5C15 14 12 22 12 22C12 22 9 14 6 13.5C3 13 2 12 2 12C2 12 3 13 6 10.5C9 8 12 2 12 2Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">Gemini</h3>
                    <p className="text-[#6B6E71] text-[11px]">AI Engine</p>
                  </div>
                </div>
                {/* GitHub */}
                <div className="w-44 animate-float-3">
                  <div className="bg-[#252527] rounded-2xl p-5 border border-white/[0.08]">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-3 relative">
                      <div className="absolute inset-0 rounded-xl bg-white/[0.08] animate-pulse-glow"></div>
                      <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">GitHub</h3>
                    <p className="text-[#6B6E71] text-[11px]">Source & Deploy</p>
                  </div>
                </div>
                {/* Production */}
                <div className="w-44 animate-float-4">
                  <div className="bg-[#252527] rounded-2xl p-5 border border-white/[0.08]">
                    <div className="w-12 h-12 rounded-xl bg-green-500/[0.08] flex items-center justify-center mb-3 relative">
                      <div className="absolute inset-0 rounded-xl bg-green-400/[0.1] animate-pulse-glow"></div>
                      <svg className="w-6 h-6 text-green-400 relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">Production</h3>
                    <p className="text-[#6B6E71] text-[11px]">Live Hosting</p>
                  </div>
                </div>
              </div>
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
              <div className="bg-[#1F2022] rounded-2xl p-8 border border-white/5 flex flex-col">
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
              <div className="bg-[#18191B] rounded-2xl p-8 border-2 border-yellow-500/40 flex flex-col relative">
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
              <div className="bg-[#1F2022] rounded-2xl p-8 border border-white/5 flex flex-col">
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
                <div className="w-72 bg-[#1F2022] rounded-2xl p-5 flex-shrink-0 border border-white/5">
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
                <div className="w-72 bg-[#18191B] rounded-2xl p-5 flex-shrink-0 border-2 border-yellow-500/40">
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
                <div className="w-72 bg-[#1F2022] rounded-2xl p-5 flex-shrink-0 border border-white/5">
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
          <div className="max-w-2xl mx-auto bg-[#252527] border border-white/10 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
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
      <footer className="w-full border-t border-white/5 bg-[#1F1F21] mt-8 md:mt-16">
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
