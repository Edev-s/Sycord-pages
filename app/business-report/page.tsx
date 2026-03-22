"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const REPORT_DATE = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const plans = [
  {
    name: "Free",
    price: 0,
    currency: "USD",
    features: ["1 website", "Basic customisation", "Community support"],
  },
  {
    name: "Professional",
    price: 29,
    currency: "USD",
    features: [
      "5 websites",
      "Advanced customisation",
      "Email support",
      "Custom domain",
      "Analytics",
    ],
  },
  {
    name: "Ultra",
    price: 99,
    currency: "USD",
    features: [
      "Unlimited websites",
      "Full customisation",
      "24/7 priority support",
      "Custom domain",
      "Advanced analytics",
      "API access",
      "Team collaboration",
    ],
  },
]

export default function BusinessReportPage() {
  const reportRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => window.print()

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .report-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print sticky top-0 z-50 bg-[#18191B] border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sycord" width={24} height={24} className="opacity-90" />
          <span className="text-white font-bold text-sm">Sycord</span>
        </Link>
        <Button
          onClick={handlePrint}
          className="bg-white text-[#18191B] hover:bg-white/90 text-xs font-semibold px-5 h-8 rounded-full flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Download / Print
        </Button>
      </div>

      {/* Report document */}
      <div className="min-h-screen bg-[#F4F4F4] py-10 px-4 print:bg-white print:p-0">
        <div
          ref={reportRef}
          className="report-page max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden print:rounded-none print:shadow-none print:max-w-none"
        >
          {/* ── Document Header ── */}
          <header className="bg-[#18191B] px-10 py-8 flex items-center justify-between">
            <Link href="https://sycord.com" target="_blank" rel="noopener" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Sycord Logo" width={40} height={40} className="opacity-90" />
              <span className="text-white text-2xl font-bold tracking-tight">Sycord</span>
            </Link>
            <div className="text-right">
              <p className="text-white/60 text-xs uppercase tracking-widest">Business Activity Report</p>
              <p className="text-white/40 text-xs mt-1">{REPORT_DATE}</p>
            </div>
          </header>

          {/* ── Body ── */}
          <main className="px-10 py-10 text-[#1a1a1a] space-y-10">

            {/* 1. Identity */}
            <section>
              <SectionHeading number="1" title="Legal Identity" />
              <InfoRow label="Full Legal Name" value="Dávid Márton" />
              <InfoRow label="Business Name" value="Sycord" />
              <InfoRow label="Website" value="https://sycord.com" link="https://sycord.com" />
              <InfoRow label="Report Date" value={REPORT_DATE} />
            </section>

            <Divider />

            {/* 2. Business Overview */}
            <section>
              <SectionHeading number="2" title="Business Overview" />
              <p className="text-sm text-[#444] leading-relaxed mb-4">
                Sycord is an AI-powered website-building platform that enables individuals and
                businesses to create, customise, and publish professional websites in under five
                minutes — without any coding knowledge. The platform combines large-language-model
                AI with an intuitive visual editor to automate code generation, design, and
                deployment.
              </p>
              <p className="text-sm text-[#444] leading-relaxed">
                The service is offered as a Software-as-a-Service (SaaS) product, accessible
                via web browser at{" "}
                <a href="https://sycord.com" className="text-blue-600 underline" target="_blank" rel="noopener">
                  sycord.com
                </a>
                .
              </p>
            </section>

            <Divider />

            {/* 3. Services & Products */}
            <section>
              <SectionHeading number="3" title="Services & Products Offered" />
              <div className="space-y-4 mt-2">
                {[
                  {
                    title: "AI Website Builder",
                    desc:
                      "Users describe their desired website in plain English and our AI — powered by Google Gemini — generates a complete, production-ready website automatically.",
                  },
                  {
                    title: "No-Code Visual Editor",
                    desc:
                      "A drag-and-drop editor with real-time preview allows users to make changes to their website without writing a single line of code.",
                  },
                  {
                    title: "Instant Hosting",
                    desc:
                      "Every website receives a free *.sycord.com subdomain with one-click publishing. Paid plans support custom domains.",
                  },
                  {
                    title: "GitHub Deployment",
                    desc:
                      "Source code is automatically pushed to a GitHub repository, enabling CI/CD pipelines and version control.",
                  },
                  {
                    title: "Firebase Real-Time Sync",
                    desc:
                      "Real-time data synchronisation via Firebase ensures instant updates across all devices.",
                  },
                  {
                    title: "Content Moderation",
                    desc:
                      "Automatic AI-based content filtering keeps the platform safe and protects all users.",
                  },
                ].map((s) => (
                  <div key={s.title} className="pl-4 border-l-2 border-[#e0e0e0]">
                    <p className="text-sm font-semibold text-[#1a1a1a]">{s.title}</p>
                    <p className="text-sm text-[#555] leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <Divider />

            {/* 4. Subscription Plans */}
            <section>
              <SectionHeading number="4" title="Subscription Plans" />
              <p className="text-sm text-[#444] leading-relaxed mb-4">
                Sycord offers three subscription tiers billed monthly. Payments are collected
                online through PayPal&apos;s secure checkout at the time of plan selection.
              </p>
              <table className="w-full border border-[#e0e0e0] rounded-lg overflow-hidden text-sm">
                <thead className="bg-[#f8f8f8]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a1a1a]">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a1a1a]">Price / Month</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#1a1a1a]">Key Features</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p, i) => (
                    <tr key={p.name} className={i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3">
                        {p.price === 0 ? "Free" : `$${p.price} USD`}
                      </td>
                      <td className="px-4 py-3 text-[#555]">{p.features.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <Divider />

            {/* 5. Payment Collection */}
            <section>
              <SectionHeading number="5" title="Payment Collection" />
              <p className="text-sm text-[#444] leading-relaxed mb-4">
                All monetary transactions are processed exclusively through PayPal&apos;s secure
                payment infrastructure. No card data is handled or stored by Sycord directly.
              </p>
              <div className="space-y-3">
                {[
                  {
                    label: "Payment Processor",
                    value: "PayPal (api-m.paypal.com / api-m.sandbox.paypal.com)",
                  },
                  {
                    label: "Collection Method",
                    value:
                      "Online checkout initiated on the Sycord website at sycord.com/subscriptions. Users are redirected to PayPal to authorise and complete payment.",
                  },
                  {
                    label: "Supported Currencies",
                    value: "United States Dollar (USD)",
                  },
                  {
                    label: "Billing Cycle",
                    value: "Monthly recurring subscription",
                  },
                  {
                    label: "Refund Policy",
                    value: "Governed by PayPal Buyer Protection and Sycord Terms of Service (sycord.com/tos).",
                  },
                ].map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </section>

            <Divider />

            {/* 6. Branding & Links */}
            <section>
              <SectionHeading number="6" title="Branding & Online Presence" />
              <div className="space-y-3">
                {[
                  { label: "Brand Name", value: "Sycord" },
                  { label: "Website", value: "https://sycord.com", link: "https://sycord.com" },
                  { label: "About Page", value: "https://sycord.com/about", link: "https://sycord.com/about" },
                  { label: "Terms of Service", value: "https://sycord.com/tos", link: "https://sycord.com/tos" },
                  { label: "Privacy Policy", value: "https://sycord.com/pap", link: "https://sycord.com/pap" },
                  { label: "Contact", value: "https://sycord.com/contact", link: "https://sycord.com/contact" },
                ].map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} link={row.link} />
                ))}
              </div>
            </section>

            <Divider />

            {/* 7. Declaration */}
            <section>
              <SectionHeading number="7" title="Declaration" />
              <p className="text-sm text-[#444] leading-relaxed">
                I, <strong>Dávid Márton</strong>, hereby declare that the information provided in
                this Business Activity Report is accurate and complete to the best of my knowledge
                as of the date stated above.
              </p>
            </section>
          </main>

          {/* ── Document Footer ── */}
          <footer className="px-10 py-8 border-t border-[#e0e0e0] bg-[#fafafa] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-[#888] mb-1">Report prepared by</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">Dávid Márton</p>
              <p className="text-xs text-[#888] mt-0.5">Sycord — {REPORT_DATE}</p>
            </div>
            {/* Signature */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-[#aaa] uppercase tracking-widest mb-1">Signature</p>
              {/* Inline the SVG so it prints correctly regardless of image loading */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 100"
                width="160"
                height="50"
                aria-label="Dávid Márton signature"
              >
                <g fill="none" stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 18,78 C 14,76 12,50 16,30 C 18,22 22,72 26,78 C 30,84 32,38 36,28 C 40,20 44,68 48,76" />
                  <path d="M 48,76 C 52,72 58,52 66,48 C 72,45 64,62 64,68 C 64,76 74,52 78,46" />
                  <path d="M 62,36 L 68,28" />
                  <path d="M 78,46 C 78,50 76,66 78,72 C 80,76 86,52 90,46" />
                  <path d="M 90,46 C 90,40 92,28 94,24 C 96,28 98,58 100,68 C 102,76 108,62 112,56" />
                  <path d="M 84,48 L 104,46" />
                  <path d="M 112,56 C 110,64 108,74 114,78 C 120,80 126,60 128,54 C 130,48 124,46 120,50 C 116,54 122,74 130,68" />
                  <path d="M 130,68 C 130,72 130,76 134,72 C 138,64 142,52 148,48 C 152,44 154,62 156,72 C 158,78 162,70 166,64" />
                </g>
              </svg>
              <div className="w-36 border-t border-[#ccc] mt-1" />
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}

/* ── Helper Components ── */

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-7 h-7 rounded-full bg-[#18191B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <h2 className="text-base font-bold text-[#1a1a1a] uppercase tracking-wide">
        {title}
      </h2>
    </div>
  )
}

function InfoRow({
  label,
  value,
  link,
}: {
  label: string
  value: string
  link?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-[#f0f0f0] last:border-0">
      <span className="text-xs font-semibold text-[#888] uppercase tracking-wider sm:w-48 flex-shrink-0">
        {label}
      </span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener"
          className="text-sm text-blue-600 underline"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm text-[#333]">{value}</span>
      )}
    </div>
  )
}

function Divider() {
  return <hr className="border-[#ececec]" />
}
