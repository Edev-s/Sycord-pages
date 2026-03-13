"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#18191B] flex flex-col items-center overflow-x-hidden font-sans">
      {/* Header */}
      <header className="w-full max-w-7xl px-6 md:px-12 py-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={24} height={24} className="opacity-90" />
          <span className="text-xl font-medium text-white">Sycord</span>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/login" className="hidden md:block text-[15px] font-medium text-white hover:text-white/80 transition-colors">
            Bejelentkezés
          </Link>
          <Button asChild className="bg-white text-black hover:bg-white/90 text-[15px] font-medium px-6 h-10 rounded-md">
            <Link href="/login">Kezdés</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl px-6 md:px-12 flex-1 flex flex-col justify-center relative mt-16 md:mt-32 mb-16">
        <div className="flex flex-col md:flex-row items-center justify-between w-full relative h-[400px]">
          {/* Left Column */}
          <div className="flex-1 max-w-xl z-10 pt-4 absolute left-0 top-1/2 -translate-y-1/2">
            <h1 className="text-5xl md:text-[56px] leading-[1.1] tracking-tight mb-8">
              <span className="font-bold text-white block">Create <span className="text-[#8A8E91] font-medium">your</span></span>
              <span className="text-[#8A8E91] font-medium block">website <span className="font-bold text-white">under 5</span></span>
              <span className="font-bold text-white block">minute!</span>
            </h1>
            <Button className="bg-[#8A8E91] hover:bg-[#787C7F] text-white text-[15px] font-medium px-8 h-11 rounded-[12px] border-none">
              Get started
            </Button>
          </div>

          {/* Right Column - Phone Image (Absolutely positioned to overflow right edge) */}
          <div className="absolute top-1/2 -translate-y-[45%] right-[-15%] md:right-[-20%] lg:right-[-15%] w-[450px] h-[900px] md:w-[600px] md:h-[1200px] pointer-events-none z-0">
            <Image
              src="/phone-mockup.png"
              alt="Phone Mockup"
              fill
              className="object-contain object-right"
              priority
            />
          </div>
        </div>

        {/* Logos & Supporters Section */}
        <div className="flex flex-col items-center mt-64 md:mt-48 z-10 w-full max-w-3xl mx-auto pb-16">
          <div className="flex items-center justify-center gap-16 md:gap-24 w-full mb-6">
            <div className="flex items-center gap-2 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 16.42 4.868 20.166 8.839 21.503C9.339 21.594 9.52 21.288 9.52 21.025C9.52 20.79 9.512 20.165 9.507 19.336C6.726 19.938 6.139 17.994 6.139 17.994C5.684 16.84 5.03 16.533 5.03 16.533C4.126 15.915 5.099 15.928 5.099 15.928C6.1 16.001 6.626 16.96 6.626 16.96C7.514 18.483 8.956 18.043 9.543 17.789C9.633 17.127 9.898 16.688 10.194 16.44C7.973 16.188 5.638 15.332 5.638 11.478C5.638 10.378 6.031 9.479 6.674 8.784C6.57 8.532 6.224 7.508 6.772 6.111C6.772 6.111 7.616 5.842 9.49 7.109C10.293 6.886 11.152 6.775 12.002 6.771C12.852 6.775 13.711 6.886 14.515 7.109C16.388 5.842 17.23 6.111 17.23 6.111C17.78 7.508 17.435 8.532 17.331 8.784C17.975 9.479 18.366 10.378 18.366 11.478C18.366 15.344 16.027 16.185 13.801 16.432C14.169 16.748 14.498 17.371 14.498 18.324C14.498 19.689 14.485 20.79 14.485 21.025C14.485 21.29 14.664 21.6 15.17 21.501C19.135 20.163 22 16.418 22 12C22 6.477 17.523 2 12 2Z" fill="white"/>
              </svg>
              <span className="text-xl font-semibold tracking-tight">GitHub</span>
            </div>

            {/* Cloudflare logo solid fill */}
            <div className="flex items-center justify-center text-white">
              <svg width="48" height="32" viewBox="0 0 64 42" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.95 11.41C42.84 5.01 37.3 0 30.63 0C25.4 0 20.89 3.09 18.66 7.64C18.12 7.55 17.57 7.5 17 7.5C10.65 7.5 5.5 12.65 5.5 19C5.5 19.33 5.52 19.65 5.54 19.98C2.33 21.6 0.13 24.96 0.13 28.84C0.13 34.45 4.68 39 10.29 39H43.71C49.23 39 53.71 34.52 53.71 29C53.71 23.86 49.83 19.6 44.86 19.06C45.33 17.9 45.62 16.65 45.62 15.34C45.62 13.94 45.02 12.59 43.95 11.41Z" fill="white" />
                <path d="M62.08 26.15C60.85 22.09 57.07 19.12 52.6 19.12C52.12 19.12 51.65 19.16 51.2 19.24C50.22 17.98 48.97 16.94 47.53 16.2C49.33 17.7 50.7 19.66 51.48 21.91C51.52 22 51.57 22.1 51.6 22.19C52.07 23.47 52.33 24.84 52.33 26.26C52.33 32.12 47.8 36.93 42 37.37H54C59.52 37.37 64 32.89 64 27.37C64 26.96 63.97 26.55 63.91 26.15H62.08Z" fill="white" />
              </svg>
            </div>

            <div className="flex items-center text-white">
               {/* Google G logo solid white */}
               <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.27C21.35 18.42 22.56 15.6 22.56 12.25Z" fill="white" />
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.71 16.7 5.84 14.1H2.18V16.94C3.99 20.53 7.7 23 12 23Z" fill="white" />
                  <path d="M5.84 14.1C5.62 13.44 5.49 12.74 5.49 12C5.49 11.26 5.62 10.56 5.84 9.9V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.1Z" fill="white" />
                  <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z" fill="white" />
               </svg>
               <span className="text-[20px] font-medium tracking-tight ml-2">Google</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#252527] px-4 py-1.5 rounded-full border border-white/5 shadow-sm mt-4">
            <span className="text-[13px] text-[#8A8E91]">Corporate Supporters:</span>
            <Info className="w-3.5 h-3.5 text-[#8A8E91]" />
          </div>

          <div className="flex items-center gap-2 mt-16 mb-8">
            <div className="w-8 h-[6px] bg-[#8A8E91] rounded-full"></div>
            <div className="w-[6px] h-[6px] bg-[#323335] rounded-full"></div>
            <div className="w-[6px] h-[6px] bg-[#323335] rounded-full"></div>
            <div className="w-[6px] h-[6px] bg-[#323335] rounded-full"></div>
          </div>

                    {/* Pricing Card Section */}
          <div className="w-full bg-[#323335] rounded-t-[40px] p-8 md:p-12 h-[220px] shadow-2xl relative overflow-hidden flex flex-col justify-start">
             <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rotate-45 bg-[#8A8E91] rounded-lg flex-shrink-0"></div>
                  <span className="text-4xl md:text-[40px] font-bold text-[#8A8E91] tracking-tight ml-2">Free</span>
                </div>
                <div className="w-[140px] h-[50px] md:w-[320px] md:h-[80px] bg-[#464749] rounded-2xl md:rounded-3xl"></div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
