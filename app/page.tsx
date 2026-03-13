"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Info, Check, Zap, Globe, Shield, Sparkles, Twitter, Github, Linkedin } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#18191B] flex flex-col items-center overflow-x-hidden font-sans">
      {/* Header */}
      <header className="w-full px-5 py-6 flex items-center justify-between z-20 sticky top-0 bg-[#18191B]/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Sycord Logo" width={22} height={22} className="opacity-90" />
          <span className="text-lg font-semibold text-white tracking-tight">Sycord</span>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="text-[14px] font-medium text-white/90 hover:text-white transition-colors min-h-[44px] flex items-center px-2"
          >
            Bejelentkezés
          </Link>
          <Button 
            asChild 
            className="bg-white text-[#18191B] hover:bg-white/90 text-[14px] font-semibold px-5 h-11 rounded-lg min-w-[44px]"
          >
            <Link href="/login">Kezdés</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full flex-1 flex flex-col">
        {/* Hero Content */}
        <section className="w-full px-5 pt-12 pb-8 relative min-h-[380px]">
          {/* Text Content */}
          <div className="relative z-10 max-w-[280px]">
            <h1 className="text-[32px] leading-[1.15] tracking-tight mb-8">
              <span className="font-bold text-white">Create </span>
              <span className="text-[#8A8E91] font-medium">your</span>
              <br />
              <span className="text-[#8A8E91] font-medium">website </span>
              <span className="font-bold text-white">under 5</span>
              <br />
              <span className="font-bold text-white">minute!</span>
            </h1>
            <Button 
              asChild
              className="bg-[#6B6E71] hover:bg-[#5A5D60] text-white text-[15px] font-medium px-7 h-12 rounded-xl min-w-[44px] min-h-[44px]"
            >
              <Link href="/login">Get started</Link>
            </Button>
          </div>

          {/* Phone Mockup - Positioned to show only top portion */}
          <div className="absolute top-8 right-[-60px] w-[280px] h-[400px] pointer-events-none z-0">
            <Image
              src="/phone-mockup.png"
              alt="Phone Mockup"
              fill
              className="object-contain object-top"
              style={{ transform: 'rotate(15deg)' }}
              priority
            />
          </div>
        </section>

        {/* Corporate Supporters Section */}
        <section className="w-full px-5 pt-16 pb-8">
          <div className="flex items-center justify-center gap-8 mb-5">
            {/* GitHub */}
            <div className="flex items-center gap-1.5 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
              </svg>
              <span className="text-[15px] font-semibold tracking-tight">GitHub</span>
            </div>

            {/* Cloudflare Cloud Icon */}
            <div className="flex items-center justify-center text-white">
              <svg width="36" height="24" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
              </svg>
            </div>

            {/* Google */}
            <div className="flex items-center text-white">
              <span className="text-[17px] font-medium tracking-tight">Google</span>
            </div>
          </div>

          {/* Corporate Supporters Badge */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-[#252527] px-4 py-2 rounded-full border border-white/5">
              <span className="text-[12px] text-[#8A8E91] font-medium">Corporate Supporters:</span>
              <Info className="w-3.5 h-3.5 text-[#8A8E91]" />
            </div>
          </div>
        </section>

        {/* Pagination Dots */}
        <section className="w-full flex justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1.5 bg-[#8A8E91] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#3A3B3D] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#3A3B3D] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#3A3B3D] rounded-full"></div>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="w-full px-4">
          {/* Free Plan Card - Shows partially like in mockup */}
          <div className="w-full bg-[#28292B] rounded-t-[32px] p-6 relative overflow-hidden">
            {/* Browser dots */}
            <div className="flex items-center gap-1.5 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-[#3A3B3D]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#3A3B3D]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#3A3B3D]"></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rotate-45 bg-[#6B6E71] rounded-md flex-shrink-0"></div>
                <span className="text-[28px] font-bold text-[#6B6E71] tracking-tight">Free</span>
              </div>
              <div className="w-[120px] h-[40px] bg-[#3A3B3D] rounded-xl"></div>
            </div>

            {/* Full pricing section below */}
            <div className="mt-8 space-y-4">
              <p className="text-[#8A8E91] text-sm">Perfect for getting started</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#6B6E71]" />
                  <span className="text-white/80 text-sm">1 Website</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#6B6E71]" />
                  <span className="text-white/80 text-sm">1 GB Storage</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#6B6E71]" />
                  <span className="text-white/80 text-sm">Basic Templates</span>
                </li>
              </ul>
              <Button 
                asChild
                className="w-full bg-[#3A3B3D] hover:bg-[#4A4B4D] text-white h-12 rounded-xl mt-4 min-h-[44px]"
              >
                <Link href="/login">Get Started Free</Link>
              </Button>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="w-full bg-[#1F2022] p-6 border-t border-[#3A3B3D]">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Most Popular</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Professional</h3>
                <p className="text-[#8A8E91] text-sm mt-1">For growing businesses</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">$9</span>
                <span className="text-[#8A8E91] text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">Unlimited Websites</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">50 GB Storage</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">AI Website Builder</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">Custom Domain</span>
              </li>
            </ul>
            <Button 
              asChild
              className="w-full bg-white hover:bg-white/90 text-[#18191B] h-12 rounded-xl font-semibold min-h-[44px]"
            >
              <Link href="/login">Upgrade to Pro</Link>
            </Button>
          </div>

          {/* Ultra Plan */}
          <div className="w-full bg-[#18191B] p-6 border-t border-[#3A3B3D]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Ultra</h3>
                <p className="text-[#8A8E91] text-sm mt-1">For enterprises</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">$29</span>
                <span className="text-[#8A8E91] text-sm">/mo</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">Everything in Pro</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">500 GB Storage</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">Priority Support</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-white/80 text-sm">Advanced Analytics</span>
              </li>
            </ul>
            <Button 
              asChild
              variant="outline"
              className="w-full border-[#3A3B3D] hover:bg-[#28292B] text-white h-12 rounded-xl min-h-[44px]"
            >
              <Link href="/login">Contact Sales</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full px-5 py-16">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Why Choose Sycord?</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#28292B] rounded-2xl p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Lightning Fast</h3>
              <p className="text-[#8A8E91] text-xs">Build in minutes</p>
            </div>
            <div className="bg-[#28292B] rounded-2xl p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-3">
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Global CDN</h3>
              <p className="text-[#8A8E91] text-xs">Fast everywhere</p>
            </div>
            <div className="bg-[#28292B] rounded-2xl p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">Secure</h3>
              <p className="text-[#8A8E91] text-xs">SSL included</p>
            </div>
            <div className="bg-[#28292B] rounded-2xl p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">AI Powered</h3>
              <p className="text-[#8A8E91] text-xs">Smart builder</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full px-5 py-12">
          <div className="bg-gradient-to-br from-[#28292B] to-[#1F2022] rounded-3xl p-8 text-center border border-[#3A3B3D]">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
            <p className="text-[#8A8E91] text-sm mb-6">Join thousands of creators building with Sycord</p>
            <Button 
              asChild
              className="bg-white hover:bg-white/90 text-[#18191B] h-12 px-8 rounded-xl font-semibold min-h-[44px]"
            >
              <Link href="/login">Start Building Free</Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full px-5 py-10 border-t border-[#28292B]">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="Sycord Logo" width={20} height={20} className="opacity-90" />
              <span className="text-base font-semibold text-white tracking-tight">Sycord</span>
            </div>
            <p className="text-[#8A8E91] text-sm text-center max-w-[280px]">
              Create beautiful websites in minutes with AI-powered tools.
            </p>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="/subscriptions" className="text-[#8A8E91] text-sm hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/releases" className="text-[#8A8E91] text-sm hover:text-white transition-colors">Releases</Link></li>
                <li><Link href="/servers" className="text-[#8A8E91] text-sm hover:text-white transition-colors">Servers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/contact" className="text-[#8A8E91] text-sm hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-[#8A8E91] text-sm hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-[#8A8E91] text-sm hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <a href="#" className="w-11 h-11 flex items-center justify-center text-[#8A8E91] hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-11 h-11 flex items-center justify-center text-[#8A8E91] hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="w-11 h-11 flex items-center justify-center text-[#8A8E91] hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-[#6B6E71] text-xs">
              © 2026 Sycord. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
