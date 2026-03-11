"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Info, Tag } from "lucide-react"

// Corporate supporter logos as SVG components
function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 98 96" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
    </svg>
  )
}

function CloudflareLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 40" fill="currentColor">
      <path d="M54.8 17.6c-.3-1-1.1-1.6-2.1-1.6h-2.5l-.2-.4c-.5-1.5-1.8-2.6-3.5-2.6h-7.7c-1.7 0-3 1.1-3.5 2.6l-.2.4h-2.5c-1 0-1.8.6-2.1 1.6l-.4 1.6h25.1l-.4-1.6zm2.6 3.2H22.6l-.6 2.4c-.2.8.3 1.4 1.1 1.4h33.8c.8 0 1.5-.6 1.1-1.4l-.6-2.4z"/>
    </svg>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 272 92" fill="currentColor">
      <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
      <path d="M225 3v65h-9.5V3h9.5z"/>
      <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
      <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
    </svg>
  )
}

function VercelLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 76 65" fill="currentColor">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/>
    </svg>
  )
}

function AWSLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 60" fill="currentColor">
      <path d="M27.8 36.6c0 1.3.1 2.3.4 3.1.2.8.6 1.6 1 2.5.2.3.2.6.2.8 0 .3-.2.7-.6 1l-2 1.3c-.3.2-.6.3-.8.3-.3 0-.7-.2-1-.5-.5-.5-.9-1.1-1.2-1.7-.3-.6-.7-1.3-1.1-2.1-2.8 3.3-6.3 4.9-10.5 4.9-3 0-5.4-.9-7.2-2.6-1.8-1.7-2.7-4-2.7-6.9 0-3.1 1.1-5.5 3.3-7.4 2.2-1.9 5.1-2.8 8.8-2.8 1.2 0 2.5.1 3.8.3 1.3.2 2.7.5 4.1.8v-2.6c0-2.7-.6-4.6-1.7-5.7-1.1-1.1-3.1-1.6-5.8-1.6-1.2 0-2.5.2-3.9.5-1.3.3-2.6.8-3.9 1.3-.6.3-1 .4-1.2.5-.2.1-.4.1-.5.1-.5 0-.7-.3-.7-1v-1.5c0-.5.1-.9.2-1.1.2-.2.5-.5 1-.7 1.2-.6 2.7-1.2 4.5-1.6 1.7-.5 3.6-.7 5.5-.7 4.2 0 7.3 1 9.2 2.9 1.9 1.9 2.9 4.9 2.9 8.8v11.6zm-14.5 5.4c1.2 0 2.4-.2 3.7-.6 1.3-.4 2.5-1.2 3.5-2.2.6-.7 1.1-1.5 1.3-2.4.2-.9.4-2 .4-3.3v-1.6c-1-.3-2.1-.5-3.2-.6-1.1-.2-2.2-.2-3.3-.2-2.4 0-4.2.5-5.4 1.4-1.2 1-1.8 2.4-1.8 4.2 0 1.7.4 3 1.3 3.8.9.9 2.1 1.5 3.5 1.5zm28.6 3.7c-.6 0-1-.1-1.3-.3-.3-.2-.5-.6-.7-1.2L31.4 17c-.2-.6-.3-1-.3-1.2 0-.5.2-.8.8-.8h3.1c.6 0 1.1.1 1.3.3.3.2.5.6.7 1.2l6 23.6 5.6-23.6c.2-.6.4-1 .7-1.2.3-.2.8-.3 1.4-.3h2.5c.6 0 1.1.1 1.4.3.3.2.5.6.7 1.2l5.6 23.9 6.2-23.9c.2-.6.4-1 .7-1.2.3-.2.7-.3 1.3-.3h2.9c.5 0 .8.3.8.8 0 .2 0 .3-.1.5 0 .2-.1.4-.2.7l-8.6 27.2c-.2.6-.4 1-.7 1.2-.3.2-.8.3-1.3.3h-2.7c-.6 0-1.1-.1-1.4-.3-.3-.2-.5-.6-.7-1.2l-5.5-23-5.5 23c-.2.6-.4 1-.7 1.2-.3.2-.8.3-1.4.3h-2.7zm45.8 1c-1.9 0-3.7-.2-5.5-.7-1.8-.5-3.2-1-4.2-1.6-.6-.4-1-.8-1.1-1.1-.1-.4-.2-.7-.2-1.1v-1.6c0-.7.3-1 .8-1 .2 0 .4 0 .6.1.2.1.5.2.8.4 1.1.5 2.4.9 3.7 1.2 1.4.3 2.7.4 4.1.4 2.2 0 3.9-.4 5.1-1.1 1.2-.7 1.8-1.8 1.8-3.2 0-.9-.3-1.7-.9-2.4-.6-.6-1.7-1.2-3.3-1.7l-4.8-1.5c-2.4-.7-4.2-1.8-5.3-3.2-1.1-1.4-1.7-3-1.7-4.7 0-1.4.3-2.6.9-3.6.6-1 1.4-1.9 2.4-2.6 1-.7 2.1-1.2 3.5-1.6 1.3-.4 2.7-.5 4.2-.5.7 0 1.5 0 2.2.1.8.1 1.5.2 2.2.4.7.1 1.3.3 1.9.5.6.2 1.1.4 1.4.6.5.3.8.5 1 .8.2.3.3.6.3 1.1v1.5c0 .7-.3 1-.8 1-.3 0-.7-.1-1.3-.4-2-1-4.2-1.4-6.7-1.4-2 0-3.5.3-4.6 1-1.1.7-1.6 1.7-1.6 3.1 0 1 .3 1.8 1 2.5.7.7 1.9 1.3 3.6 1.9l4.7 1.5c2.4.7 4.1 1.8 5.1 3.1 1 1.3 1.5 2.9 1.5 4.6 0 1.4-.3 2.7-.9 3.8-.6 1.1-1.4 2.1-2.4 2.9-1 .8-2.3 1.4-3.7 1.8-1.6.5-3.2.7-5 .7z"/>
    </svg>
  )
}

