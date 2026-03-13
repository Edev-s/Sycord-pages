"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Info, Check, Zap, Globe, Shield, Clock, Users, Code, Sparkles, ArrowRight, Github, Mail } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#18191B] flex flex-col overflow-x-hidden font-sans">
      {/* Header */}
      <header className="w-full px-5 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#18191B]/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path d="M4 5L12 3L20 5V11C20 16 12 21 12 21C12 21 4 16 4 11V5Z" fill="#8A8E91" stroke="#8A8E91" strokeWidth="2"/>
              <path d="M8 10L11 13L16 8" stroke="#18191B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">Sycord</span>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="text-sm font-medium text-white/80 hover:text-white transition-colors px-3 py-2 min-h-[44px] flex items-center"
          >
            Bejelentkezes
          </Link>
          <Button 
            asChild 
            className="bg-white text-[#18191B] hover:bg-white/90 text-sm font-semibold px-5 h-10 rounded-lg min-h-[44px]"
          >
            <Link href="/login">Kezdes</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-5 pt-12 pb-8">
          <h1 className="text-4xl leading-tight tracking-tight mb-6">
            <span className="font-bold text-white">Create </span>
            <span className="font-medium text-[#8A8E91]">your</span>
            <br />
            <span className="font-medium text-[#8A8E91]">website </span>
            <span className="font-bold text-white">under 5</span>
            <br />
            <span className="font-bold text-white">minute!</span>
          </h1>
          <Button 
            asChild
            className="bg-[#8A8E91] hover:bg-[#787C7F] text-white text-base font-semibold px-8 h-12 rounded-xl min-h-[48px]"
          >
            <Link href="/login">Get started</Link>
          </Button>
        </section>

        {/* Corporate Supporters Section */}
        <section className="px-5 py-12">
          <div className="flex items-center justify-center gap-8 mb-4">
            {/* GitHub */}
            <div className="flex items-center gap-2 text-white">
              <Github className="w-5 h-5" />
              <span className="text-base font-semibold">GitHub</span>
            </div>

            {/* Cloudflare Icon */}
            <div className="flex items-center justify-center text-white">
              <svg width="32" height="24" viewBox="0 0 64 42" fill="currentColor">
                <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z"/>
              </svg>
            </div>

            {/* Google */}
            <div className="flex items-center gap-1.5 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.27C21.35 18.42 22.56 15.6 22.56 12.25Z"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.71 16.7 5.84 14.1H2.18V16.94C3.99 20.53 7.7 23 12 23Z"/>
                <path d="M5.84 14.1C5.62 13.44 5.49 12.74 5.49 12C5.49 11.26 5.62 10.56 5.84 9.9V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.1Z"/>
                <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z"/>
              </svg>
              <span className="text-base font-medium">Google</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-[#252527] px-4 py-2 rounded-full border border-white/5">
              <span className="text-xs text-[#8A8E91]">Corporate Supporters:</span>
              <Info className="w-3.5 h-3.5 text-[#8A8E91]" />
            </div>
          </div>
        </section>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="w-6 h-1.5 bg-[#8A8E91] rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-[#323335] rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-[#323335] rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-[#323335] rounded-full"></div>
        </div>

        {/* Pricing Section with Phone Mockup */}
        <section className="relative">
          {/* Pricing Cards Container */}
          <div className="bg-[#252527] rounded-t-[32px] px-5 pt-8 pb-16">
            {/* Free Tier */}
            <div className="bg-[#323335] rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#8A8E91] rounded-lg rotate-45 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#18191B] -rotate-45" />
                  </div>
                  <span className="text-2xl font-bold text-[#8A8E91]">Free</span>
                </div>
                <span className="text-xl font-semibold text-white">$0/mo</span>
              </div>
              <ul className="space-y-2.5 mb-5">
                <li className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>1 Website</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>Basic Templates</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>1 GB Storage</span>
                </li>
              </ul>
              <Button 
                asChild
                variant="outline" 
                className="w-full h-11 rounded-xl border-white/10 text-white hover:bg-white/5 min-h-[44px]"
              >
                <Link href="/login">Get Started</Link>
              </Button>
            </div>

            {/* Professional Tier */}
            <div className="bg-gradient-to-br from-[#3B3D40] to-[#323335] rounded-2xl p-5 mb-4 border border-[#8A8E91]/30 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="bg-[#8A8E91] text-[#18191B] text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Popular
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg rotate-45 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#18191B] -rotate-45" />
                  </div>
                  <span className="text-2xl font-bold text-white">Professional</span>
                </div>
                <span className="text-xl font-semibold text-white">$9/mo</span>
              </div>
              <ul className="space-y-2.5 mb-5">
                <li className="flex items-center gap-2.5 text-sm text-white">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>Unlimited Websites</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>AI Website Builder</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>Custom Domain</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>50 GB Storage</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <Button 
                asChild
                className="w-full h-11 rounded-xl bg-white text-[#18191B] hover:bg-white/90 font-semibold min-h-[44px]"
              >
                <Link href="/login">Upgrade Now</Link>
              </Button>
            </div>

            {/* Ultra Tier */}
            <div className="bg-[#323335] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#8A8E91] to-[#6B6F72] rounded-lg rotate-45 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white -rotate-45" />
                  </div>
                  <span className="text-2xl font-bold text-[#8A8E91]">Ultra</span>
                </div>
                <span className="text-xl font-semibold text-white">$29/mo</span>
              </div>
              <ul className="space-y-2.5 mb-5">
                <li className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>500 GB Storage</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>Advanced Analytics</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                  <span>API Access</span>
                </li>
              </ul>
              <Button 
                asChild
                variant="outline" 
                className="w-full h-11 rounded-xl border-white/10 text-white hover:bg-white/5 min-h-[44px]"
              >
                <Link href="/login">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-[#18191B] px-5 py-12">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Why Choose Sycord?</h2>
          <p className="text-sm text-[#8A8E91] text-center mb-8">Build faster, launch sooner</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#252527] rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-[#323335] rounded-lg flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-[#8A8E91]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Lightning Fast</h3>
              <p className="text-xs text-[#8A8E91]">Deploy in seconds</p>
            </div>
            
            <div className="bg-[#252527] rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-[#323335] rounded-lg flex items-center justify-center mb-3">
                <Globe className="w-5 h-5 text-[#8A8E91]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Global CDN</h3>
              <p className="text-xs text-[#8A8E91]">Worldwide delivery</p>
            </div>
            
            <div className="bg-[#252527] rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-[#323335] rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-[#8A8E91]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Secure</h3>
              <p className="text-xs text-[#8A8E91]">SSL included free</p>
            </div>
            
            <div className="bg-[#252527] rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-[#323335] rounded-lg flex items-center justify-center mb-3">
                <Code className="w-5 h-5 text-[#8A8E91]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">AI Powered</h3>
              <p className="text-xs text-[#8A8E91]">Smart building</p>
            </div>
          </div>
        </section>

        {/* Testimonials / Stats Section */}
        <section className="bg-[#252527] px-5 py-12">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-xs text-[#8A8E91]">Websites</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">5K+</p>
              <p className="text-xs text-[#8A8E91]">Users</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="text-xs text-[#8A8E91]">Uptime</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#18191B] px-5 py-12">
          <div className="bg-gradient-to-br from-[#323335] to-[#252527] rounded-2xl p-6 text-center border border-white/5">
            <h2 className="text-xl font-bold text-white mb-2">Ready to get started?</h2>
            <p className="text-sm text-[#8A8E91] mb-5">Create your first website in under 5 minutes</p>
            <Button 
              asChild
              className="bg-white text-[#18191B] hover:bg-white/90 font-semibold px-8 h-12 rounded-xl min-h-[48px] w-full"
            >
              <Link href="/login" className="flex items-center justify-center gap-2">
                Start Building
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#18191B] border-t border-white/5 px-5 py-8">
        <div className="flex flex-col gap-6">
          {/* Logo and Description */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M4 5L12 3L20 5V11C20 16 12 21 12 21C12 21 4 16 4 11V5Z" fill="#8A8E91" stroke="#8A8E91" strokeWidth="2"/>
                  <path d="M8 10L11 13L16 8" stroke="#18191B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-semibold text-white">Sycord</span>
            </div>
            <p className="text-xs text-[#8A8E91] leading-relaxed">
              Build beautiful websites in minutes with AI-powered tools.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/subscriptions" className="text-xs text-[#8A8E91] hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/releases" className="text-xs text-[#8A8E91] hover:text-white transition-colors">Releases</Link></li>
                <li><Link href="/servers" className="text-xs text-[#8A8E91] hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-xs text-[#8A8E91] hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-xs text-[#8A8E91] hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-xs text-[#8A8E91] hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#252527] rounded-lg flex items-center justify-center hover:bg-[#323335] transition-colors min-h-[44px] min-w-[44px]">
              <Github className="w-5 h-5 text-[#8A8E91]" />
            </a>
            <a href="mailto:support@sycord.app" className="w-10 h-10 bg-[#252527] rounded-lg flex items-center justify-center hover:bg-[#323335] transition-colors min-h-[44px] min-w-[44px]">
              <Mail className="w-5 h-5 text-[#8A8E91]" />
            </a>
          </div>

          {/* Copyright */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-[#8A8E91] text-center">
              2024 Sycord. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
