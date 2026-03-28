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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center overflow-x-hidden font-sans">
      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col">
        
        {/* Hero Section */}
        <RevealSection className="w-full relative">
          {/* Background Layer */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-[#0a0a0a]" />
            {/* Metallic texture - full width on mobile, diagonal on desktop */}
            <div 
              className="absolute inset-0 md:w-[55%]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            >
              <Image
                src="https://github.com/user-attachments/assets/ce4c62c7-1592-4542-a6ea-1dead982ad6a"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover opacity-30 md:opacity-50"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent via-transparent to-[#0a0a0a]" />
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 md:px-12 pt-16 sm:pt-20 md:pt-24 pb-32 md:pb-16">
            <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
              {/* Text Content */}
              <div className="flex-1 max-w-xl">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8 md:mb-10">
                  <Image 
                    src="/logo.png" 
                    alt="Sycord" 
                    width={40} 
                    height={40} 
                    className="w-10 h-10 md:w-9 md:h-9" 
                    priority 
                  />
                  <span className="text-2xl md:text-2xl font-bold text-white tracking-tight">
                    sycord
                  </span>
                </div>

                {/* Description */}
                <p className="text-lg sm:text-xl md:text-2xl text-[#C9CDCF] leading-relaxed mb-10 md:mb-10 max-w-md">
                  Describe your idea, Sycord&apos;s AI designs, codes and deploys your website instantly. No coding or design skills required.
                </p>

                {/* CTA Button */}
                <Button 
                  asChild
                  className="bg-[#3A3D40] hover:bg-[#4A4D50] text-white text-base font-medium px-10 h-14 rounded-full transition-colors"
                >
                  <Link href="/login">Get started</Link>
                </Button>
              </div>
              
              {/* Illustration - Desktop Only */}
              <div className="hidden md:flex flex-1 justify-center items-center">
                <div className="relative w-full max-w-md">
                  <Image
                    src="https://github.com/user-attachments/assets/49c718c0-b863-44b7-9e46-c7ae9d18206d"
                    alt="Blueprint style illustration"
                    width={500}
                    height={400}
                    sizes="(max-width: 768px) 0px, 400px"
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Curved transition to features - mobile only */}
          <div className="absolute bottom-0 left-0 right-0 h-20 md:hidden" aria-hidden="true">
            <svg 
              viewBox="0 0 1440 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path 
                d="M0 80V40C240 0 480 0 720 20C960 40 1200 60 1440 40V80H0Z" 
                fill="#0a0a0a"
              />
            </svg>
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
                    className="relative w-64 sm:w-72 md:w-auto h-72 sm:h-80 md:h-96 flex-shrink-0 rounded-3xl overflow-hidden"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 640px) 256px, (max-width: 768px) 288px, 33vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Supporters Section */}
        <RevealSection className="w-full py-14 md:py-20 border-t border-b border-white/5 bg-[#1F1F21] overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <p className="text-center text-[#8A8E91] text-xs md:text-sm font-medium mb-4">Powered by</p>
            <h2 className="text-center text-white text-lg md:text-2xl font-bold mb-10 md:mb-14">The technologies behind Sycord</h2>
            <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden">
              <Image
                src="https://github.com/user-attachments/assets/9b545725-ce0a-4543-a2fa-7194a97a4f72"
                alt="Supporters — Google, GitHub, and Cloudflare"
                width={1400}
                height={900}
                className="w-full h-auto"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 896px"
              />
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
