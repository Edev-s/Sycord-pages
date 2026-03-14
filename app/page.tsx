"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Zap, Globe, Shield, Sparkles, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F0F11] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0F0F11]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Sycord" width={32} height={32} className="opacity-90" />
            <span className="font-bold text-lg text-white">Sycord</span>
          </div>
          <Button 
            asChild 
            className="bg-white text-[#0F0F11] hover:bg-white/90 font-semibold px-6 h-10 rounded-full"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 font-medium">
            ✨ Build smarter, faster
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Create your website in{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              under 5 minutes
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
            Build beautiful, professional websites without any coding. Powered by AI, designed for creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              className="bg-white text-[#0F0F11] hover:bg-white/90 font-semibold px-8 h-12 rounded-full text-base"
            >
              <Link href="/signup">Start Building Free</Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="border border-white/20 text-white hover:bg-white/5 font-semibold px-8 h-12 rounded-full text-base"
            >
              <Link href="/demo">Watch Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full bg-white/2.5 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex flex-col items-center md:items-start">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">10K+</div>
              <p className="text-white/60 text-sm md:text-base">Websites Created</p>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">50K+</div>
              <p className="text-white/60 text-sm md:text-base">Active Users</p>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div>
              <p className="text-white/60 text-sm md:text-base">Uptime</p>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
              <p className="text-white/60 text-sm md:text-base">Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="w-full py-12 md:py-16 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-white/60 text-sm font-medium mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-white/80">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </div>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-2 text-white/80">
              <svg width="20" height="20" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
              </svg>
              <span className="text-sm font-medium">Cloudflare</span>
            </div>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-sm font-medium">Google</span>
            </div>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-sm font-medium">Telegram</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Sycord?</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Everything you need to create stunning websites in minutes
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Build in minutes, not hours" },
              { icon: Globe, title: "Global Reach", desc: "Deploy worldwide instantly" },
              { icon: Shield, title: "Enterprise Secure", desc: "Bank-grade security" },
              { icon: Sparkles, title: "AI Powered", desc: "Smart suggestions included" },
              { icon: Check, title: "No Coding", desc: "Visual builder for everyone" },
              { icon: ArrowRight, title: "SEO Optimized", desc: "Rank higher automatically" }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-16 md:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
            <p className="text-white/60 text-lg">Choose the plan that fits your needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Free */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-white/60 text-sm mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-white/60 text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["1 Website", "1 GB Storage", "Basic Support", "Sycord Branding"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button 
                asChild
                className="w-full bg-white/10 text-white hover:bg-white/20 rounded-lg h-10"
              >
                <Link href="/signup">Start Free</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl bg-blue-500/10 border border-blue-500/50 flex flex-col ring-1 ring-blue-500/50 md:scale-105">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-white/60 text-sm mb-6">For growing creators</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-white/60 text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Unlimited Sites", "50 GB Storage", "Priority Support", "Custom Domain"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button 
                asChild
                className="w-full bg-blue-500 text-white hover:bg-blue-600 rounded-lg h-10 font-semibold"
              >
                <Link href="/signup">Upgrade to Pro</Link>
              </Button>
            </div>

            {/* Ultra */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Ultra</h3>
              <p className="text-white/60 text-sm mb-6">For enterprises</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-white/60 text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {["Everything in Pro", "500 GB Storage", "24/7 Support", "API Access"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button 
                asChild
                variant="outline"
                className="w-full border border-white/20 text-white hover:bg-white/5 rounded-lg h-10"
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to build your website?</h2>
          <p className="text-white/60 text-lg mb-8">Join thousands of creators already building with Sycord.</p>
          <Button 
            asChild
            className="bg-white text-[#0F0F11] hover:bg-white/90 font-semibold px-8 h-12 rounded-full text-base"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-white/2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Features</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Pricing</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">About</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Blog</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Privacy</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Terms</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Twitter</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">GitHub</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white text-sm transition">Discord</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Image src="/logo.png" alt="Sycord" width={24} height={24} />
              <span className="text-white/60 text-sm">© 2024 Sycord. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
