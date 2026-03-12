"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Info, Github } from "lucide-react"

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
          <Link href="/login" className="text-[15px] font-medium text-white hover:text-white/80 transition-colors">
            Bejelentkezés
          </Link>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-white/90 text-[15px] font-medium px-6 h-10 rounded-md">
              Kezdés
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl px-6 md:px-12 flex-1 flex flex-col justify-center relative mt-16 md:mt-32">
        <div className="flex flex-col md:flex-row items-center justify-between w-full">
          {/* Left Column */}
          <div className="flex-1 max-w-xl z-10 pt-4">
            <h1 className="text-5xl md:text-[56px] leading-[1.1] tracking-tight mb-8">
              <span className="font-bold text-white block">Create <span className="text-[#8A8E91] font-medium">your</span></span>
              <span className="text-[#8A8E91] font-medium block">website <span className="font-bold text-white">under 5</span></span>
              <span className="font-bold text-white block">minute!</span>
            </h1>
            <Button className="bg-[#8A8E91] hover:bg-[#787C7F] text-white text-[15px] font-medium px-8 h-11 rounded-[12px] border-none">
              Get started
            </Button>
          </div>

          {/* Right Column - Phone Image */}
          <div className="flex-1 mt-16 md:mt-0 relative w-full flex justify-end">
            <div className="relative w-[300px] h-[600px] md:w-[450px] md:h-[900px] md:-mr-32 xl:-mr-48 translate-y-20">
              <Image
                src="/phone-mockup.png"
                alt="Phone Mockup"
                fill
                className="object-contain object-right"
                priority
              />
            </div>
          </div>
        </div>

        {/* Logos & Supporters Section */}
        <div className="flex flex-col items-center mt-32 z-10 w-full max-w-3xl mx-auto pb-16">
          <div className="flex items-center justify-center gap-16 md:gap-24 w-full mb-6">
            <div className="flex items-center gap-2 text-white">
              <Github className="w-[22px] h-[22px]" fill="currentColor" />
              <span className="text-lg font-semibold tracking-tight">GitHub</span>
            </div>

            {/* Custom Cloud Icon based on original design */}
            <div className="flex items-center justify-center text-white">
              <svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.8333 25.5H29.1667C34.6895 25.5 39.1667 21.0228 39.1667 15.5C39.1667 10.3344 35.2536 6.08253 30.2227 5.54921C28.8927 2.10301 25.5683 -0.5 21.6667 -0.5C16.8123 -0.5 12.6987 2.92484 11.839 7.42672C11.5126 7.37059 11.1764 7.33333 10.8333 7.33333C4.85025 7.33333 -0.000101566 12.1837 -0.000101566 18.1667C-0.000101566 23.6394 4.05315 28.1667 9.16656 28.1667" fill="white"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M10.8333 26H29.1667C34.9656 26 39.6667 21.2989 39.6667 15.5C39.6667 10.0573 35.5186 5.58611 30.2443 5.05051C28.8596 1.45508 25.5113 -1 21.6667 -1C16.5982 -1 12.3533 2.65179 11.3789 7.36836C11.1983 7.345 11.0166 7.33333 10.8333 7.33333C4.57344 7.33333 -0.500102 12.4068 -0.500102 18.6667C-0.500102 24.3976 3.76632 29.1337 9.16656 29.1337C10.0886 29.1337 10.8333 28.389 10.8333 27.467C10.8333 26.545 10.0886 25.8003 9.16656 25.8003C5.60682 25.8003 2.83323 22.9255 2.83323 18.6667C2.83323 14.2484 6.41505 10.6667 10.8333 10.6667C11.667 10.6667 12.4334 10.8277 13.1118 11.1065C13.5937 11.3045 14.1611 11.054 14.3468 10.5638C15.0135 8.80492 16.5644 7.4267 18.4312 6.81232C20.4485 6.14838 22.7533 6.64166 24.3168 8.12571C24.6853 8.47549 25.2638 8.44112 25.5878 8.04944C26.7909 6.59567 28.6625 5.66667 30.8333 5.66667C34.5152 5.66667 37.5 8.65144 37.5 12.3333C37.5 15.6568 35.068 18.4116 31.8333 18.9135C31.3005 18.9961 30.8333 19.4921 30.8333 20.0326C30.8333 20.5849 31.2811 21.0326 31.8333 21.0326C36.4357 21.0326 40.1667 17.3017 40.1667 12.6993C40.1667 8.3686 36.8488 4.81439 32.6105 4.3946C31.0601 0.778007 27.562 -1.5 23.3333 -1.5C18.0035 -1.5 13.5042 2.3732 12.1843 7.41113C11.7454 7.35954 11.294 7.33333 10.8333 7.33333C4.29744 7.33333 -1.0001 12.6309 -1.0001 19.1667C-1.0001 25.3283 3.69342 30.4079 9.66656 30.8066V30.8066C10.0469 30.8315 10.3333 30.5407 10.3333 30.1604V26H10.8333Z" fill="#18191B"/>
              </svg>
            </div>

            <div className="flex items-center text-white">
               <span className="text-[20px] font-medium tracking-tight">Google</span>
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
          <div className="w-full max-w-[500px] bg-[#252527] border-t border-x border-white/5 rounded-t-[32px] p-8 pb-32 mb-0 shadow-xl relative overflow-hidden">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 rotate-45 bg-[#8A8E91] rounded-sm flex-shrink-0"></div>
                  <span className="text-2xl font-semibold text-[#8A8E91]">Free</span>
                </div>
                <div className="w-[140px] h-9 bg-[#323335] rounded-[10px]"></div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
