"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Info, Check, Zap, Globe, Shield, Sparkles, ArrowRight, Layers, MousePointerClick } from "lucide-react"

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
          className="bg-white text-[#18191B] hover:bg-white/90 text-xs md:text-sm font-semibold px-5 md:px-7 h-9 md:h-11 rounded-full min-h-[44px]"
        >
          <Link href="/login">Kezdés</Link>
        </Button>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col">
        
        {/* Hero Section */}
        <section className="w-full px-4 md:px-8 pt-8 md:pt-16 pb-8 md:pb-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
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
              <p className="text-sm md:text-base text-[#8A8E91] mb-6 md:mb-8 max-w-md">
                Build stunning websites with AI-powered tools. No coding skills required. Start your free website today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
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
        </section>

        {/* Features Section */}
        <section className="w-full px-4 md:px-8 py-8 md:py-16 relative">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl md:text-3xl font-bold text-white text-center mb-4 md:mb-2">Why Choose Sycord?</h2>
            <p className="text-sm md:text-base text-[#8A8E91] text-center mb-10 md:mb-12 max-w-xl mx-auto">
              Everything you need to build and launch your website in minutes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-[#252527] rounded-2xl p-5 md:p-6 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-11 h-11 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base mb-2">Lightning Fast</h3>
                <p className="text-[#8A8E91] text-xs md:text-sm">Build your website in under 5 minutes with our AI-powered builder</p>
              </div>
              
              <div className="bg-[#252527] rounded-2xl p-5 md:p-6 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-11 h-11 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base mb-2">Global CDN</h3>
                <p className="text-[#8A8E91] text-xs md:text-sm">Your website loads fast everywhere with our global content delivery</p>
              </div>
              
              <div className="bg-[#252527] rounded-2xl p-5 md:p-6 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-11 h-11 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base mb-2">Enterprise Secure</h3>
                <p className="text-[#8A8E91] text-xs md:text-sm">SSL certificates and enterprise-grade security included by default</p>
              </div>
              
              <div className="bg-[#252527] rounded-2xl p-5 md:p-6 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base mb-2">AI Powered</h3>
                <p className="text-[#8A8E91] text-xs md:text-sm">Intelligent recommendations to help you create better websites</p>
              </div>
              
              <div className="bg-[#252527] rounded-2xl p-5 md:p-6 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-11 h-11 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <MousePointerClick className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base mb-2">No Code Required</h3>
                <p className="text-[#8A8E91] text-xs md:text-sm">Drag and drop interface makes it easy for anyone to build</p>
              </div>
              
              <div className="bg-[#252527] rounded-2xl p-5 md:p-6 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-11 h-11 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5 text-cyan-500" />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base mb-2">Easy Migration</h3>
                <p className="text-[#8A8E91] text-xs md:text-sm">Seamlessly migrate from other platforms to Sycord</p>
              </div>
            </div>
          </div>
        </section>

        {/* Corporate Supporters Section */}
        <section className="w-full py-10 md:py-16 border-t border-b border-white/5 bg-[#1F1F21]">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <p className="text-center text-[#8A8E91] text-xs md:text-sm font-medium mb-8">Trusted by leading companies</p>
            
            {/* Desktop Layout - Static Grid */}
            <div className="hidden md:grid grid-cols-5 gap-6 items-center justify-center mb-4">
              <div className="flex items-center gap-2 justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
                </svg>
                <span className="text-white text-sm font-medium">GitHub</span>
              </div>
              
              <div className="flex items-center justify-center">
                <svg width="36" height="24" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
                </svg>
              </div>
              
              <div className="flex items-center justify-center">
                <span className="text-white text-lg font-bold">Google</span>
              </div>
              
              <div className="flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM17.57 8.15L15.77 16.77C15.64 17.37 15.27 17.52 14.77 17.24L11.77 15.06L10.32 16.44C10.17 16.59 10.05 16.71 9.77 16.71L9.97 13.63L15.42 8.73C15.67 8.51 15.37 8.38 15.04 8.60L8.32 12.85L5.37 11.92C4.77 11.73 4.76 11.31 5.49 11.03L16.81 6.90C17.31 6.72 17.75 7.04 17.57 8.15Z" fill="white"/>
                </svg>
              </div>
              
              <div className="flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/>
                </svg>
              </div>
            </div>

            {/* Mobile Layout - Scrollable Marquee */}
            <div className="md:hidden overflow-x-auto scrollbar-hide">
              <div className="flex animate-marquee gap-8 px-4">
                {/* First set */}
                <div className="flex items-center gap-8 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
                    </svg>
                    <span className="text-white text-xs font-medium">GitHub</span>
                  </div>
                  
                  <svg width="32" height="20" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
                  </svg>
                  
                  <span className="text-white font-bold text-sm">Google</span>
                  
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM17.57 8.15L15.77 16.77C15.64 17.37 15.27 17.52 14.77 17.24L11.77 15.06L10.32 16.44C10.17 16.59 10.05 16.71 9.77 16.71L9.97 13.63L15.42 8.73C15.67 8.51 15.37 8.38 15.04 8.60L8.32 12.85L5.37 11.92C4.77 11.73 4.76 11.31 5.49 11.03L16.81 6.90C17.31 6.72 17.75 7.04 17.57 8.15Z" fill="white"/>
                  </svg>
                  
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/>
                  </svg>
                </div>
                
                {/* Duplicate for seamless loop */}
                <div className="flex items-center gap-8 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
                    </svg>
                    <span className="text-white text-xs font-medium">GitHub</span>
                  </div>
                  
                  <svg width="32" height="20" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
                  </svg>
                  
                  <span className="text-white font-bold text-sm">Google</span>
                  
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM17.57 8.15L15.77 16.77C15.64 17.37 15.27 17.52 14.77 17.24L11.77 15.06L10.32 16.44C10.17 16.59 10.05 16.71 9.77 16.71L9.97 13.63L15.42 8.73C15.67 8.51 15.37 8.38 15.04 8.60L8.32 12.85L5.37 11.92C4.77 11.73 4.76 11.31 5.49 11.03L16.81 6.90C17.31 6.72 17.75 7.04 17.57 8.15Z" fill="white"/>
                  </svg>
                  
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full px-4 md:px-8 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-white text-center mb-3">Simple, Transparent Pricing</h2>
            <p className="text-sm md:text-base text-[#8A8E91] text-center mb-10 md:mb-12 max-w-xl mx-auto">
              Choose the perfect plan for your needs. Always flexible to scale as you grow.
            </p>
            
            {/* Desktop Layout - 3 Column Grid */}
            <div className="hidden md:grid grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-[#1F2022] rounded-2xl p-8 border border-white/5 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                </div>
                <h3 className="text-2xl font-bold text-[#6B6E71] mb-2">Free</h3>
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

              {/* Pro Plan - Featured */}
              <div className="bg-[#18191B] rounded-2xl p-8 border-2 border-yellow-500/40 flex flex-col relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1">
                  <span className="text-yellow-500 text-xs font-semibold">Most Popular</span>
                </div>
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
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

              {/* Ultra Plan */}
              <div className="bg-[#1F2022] rounded-2xl p-8 border border-white/5 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ultra</h3>
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
                  <Link href="/login">Contact Sales</Link>
                </Button>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-white/80 text-sm">Everything in Pro</span>
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
                {/* Free Plan */}
                <div className="w-72 bg-[#1F2022] rounded-2xl p-5 flex-shrink-0 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                  </div>
                  <h3 className="text-xl font-bold text-[#6B6E71] mb-1">Free</h3>
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

                {/* Pro Plan */}
                <div className="w-72 bg-[#18191B] rounded-2xl p-5 flex-shrink-0 border-2 border-yellow-500/40">
                  <div className="flex items-center gap-1 mb-3">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-[9px] font-semibold text-yellow-500">Popular</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
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

                {/* Ultra Plan */}
                <div className="w-72 bg-[#1F2022] rounded-2xl p-5 flex-shrink-0 border border-white/5">
                  <div className="flex items-center gap-1 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Ultra</h3>
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
                    <Link href="/login">Contact</Link>
                  </Button>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-white/80 text-xs">Everything in Pro</span>
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
        </section>

        {/* CTA Section */}
        <section className="w-full px-4 md:px-8 py-12 md:py-16">
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
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-[#1F1F21] mt-8 md:mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8">
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Features</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Security</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">About</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Terms</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Cookies</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold text-sm mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Twitter</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">GitHub</Link></li>
                <li><Link href="#" className="text-[#8A8E91] hover:text-white text-xs md:text-sm transition-colors">Discord</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Sycord Logo" width={20} height={20} className="opacity-90" />
              <span className="text-white font-semibold text-xs md:text-sm">Sycord © 2024. All rights reserved.</span>
            </div>
            <span className="text-[#8A8E91] text-xs">Made with care for creators and businesses</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