function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" fill="currentColor">
      <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/>
    </svg>
  )
}

// Supporter icons marquee component
function SupporterMarquee() {
  const supporters = [
    { name: "GitHub", logo: GitHubLogo },
    { name: "Cloudflare", logo: CloudflareLogo },
    { name: "Google", logo: GoogleLogo },
    { name: "Vercel", logo: VercelLogo },
    { name: "AWS", logo: AWSLogo },
    { name: "Microsoft", logo: MicrosoftLogo },
  ]

  return (
    <div className="relative overflow-hidden py-4">
      <div className="flex animate-marquee">
        {[...supporters, ...supporters, ...supporters].map((supporter, index) => (
          <div
            key={`${supporter.name}-${index}`}
            className="flex items-center justify-center mx-8 min-w-[120px]"
          >
            <supporter.logo className="h-6 w-auto text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Pricing plans data
const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started",
    features: [
      "1 website",
      "Basic AI generation",
      "Sycord subdomain",
      "Community support",
      "Basic analytics",
    ],
    buttonText: "Get started",
    buttonVariant: "secondary" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "9",
    description: "For growing businesses",
    features: [
      "5 websites",
      "Advanced AI generation",
      "Custom domain",
      "Priority support",
      "Advanced analytics",
      "Remove Sycord branding",
    ],
    buttonText: "Start free trial",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Business",
    price: "29",
    description: "For teams and agencies",
    features: [
      "Unlimited websites",
      "Premium AI generation",
      "Multiple custom domains",
      "24/7 dedicated support",
      "Full analytics suite",
      "White-label option",
      "API access",
    ],
    buttonText: "Contact sales",
    buttonVariant: "secondary" as const,
    popular: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} />
            <span className="text-lg font-semibold text-foreground">Sycord</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground text-sm">
                Bejelentkezes
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-white text-black hover:bg-white/90 text-sm rounded-full px-5">
                Kezdes
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-8 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left content */}
            <div className="flex-1 text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
                <span className="text-foreground">Create </span>
                <span className="text-muted-foreground">your website </span>
                <span className="text-foreground">under 5 minute!</span>
              </h1>
              
              <Link href="/login">
                <Button 
                  className="bg-[#3a3a3c] hover:bg-[#4a4a4c] text-white text-base px-8 py-6 rounded-full font-medium"
                >
                  Get started
                </Button>
              </Link>
            </div>

            {/* Right content - iPhone mockup */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative w-[280px] md:w-[350px] lg:w-[400px]">
                <Image
                  src="/iphone-mockup.jpg"
                  alt="iPhone showing Sycord app"
                  width={400}
                  height={500}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Supporters Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <SupporterMarquee />
          
          <div className="flex justify-center mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2a2c] text-sm text-muted-foreground">
              <span>Corporate Supporters:</span>
              <Info className="h-4 w-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Page indicator dots */}
      <div className="flex justify-center gap-2 py-6">
        <div className="w-8 h-2 rounded-full bg-muted-foreground/40"></div>
        <div className="w-2 h-2 rounded-full bg-muted-foreground/20"></div>
        <div className="w-2 h-2 rounded-full bg-muted-foreground/20"></div>
        <div className="w-2 h-2 rounded-full bg-muted-foreground/20"></div>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative mb-4 rounded-2xl border ${
                  plan.popular 
                    ? "border-white/20 bg-[#1c1c1e]" 
                    : "border-border bg-[#1c1c1e]"
                } overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 text-xs font-medium bg-white text-black rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        plan.popular ? "bg-white/10" : "bg-muted"
                      }`}>
                        <Tag className={`h-5 w-5 ${
                          plan.popular ? "text-white" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant={plan.buttonVariant}
                      className={`rounded-full px-6 ${
                        plan.buttonVariant === "default" 
                          ? "bg-white text-black hover:bg-white/90" 
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={24} height={24} />
              <span className="text-sm text-muted-foreground">2024 Sycord. Minden jog fenntartva.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Twitter
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                GitHub
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Discord
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
