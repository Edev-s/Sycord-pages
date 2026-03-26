"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Check, Zap, Sparkles, ArrowRight, Globe, Clock, Bot } from "lucide-react"

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
      { threshold: 0.12 }
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

/* ─── Animated Hero Illustration ─── */
function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[480px] select-none" aria-hidden="true">
      {/* Background glow blobs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl animate-glow" />
      </div>
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-600/15 blur-2xl animate-glow" style={{ animationDelay: "1.5s" }} />

      <svg
        viewBox="0 0 480 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto relative z-10 drop-shadow-2xl"
      >
        {/* ── Prompt Card (left) ── */}
        <rect x="16" y="40" width="196" height="190" rx="16" fill="#1E1F24" stroke="#2E2F35" strokeWidth="1.5" />
        {/* Header bar */}
        <rect x="16" y="40" width="196" height="36" rx="16" fill="#252629" />
        <rect x="16" y="58" width="196" height="18" fill="#252629" />
        {/* Traffic lights */}
        <circle cx="34" cy="58" r="4" fill="#FF5F57" />
        <circle cx="48" cy="58" r="4" fill="#FEBC2E" />
        <circle cx="62" cy="58" r="4" fill="#28C840" />
        {/* "AI Prompt" label */}
        <rect x="82" y="52" width="88" height="12" rx="6" fill="#2E2F35" />

        {/* Bot icon area */}
        <circle cx="44" cy="103" r="14" fill="#312E81" opacity="0.8" />
        <text x="44" y="108" textAnchor="middle" fontSize="14" fill="#A5B4FC">⚡</text>

        {/* Prompt text lines (animated typing) */}
        <rect x="66" y="96" width="0" height="8" rx="4" fill="#6366F1" className="animate-type-1" />
        <rect x="66" y="112" width="0" height="6" rx="3" fill="#4B5563" className="animate-type-2" />
        <rect x="66" y="124" width="0" height="6" rx="3" fill="#4B5563" className="animate-type-3" />

        {/* Blinking cursor */}
        <rect x="66" y="96" width="2" height="8" rx="1" fill="#6366F1" className="animate-blink" />

        {/* Divider */}
        <line x1="32" y1="148" x2="196" y2="148" stroke="#2E2F35" strokeWidth="1" />

        {/* Prompt text label */}
        <rect x="32" y="160" width="60" height="7" rx="3.5" fill="#374151" />
        <rect x="32" y="174" width="140" height="7" rx="3.5" fill="#252629" />
        <rect x="32" y="188" width="100" height="7" rx="3.5" fill="#252629" />

        {/* Generate button */}
        <rect x="32" y="208" width="164" height="10" rx="12" fill="#4F46E5" />
        <rect x="86" y="210" width="50" height="6" rx="3" fill="#818CF8" opacity="0.8" />

        {/* ── Flow Arrow ── */}
        <g className="animate-arrow" style={{ transformOrigin: "238px 135px" }}>
          <line x1="218" y1="135" x2="258" y2="135" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 3" />
          <polygon points="258,131 266,135 258,139" fill="#6366F1" />
        </g>

        {/* ── Browser Preview Card (right) ── */}
        <rect x="268" y="40" width="196" height="240" rx="16" fill="#1E1F24" stroke="#2E2F35" strokeWidth="1.5" />
        {/* Title bar */}
        <rect x="268" y="40" width="196" height="36" rx="16" fill="#252629" />
        <rect x="268" y="58" width="196" height="18" fill="#252629" />
        {/* Traffic lights */}
        <circle cx="286" cy="58" r="4" fill="#FF5F57" />
        <circle cx="300" cy="58" r="4" fill="#FEBC2E" />
        <circle cx="314" cy="58" r="4" fill="#28C840" />
        {/* URL bar */}
        <rect x="328" y="50" width="118" height="14" rx="7" fill="#2E2F35" />
        <circle cx="338" cy="57" r="4" fill="#28C840" opacity="0.7" />
        <rect x="346" y="53" width="70" height="8" rx="4" fill="#374151" />

        {/* Hero area */}
        <rect x="284" y="88" width="0" height="10" rx="5" fill="#E5E7EB" className="animate-preview-1" />
        <rect x="284" y="104" width="0" height="7" rx="3.5" fill="#6B7280" className="animate-preview-2" />
        <rect x="284" y="116" width="0" height="7" rx="3.5" fill="#6B7280" className="animate-preview-3" />

        {/* CTA mini button */}
        <rect x="284" y="134" width="64" height="18" rx="9" fill="#4F46E5" className="animate-preview-card" />

        {/* Hero image placeholder */}
        <rect x="370" y="88" width="78" height="64" rx="10" fill="#252629" className="animate-preview-card" />
        <circle cx="409" cy="112" r="14" fill="#2E2F35" className="animate-preview-card" />
        <polygon points="403,120 415,108 415,124" fill="#374151" className="animate-preview-card" />

        {/* Feature cards row */}
        <rect x="284" y="172" width="68" height="56" rx="10" fill="#252629" stroke="#2E2F35" strokeWidth="1" className="animate-preview-card" />
        <rect x="360" y="172" width="68" height="56" rx="10" fill="#252629" stroke="#2E2F35" strokeWidth="1" className="animate-preview-card" />
        <circle cx="308" cy="193" r="7" fill="#312E81" opacity="0.8" className="animate-preview-card" />
        <circle cx="384" cy="193" r="7" fill="#064E3B" opacity="0.8" className="animate-preview-card" />
        <rect x="292" y="207" width="48" height="5" rx="2.5" fill="#374151" className="animate-preview-card" />
        <rect x="292" y="216" width="36" height="4" rx="2" fill="#2E2F35" className="animate-preview-card" />
        <rect x="368" y="207" width="48" height="5" rx="2.5" fill="#374151" className="animate-preview-card" />
        <rect x="368" y="216" width="36" height="4" rx="2" fill="#2E2F35" className="animate-preview-card" />

        {/* ── "Website ready" badge ── */}
        <g className="animate-badge" style={{ transformOrigin: "238px 298px" }}>
          <rect x="160" y="286" width="156" height="28" rx="14" fill="#052E16" stroke="#16A34A" strokeWidth="1.2" />
          <circle cx="178" cy="300" r="4" fill="#22C55E" />
          <rect x="190" y="294" width="90" height="6" rx="3" fill="#16A34A" opacity="0.9" />
          <rect x="190" y="304" width="60" height="5" rx="2.5" fill="#166534" />
        </g>

        {/* ── Decorative sparkles ── */}
        <g transform="translate(440, 32)">
          <path d="M7 0L8.75 5.25L14 7L8.75 8.75L7 14L5.25 8.75L0 7L5.25 5.25Z" fill="#818CF8" opacity="0.7" />
        </g>
        <g transform="translate(12, 250)">
          <path d="M5 0L6.25 3.75L10 5L6.25 6.25L5 10L3.75 6.25L0 5L3.75 3.75Z" fill="#A78BFA" opacity="0.5" />
        </g>
        <g transform="translate(242, 20)">
          <circle cx="6" cy="6" r="6" fill="#6366F1" opacity="0.3" />
        </g>
      </svg>

      {/* Floating badges (HTML, outside SVG for richer styling) */}
      <div className="absolute -left-4 top-[42%] animate-float-3 z-20">
        <div className="flex items-center gap-1.5 bg-[#1a1a2e]/90 border border-indigo-500/30 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[10px] font-medium text-indigo-300">AI generating…</span>
        </div>
      </div>
      <div className="absolute -right-4 top-[22%] animate-float-2 z-20">
        <div className="flex items-center gap-1.5 bg-[#052e16]/90 border border-green-500/30 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] font-medium text-green-300">Live in 4s</span>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#18191B] flex flex-col items-center overflow-x-hidden font-sans">

      {/* ── Header ── */}
      <header className="w-full px-4 md:px-8 py-4 flex items-center justify-between z-20 sticky top-0 bg-[#18191B]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Sycord Logo" width={26} height={26} className="opacity-90" priority />
          <span className="text-base font-bold text-white tracking-tight">Sycord</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#how-it-works" className="text-[#8A8E91] hover:text-white text-sm transition-colors">How it works</Link>
          <Link href="#pricing" className="text-[#8A8E91] hover:text-white text-sm transition-colors">Pricing</Link>
          <Link href="/about" className="text-[#8A8E91] hover:text-white text-sm transition-colors">About</Link>
        </nav>
        <Button
          asChild
          className="bg-white text-[#18191B] hover:bg-white/90 text-xs md:text-sm font-semibold px-4 md:px-6 h-8 md:h-9 rounded-full"
        >
          <Link href="/login">Get started free</Link>
        </Button>
      </header>

      {/* ── Main ── */}
      <main className="w-full flex-1 flex flex-col">

        {/* ── Hero ── */}
        <section className="w-full px-4 md:px-8 pt-14 md:pt-24 pb-12 md:pb-20 relative overflow-hidden">
          {/* Large background glow */}
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
            <div className="w-[700px] h-[400px] rounded-full bg-indigo-700/10 blur-[120px] mt-[-60px] animate-glow" />
          </div>

          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">

            {/* Left: Copy */}
            <div className="flex-1 max-w-xl text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-6">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-indigo-300 text-xs font-medium tracking-wide">AI-Powered Website Builder</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.08] tracking-tight mb-5">
                <span className="text-white">Build your website</span>
                <br />
                <span className="text-white">with AI —&nbsp;</span>
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  in minutes.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-[#9CA3AF] text-base md:text-lg leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
                Describe your idea, Sycord&apos;s AI designs, codes and deploys your website instantly.
                <br className="hidden sm:block" /> No coding or design skills required.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center md:items-start gap-3 sm:gap-4">
                <Button
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-7 h-12 rounded-full min-w-[160px] flex items-center gap-2 shadow-lg shadow-indigo-900/40"
                >
                  <Link href="/login">
                    Start for free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/15 text-white hover:bg-white/5 text-sm font-medium px-7 h-12 rounded-full"
                >
                  <Link href="#pricing">View pricing</Link>
                </Button>
              </div>

              {/* Micro social proof */}
              <p className="mt-5 text-[#6B7280] text-xs">
                Free plan available &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Live in &lt; 5 min
              </p>
            </div>

            {/* Right: Animated Illustration */}
            <div className="flex-1 flex justify-center w-full md:w-auto">
              <HeroIllustration />
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="w-full border-y border-white/5 bg-[#1C1D1F] py-6 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Websites built", value: "5,000+" },
              { label: "Avg. launch time", value: "< 5 min" },
              { label: "Uptime guarantee", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-lg md:text-2xl font-bold text-white mb-0.5">{stat.value}</div>
                <div className="text-[#6B7280] text-[11px] md:text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <RevealSection id="how-it-works" className="w-full px-4 md:px-8 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-4">
              From idea to live site in three steps
            </h2>
            <p className="text-[#6B7280] text-sm md:text-base text-center max-w-lg mx-auto mb-14">
              No drag-and-drop frustration. No hiring a dev. Just describe what you want.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
              {/* Connector line on desktop */}
              <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gradient-to-r from-transparent via-indigo-600/40 to-transparent" />

              {[
                {
                  step: "01",
                  icon: <Bot className="w-6 h-6 text-indigo-400" />,
                  title: "Describe your vision",
                  desc: "Type a short description of your website — your industry, style, and any specific features you need.",
                  color: "bg-indigo-600/10 border-indigo-600/20",
                  iconBg: "bg-indigo-600/15",
                },
                {
                  step: "02",
                  icon: <Zap className="w-6 h-6 text-yellow-400" />,
                  title: "AI builds it instantly",
                  desc: "Sycord's AI generates a complete, responsive website with content, design, and all pages in seconds.",
                  color: "bg-yellow-500/10 border-yellow-500/20",
                  iconBg: "bg-yellow-500/15",
                },
                {
                  step: "03",
                  icon: <Globe className="w-6 h-6 text-green-400" />,
                  title: "Go live with one click",
                  desc: "Your site is deployed to a fast global CDN. Share your link and start getting visitors immediately.",
                  color: "bg-green-600/10 border-green-600/20",
                  iconBg: "bg-green-600/15",
                },
              ].map((item) => (
                <div key={item.step} className={`relative rounded-2xl border p-6 md:p-7 flex flex-col gap-4 ${item.color}`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.iconBg}`}>
                      {item.icon}
                    </div>
                    <span className="text-3xl font-black text-white/5 select-none">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base mb-2">{item.title}</h3>
                    <p className="text-[#9CA3AF] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* ── Features Section ── */}
        <RevealSection className="w-full px-4 md:px-8 py-12 md:py-20 bg-[#1C1D1F]">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-3">Why teams choose Sycord</h2>
            <p className="text-sm md:text-base text-[#6B7280] text-center mb-12 max-w-xl mx-auto">
              Everything you need to build, launch, and grow your online presence — in one place.
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
                    className="relative w-64 sm:w-72 md:w-auto h-72 sm:h-80 md:h-96 flex-shrink-0 rounded-3xl overflow-hidden ring-1 ring-white/5"
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

        {/* ── Supporters / Tech Stack ── */}
        <RevealSection className="w-full py-14 md:py-20 border-t border-b border-white/5 bg-[#18191B] overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <p className="text-center text-[#6B7280] text-xs md:text-sm font-medium mb-3">Powered by</p>
            <h2 className="text-center text-white text-lg md:text-2xl font-bold mb-10 md:mb-14">
              The technologies behind Sycord
            </h2>
            <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden ring-1 ring-white/5">
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

        {/* ── Pricing ── */}
        <RevealSection id="pricing" className="w-full px-4 md:px-8 py-14 md:py-24">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-3">Simple, transparent pricing</h2>
            <p className="text-sm md:text-base text-[#6B7280] text-center mb-12 max-w-xl mx-auto">
              Start free, scale when you&apos;re ready. No hidden fees.
            </p>

            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-[#1C1D1F] rounded-2xl p-8 border border-white/5 flex flex-col">
                <div className="mb-5">
                  <div className="flex gap-1.5 mb-5">
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]" />
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]" />
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#6B7280] mb-1">Sycord</h3>
                  <p className="text-[#6B7280] text-sm">Perfect for getting started</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-[#6B7280] text-sm ml-1">/month</span>
                </div>
                <Button asChild className="w-full bg-[#2E2F35] hover:bg-[#3A3B41] text-white mb-7 h-10 rounded-full">
                  <Link href="/login">Get Started</Link>
                </Button>
                <ul className="space-y-3 flex-1">
                  {["1 Website", "1 GB Storage", "Basic Templates"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                      <span className="text-white/70 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sycord+ — Featured */}
              <div className="bg-[#18191B] rounded-2xl p-8 border-2 border-indigo-500/30 flex flex-col relative shadow-[0_0_40px_rgba(99,102,241,0.12)]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600/10 border border-indigo-500/30 rounded-full px-4 py-1">
                  <span className="text-indigo-300 text-xs font-semibold">Most Popular</span>
                </div>
                <div className="mb-5 mt-2">
                  <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span className="text-indigo-400 text-xs font-semibold">PRO</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Sycord+</h3>
                  <p className="text-[#6B7280] text-sm">For growing businesses</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">$9</span>
                  <span className="text-[#6B7280] text-sm ml-1">/month</span>
                </div>
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mb-7 h-10 rounded-full">
                  <Link href="/login">Upgrade Now</Link>
                </Button>
                <ul className="space-y-3 flex-1">
                  {["Unlimited Sites", "50 GB Storage", "AI Builder", "Custom Domain", "Priority CDN"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="text-white/80 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Enterprise */}
              <div className="bg-[#1C1D1F] rounded-2xl p-8 border border-white/5 flex flex-col">
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-400 text-xs font-semibold">ENTERPRISE</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Sycord Enterprise</h3>
                  <p className="text-[#6B7280] text-sm">For large teams</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">$29</span>
                  <span className="text-[#6B7280] text-sm ml-1">/month</span>
                </div>
                <Button asChild variant="outline" className="w-full border-white/15 hover:bg-white/5 text-white mb-7 h-10 rounded-full">
                  <Link href="/contact">Contact Sales</Link>
                </Button>
                <ul className="space-y-3 flex-1">
                  {["Everything in Sycord+", "500 GB Storage", "Priority Support", "SLA Guarantee", "Dedicated Manager"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <span className="text-white/80 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mobile Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide pb-4">
              <div className="flex gap-4 w-max">
                {/* Free */}
                <div className="w-72 bg-[#1C1D1F] rounded-2xl p-5 flex-shrink-0 border border-white/5">
                  <div className="flex gap-1.5 mb-4"><div className="w-2 h-2 rounded-full bg-[#3A3B3D]" /><div className="w-2 h-2 rounded-full bg-[#3A3B3D]" /><div className="w-2 h-2 rounded-full bg-[#3A3B3D]" /></div>
                  <h3 className="text-xl font-bold text-[#6B7280] mb-1">Sycord</h3>
                  <p className="text-[#6B7280] text-xs mb-4">Getting started</p>
                  <div className="mb-4"><span className="text-2xl font-black text-white">$0</span><span className="text-[#6B7280] text-xs ml-1">/mo</span></div>
                  <Button asChild className="w-full bg-[#2E2F35] hover:bg-[#3A3B41] text-white text-xs h-9 rounded-full mb-4"><Link href="/login">Get Started</Link></Button>
                  <ul className="space-y-2">{["1 Website", "1 GB Storage", "Basic Templates"].map((f) => (<li key={f} className="flex items-center gap-2"><Check className="w-3 h-3 text-[#6B7280] flex-shrink-0" /><span className="text-white/70 text-xs">{f}</span></li>))}</ul>
                </div>

                {/* Sycord+ */}
                <div className="w-72 bg-[#18191B] rounded-2xl p-5 flex-shrink-0 border-2 border-indigo-500/30">
                  <div className="flex items-center gap-1.5 mb-3"><Zap className="w-3.5 h-3.5 text-indigo-400" /><span className="text-[10px] font-semibold text-indigo-400">Most Popular</span></div>
                  <h3 className="text-xl font-bold text-white mb-1">Sycord+</h3>
                  <p className="text-[#6B7280] text-xs mb-4">Growing business</p>
                  <div className="mb-4"><span className="text-2xl font-black text-white">$9</span><span className="text-[#6B7280] text-xs ml-1">/mo</span></div>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 rounded-full font-semibold mb-4"><Link href="/login">Upgrade</Link></Button>
                  <ul className="space-y-2">{["Unlimited Sites", "50 GB Storage", "AI Builder"].map((f) => (<li key={f} className="flex items-center gap-2"><Check className="w-3 h-3 text-indigo-400 flex-shrink-0" /><span className="text-white/80 text-xs">{f}</span></li>))}</ul>
                </div>

                {/* Enterprise */}
                <div className="w-72 bg-[#1C1D1F] rounded-2xl p-5 flex-shrink-0 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-3"><Sparkles className="w-3.5 h-3.5 text-violet-400" /></div>
                  <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
                  <p className="text-[#6B7280] text-xs mb-4">Large teams</p>
                  <div className="mb-4"><span className="text-2xl font-black text-white">$29</span><span className="text-[#6B7280] text-xs ml-1">/mo</span></div>
                  <Button asChild variant="outline" className="w-full border-white/15 hover:bg-white/5 text-white text-xs h-9 rounded-full mb-4"><Link href="/contact">Contact</Link></Button>
                  <ul className="space-y-2">{["Everything in Sycord+", "500 GB Storage", "Priority Support"].map((f) => (<li key={f} className="flex items-center gap-2"><Check className="w-3 h-3 text-violet-400 flex-shrink-0" /><span className="text-white/80 text-xs">{f}</span></li>))}</ul>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        {/* ── CTA ── */}
        <RevealSection className="w-full px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-2xl mx-auto relative">
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl bg-indigo-600/10 blur-2xl" />
            <div className="relative bg-gradient-to-br from-[#1E1F2E] to-[#1C1D1F] border border-indigo-500/20 rounded-3xl p-10 md:p-14 text-center overflow-hidden">
              {/* Decorative rings */}
              <svg className="absolute -right-12 -top-12 w-48 h-48 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="98" stroke="white" strokeWidth="2" />
                <circle cx="100" cy="100" r="70" stroke="white" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="42" stroke="white" strokeWidth="1" />
                <line x1="100" y1="0" x2="100" y2="200" stroke="white" strokeWidth="1" />
                <line x1="0" y1="100" x2="200" y2="100" stroke="white" strokeWidth="1" />
              </svg>
              <svg className="absolute -left-10 -bottom-10 w-36 h-36 opacity-[0.04]" viewBox="0 0 144 144" fill="none">
                <rect x="8" y="8" width="128" height="128" rx="24" stroke="white" strokeWidth="2" />
                <rect x="28" y="28" width="88" height="88" rx="16" stroke="white" strokeWidth="1.5" />
                <rect x="48" y="48" width="48" height="48" rx="10" stroke="white" strokeWidth="1" />
              </svg>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-indigo-600/15 border border-indigo-500/25 rounded-full px-4 py-1.5 mb-5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-300 text-xs font-medium">Your website can be live in 5 minutes</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                  Ready to build your website?
                </h2>
                <p className="text-[#9CA3AF] mb-8 text-sm md:text-base max-w-md mx-auto">
                  Join thousands of creators and businesses already using Sycord to build amazing websites.
                </p>
                <Button
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 h-12 rounded-full shadow-lg shadow-indigo-900/40"
                >
                  <Link href="/login">Start Building — It&apos;s Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </RevealSection>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-white/5 bg-[#1C1D1F] mt-4 md:mt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-16 mb-10">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="Sycord Logo" width={24} height={24} className="opacity-90" />
                <span className="text-white font-bold text-base tracking-tight">Sycord</span>
              </div>
              <p className="text-[#6B7280] text-xs max-w-[200px] leading-relaxed">
                Build stunning websites in minutes with AI. No coding required.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-14">
              <div>
                <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3">Product</h3>
                <ul className="space-y-2.5">
                  <li><Link href="#how-it-works" className="text-[#6B7280] hover:text-white text-xs transition-colors">How it works</Link></li>
                  <li><Link href="#pricing" className="text-[#6B7280] hover:text-white text-xs transition-colors">Pricing</Link></li>
                  <li><Link href="#" className="text-[#6B7280] hover:text-white text-xs transition-colors">Security</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3">Company</h3>
                <ul className="space-y-2.5">
                  <li><Link href="/about" className="text-[#6B7280] hover:text-white text-xs transition-colors">About</Link></li>
                  <li><Link href="#" className="text-[#6B7280] hover:text-white text-xs transition-colors">Blog</Link></li>
                  <li><Link href="/contact" className="text-[#6B7280] hover:text-white text-xs transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3">Legal</h3>
                <ul className="space-y-2.5">
                  <li><Link href="/pap" className="text-[#6B7280] hover:text-white text-xs transition-colors">Privacy</Link></li>
                  <li><Link href="/tos" className="text-[#6B7280] hover:text-white text-xs transition-colors">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[#6B7280] text-[11px]">© {new Date().getFullYear()} Sycord. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <Link href="#" className="text-[#6B7280] hover:text-white text-[11px] transition-colors">Twitter</Link>
              <Link href="#" className="text-[#6B7280] hover:text-white text-[11px] transition-colors">GitHub</Link>
              <Link href="#" className="text-[#6B7280] hover:text-white text-[11px] transition-colors">Discord</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
