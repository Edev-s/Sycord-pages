"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Info, Check, Zap, Globe, Shield, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#18191B] flex flex-col items-center overflow-x-hidden font-sans">
      {/* Header */}
      <header className="w-full px-4 py-6 flex items-center justify-between z-20 sticky top-0 bg-[#18191B]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Sycord Logo" width={28} height={28} className="opacity-90" />
          <span className="text-lg font-bold text-white tracking-tight">Sycord</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[#8A8E91] text-sm font-medium hover:text-white transition">Bejelentkezés</Link>
          <Button 
            asChild 
            className="bg-white text-[#18191B] hover:bg-white/90 text-sm font-semibold px-5 h-11 rounded-lg min-h-[44px]"
          >
            <Link href="/login">Kezdés</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full flex-1 flex flex-col">
        <section className="w-full px-5 pt-10 pb-10 relative min-h-[560px] overflow-hidden">
          {/* Text Content and Get started button */}
          <div className="relative z-10">
            <h1 className="text-[36px] font-bold leading-[1.15] tracking-tight">
              <span className="text-white">Create </span>
              <span className="text-[#8A8E91]">your</span>
              <br />
              <span className="text-[#8A8E91]">website </span>
              <span className="text-white">under 5</span>
              <br />
              <span className="text-white">minute!</span>
            </h1>
            <div className="mt-8">
              <Button 
                asChild
                className="bg-[#6B6E71] hover:bg-[#5A5D60] text-white text-[14px] font-medium px-6 h-11 rounded-xl min-w-[44px] min-h-[44px]"
              >
                <Link href="/login">Get started</Link>
              </Button>
            </div>
          </div>

          {/* Phone Mockup – right side, preserving the source image's 1:2.17 aspect ratio
              (phone-mockup.png: 1179×2556 px).

              Layout maths (for typical ~390 px mobile viewport):
              • Container 320×750 px with objectPosition:'left top'.
              • Because container h/w (2.34) > image h/w (2.17), the image is
                WIDTH-LIMITED: rendered at 320×694 inside the 320×750 container
                (56 px blank at the bottom).
              • The PNG has a dark-background region covering the top ~31.8 % of
                the image (rendered top 220 px) that blends with the page colour.
                Shifting the container 190 px above the section top (-top-[190px])
                and letting overflow-hidden clip it causes the visible metallic rim
                to appear from ~section y=30 (upper-right of the hero).
              • Right offset 145 px = container width (320) − target visible width
                (~175 px ≈ 45 % of viewport), keeping the right portion off-screen. */}
          <div 
            className="absolute -top-[190px] -right-[145px] w-[320px] h-[750px] pointer-events-none z-0"
          >
            <Image
              src="/phone-mockup.png"
              alt="Phone Mockup"
              fill
              className="object-contain"
              style={{ objectPosition: 'left top' }}
              priority
            />
          </div>
        </section>

        {/* Corporate Supporters - Infinite Scroll Marquee */}
        <section className="w-full pt-10 pb-6 overflow-hidden">
          <div className="relative">
            {/* Marquee Container */}
            <div className="flex animate-marquee">
              {/* First set of logos */}
              <div className="flex items-center gap-16 px-8 flex-shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
                  </svg>
                  <span className="text-[15px] font-semibold tracking-tight">GitHub</span>
                </div>
                <div className="flex items-center justify-center text-white">
                  <svg width="44" height="28" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
                  </svg>
                </div>
                <div className="flex items-center text-white">
                  <span className="text-[18px] font-bold tracking-tight">Google</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM17.57 8.15L15.77 16.77C15.64 17.37 15.27 17.52 14.77 17.24L11.77 15.06L10.32 16.44C10.17 16.59 10.05 16.71 9.77 16.71L9.97 13.63L15.42 8.73C15.67 8.51 15.37 8.38 15.04 8.60L8.32 12.85L5.37 11.92C4.77 11.73 4.76 11.31 5.49 11.03L16.81 6.90C17.31 6.72 17.75 7.04 17.57 8.15Z" fill="white"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/>
                  </svg>
                </div>
              </div>
              {/* Duplicate for seamless loop */}
              <div className="flex items-center gap-16 px-8 flex-shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
                  </svg>
                  <span className="text-[15px] font-semibold tracking-tight">GitHub</span>
                </div>
                <div className="flex items-center justify-center text-white">
                  <svg width="44" height="28" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
                  </svg>
                </div>
                <div className="flex items-center text-white">
                  <span className="text-[18px] font-bold tracking-tight">Google</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12C0 18.63 5.37 24 12 24C18.63 24 24 18.63 24 12C24 5.37 18.63 0 12 0ZM17.57 8.15L15.77 16.77C15.64 17.37 15.27 17.52 14.77 17.24L11.77 15.06L10.32 16.44C10.17 16.59 10.05 16.71 9.77 16.71L9.97 13.63L15.42 8.73C15.67 8.51 15.37 8.38 15.04 8.60L8.32 12.85L5.37 11.92C4.77 11.73 4.76 11.31 5.49 11.03L16.81 6.90C17.31 6.72 17.75 7.04 17.57 8.15Z" fill="white"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Corporate Supporters Badge */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2 bg-[#252527] px-4 py-2 rounded-full border border-white/5">
              <span className="text-[11px] text-[#8A8E91] font-medium">Corporate Supporters:</span>
              <Info className="w-3 h-3 text-[#8A8E91]" />
            </div>
          </div>
        </section>

        {/* Pagination Dots */}
        <section className="w-full flex justify-center py-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1.5 bg-[#8A8E91] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#3A3B3D] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#3A3B3D] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#3A3B3D] rounded-full"></div>
          </div>
        </section>

        {/* Pricing Cards - Horizontal Scroll */}
        <section className="w-full overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-4 px-4 w-max">
            {/* Free Plan */}
            <div className="w-[280px] bg-[#28292B] rounded-[24px] p-5 flex-shrink-0">
              <div className="flex items-center gap-1.5 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
                <div className="w-2 h-2 rounded-full bg-[#3A3B3D]"></div>
              </div>
              <span className="text-[24px] font-bold text-[#6B6E71] block mb-4">Free</span>
              <p className="text-[#8A8E91] text-xs mb-4">Perfect for getting started</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#6B6E71]" />
                  <span className="text-white/80 text-xs">1 Website</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#6B6E71]" />
                  <span className="text-white/80 text-xs">1 GB Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#6B6E71]" />
                  <span className="text-white/80 text-xs">Basic Templates</span>
                </li>
              </ul>
              <Button 
                asChild
                className="w-full bg-[#3A3B3D] hover:bg-[#4A4B4D] text-white h-10 rounded-xl text-sm min-h-[44px]"
              >
                <Link href="/login">Get Started</Link>
              </Button>
            </div>

            {/* Professional Plan */}
            <div className="w-[280px] bg-[#1F2022] rounded-[24px] p-5 flex-shrink-0 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-[10px] font-semibold text-yellow-500 uppercase tracking-wider">Popular</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[24px] font-bold text-white">Pro</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-white">$9</span>
                  <span className="text-[#8A8E91] text-xs">/mo</span>
                </div>
              </div>
              <p className="text-[#8A8E91] text-xs mb-4">For growing businesses</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-white/80 text-xs">Unlimited Sites</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-white/80 text-xs">50 GB Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-white/80 text-xs">AI Builder</span>
                </li>
              </ul>
              <Button 
                asChild
                className="w-full bg-white hover:bg-white/90 text-[#18191B] h-10 rounded-xl text-sm font-semibold min-h-[44px]"
              >
                <Link href="/login">Upgrade</Link>
              </Button>
            </div>

            {/* Ultra Plan */}
            <div className="w-[280px] bg-[#18191B] rounded-[24px] p-5 flex-shrink-0 border border-[#3A3B3D]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[24px] font-bold text-white">Ultra</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-white">$29</span>
                  <span className="text-[#8A8E91] text-xs">/mo</span>
                </div>
              </div>
              <p className="text-[#8A8E91] text-xs mb-4">For enterprises</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-white/80 text-xs">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-white/80 text-xs">500 GB Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-white/80 text-xs">Priority Support</span>
                </li>
              </ul>
              <Button 
                asChild
                variant="outline"
                className="w-full border-[#3A3B3D] hover:bg-[#28292B] text-white h-10 rounded-xl text-sm min-h-[44px]"
              >
                <Link href="/login">Contact</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full px-4 py-8">
          <h2 className="text-lg font-bold text-white text-center mb-6">Why Choose Sycord?</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#28292B] rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-white font-semibold text-xs mb-0.5">Lightning Fast</h3>
              <p className="text-[#8A8E91] text-[10px]">Build in minutes</p>
            </div>
            <div className="bg-[#28292B] rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-2">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-white font-semibold text-xs mb-0.5">Global CDN</h3>
              <p className="text-[#8A8E91] text-[10px]">Fast everywhere</p>
            </div>
            <div className="bg-[#28292B] rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-white font-semibold text-xs mb-0.5">Secure</h3>
              <p className="text-[#8A8E91] text-[10px]">Enterprise-grade</p>
            </div>
            <div className="bg-[#28292B] rounded-2xl p-4 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-[#3A3B3D] rounded-xl flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-white font-semibold text-xs mb-0.5">AI Powered</h3>
              <p className="text-[#8A8E91] text-[10px]">Smart automation</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-white/5 mt-8 py-8 px-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Image src="/logo.png" alt="Sycord" width={20} height={20} />
              <span className="text-white font-bold">Sycord</span>
            </div>
            <div className="grid grid-cols-2 gap-6 text-sm mb-6">
              <div>
                <h4 className="text-white font-semibold mb-2">Product</h4>
                <ul className="space-y-1 text-[#8A8E91] text-xs">
                  <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                  <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-white transition">Templates</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Company</h4>
                <ul className="space-y-1 text-[#8A8E91] text-xs">
                  <li><Link href="#" className="hover:text-white transition">About</Link></li>
                  <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                  <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
                </ul>
              </div>
            </div>
            <div className="text-center border-t border-white/5 pt-4">
              <p className="text-[#8A8E91] text-xs">© 2024 Sycord. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
