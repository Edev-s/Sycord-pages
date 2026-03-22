"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

/* ─── Static report data ─── */
const OWNER_NAME = "Dávid Márton"
const BUSINESS_NAME = "Sycord"
const WEBSITE_URL = "https://sycord.com"
const REPORT_DATE = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})
const DOC_REF = `BAR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`

const PLANS = [
  { name: "Sycord (Free)",       price: "$0",  period: "N/A",      features: "1 website · 1 GB storage · Basic templates · *.sycord.com subdomain" },
  { name: "Sycord+ (Pro)",       price: "$9",  period: "Monthly",  features: "Unlimited websites · 50 GB storage · AI Builder · Custom domain · Analytics" },
  { name: "Sycord Enterprise",   price: "$29", period: "Monthly",  features: "Everything in Pro · 500 GB storage · Priority support · API access · Team collaboration" },
]

const SERVICES = [
  {
    title: "AI Website Builder",
    desc: "Users describe their desired website in plain English; the platform generates a complete, production-ready website automatically using Google Gemini AI.",
  },
  {
    title: "No-Code Visual Editor",
    desc: "A drag-and-drop editor with real-time preview allows full customisation without writing any code.",
  },
  {
    title: "Instant Hosting",
    desc: "Every website receives a free *.sycord.com subdomain with one-click publishing. Custom domains are available on paid plans.",
  },
  {
    title: "GitHub Deployment",
    desc: "Source code is automatically pushed to a GitHub repository, providing built-in CI/CD pipelines and version control.",
  },
  {
    title: "Firebase Real-Time Sync",
    desc: "Real-time data synchronisation via Firebase ensures instant updates across all devices.",
  },
  {
    title: "Content Moderation",
    desc: "Automated AI-based content filtering maintains platform safety for all users.",
  },
]

export default function BusinessReportPage() {
  return (
    <>
      {/* ── Print / page-size CSS ── */}
      <style>{`
        /* A4 page setup for print */
        @page {
          size: A4 portrait;
          margin: 2.5cm 2cm 2cm 2.5cm;
        }

        @media print {
          html, body {
            width: 210mm;
            min-height: 297mm;
            background: #fff !important;
            color: #000 !important;
            font-size: 10pt !important;
          }
          .no-print { display: none !important; }
          .a4-page  {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: auto;
          }
          .doc-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table { page-break-inside: avoid; }
          section { page-break-inside: avoid; }
          a { color: #000 !important; text-decoration: none !important; }
        }

        /* Screen preview — simulate A4 sheet */
        @media screen {
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 2.5cm 2cm 2cm 2.5cm;
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 4px 32px rgba(0,0,0,0.18);
            border-radius: 2px;
          }
        }
      `}</style>

      {/* ── Screen toolbar (hidden on print) ── */}
      <div className="no-print sticky top-0 z-50 bg-[#18191B] border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Sycord" width={22} height={22} className="opacity-90" />
          <span className="text-white font-bold text-sm tracking-tight">Sycord</span>
        </Link>
        <Button
          onClick={() => window.print()}
          className="bg-white text-[#18191B] hover:bg-white/90 text-xs font-semibold px-5 h-8 rounded-full flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Export as A4 PDF
        </Button>
      </div>

      {/* ── Outer screen wrapper ── */}
      <div className="no-print-bg min-h-screen bg-[#E8E8E8] py-10 px-4 print:bg-transparent print:p-0 print:m-0">

        {/* ═══════════════════════ A4 DOCUMENT ═══════════════════════ */}
        <div className="a4-page doc-root">

          {/* ── Document Header ── */}
          <header className="doc-header mb-8 pb-6 border-b-2 border-[#1a1a1a] flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo block */}
              <div className="w-10 h-10 bg-[#18191B] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-black tracking-tight">SC</span>
              </div>
              <div>
                <p className="text-[11pt] font-black text-[#1a1a1a] tracking-tight leading-none">{BUSINESS_NAME}</p>
                <p className="text-[8pt] text-[#555] mt-0.5">{WEBSITE_URL}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[14pt] font-bold text-[#1a1a1a] leading-tight">BUSINESS ACTIVITY REPORT</p>
              <p className="text-[8pt] text-[#666] mt-1">Document Ref: {DOC_REF}</p>
              <p className="text-[8pt] text-[#666]">Date: {REPORT_DATE}</p>
            </div>
          </header>

          {/* ── Introductory notice ── */}
          <div className="mb-8 p-3 border border-[#c0c0c0] bg-[#f9f9f9] text-[8.5pt] text-[#444] leading-relaxed">
            This document constitutes an official Business Activity Report prepared by{" "}
            <strong>{OWNER_NAME}</strong> on behalf of <strong>{BUSINESS_NAME}</strong>.
            It has been compiled for regulatory, financial, or partnership compliance
            purposes and reflects the business activities as of the date stated above.
          </div>

          {/* ── SECTION 1: Legal Identity ── */}
          <DocSection number="1" title="Legal Identity">
            <LegalTable rows={[
              ["Full Legal Name",    OWNER_NAME],
              ["Trading Name",       BUSINESS_NAME],
              ["Business Type",      "Software-as-a-Service (SaaS) — Sole Trader / Individual"],
              ["Website",            WEBSITE_URL],
              ["Document Date",      REPORT_DATE],
              ["Document Reference", DOC_REF],
            ]} />
          </DocSection>

          {/* ── SECTION 2: Business Overview ── */}
          <DocSection number="2" title="Business Overview">
            <p className="text-[9pt] text-[#333] leading-[1.65] mb-3">
              Sycord is an AI-powered website-building platform that enables individuals and
              businesses to create, customise, and publish professional websites in under five
              minutes — without any coding knowledge. The platform combines large-language-model
              AI (Google Gemini) with an intuitive visual editor to automate code generation,
              design, and deployment.
            </p>
            <p className="text-[9pt] text-[#333] leading-[1.65]">
              The service is offered exclusively as a Software-as-a-Service (SaaS) product,
              accessible via web browser at <strong>{WEBSITE_URL}</strong>. No physical goods
              are manufactured or distributed. All services are delivered digitally over the
              internet.
            </p>
          </DocSection>

          {/* ── SECTION 3: Services & Products ── */}
          <DocSection number="3" title="Services and Products Offered">
            <table className="w-full text-[8.5pt] border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] text-white">
                  <th className="text-left px-3 py-2 font-semibold w-[32%]">Service</th>
                  <th className="text-left px-3 py-2 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s, i) => (
                  <tr key={s.title} className={i % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}>
                    <td className="px-3 py-2 font-semibold text-[#1a1a1a] align-top border border-[#ddd]">{s.title}</td>
                    <td className="px-3 py-2 text-[#444] leading-[1.5] border border-[#ddd]">{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DocSection>

          {/* ── SECTION 4: Subscription Plans ── */}
          <DocSection number="4" title="Subscription Plans and Pricing">
            <p className="text-[9pt] text-[#333] leading-[1.65] mb-3">
              Sycord offers three subscription tiers billed on a monthly basis. Payments are
              collected online via PayPal&apos;s secure checkout infrastructure upon checkout
              completion. All prices are stated in United States Dollars (USD).
            </p>
            <table className="w-full text-[8.5pt] border-collapse">
              <thead>
                <tr className="bg-[#1a1a1a] text-white">
                  <th className="text-left px-3 py-2 font-semibold">Plan</th>
                  <th className="text-left px-3 py-2 font-semibold">Price</th>
                  <th className="text-left px-3 py-2 font-semibold">Billing</th>
                  <th className="text-left px-3 py-2 font-semibold">Included Features</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((p, i) => (
                  <tr key={p.name} className={i % 2 === 0 ? "bg-white" : "bg-[#f5f5f5]"}>
                    <td className="px-3 py-2 font-semibold border border-[#ddd] align-top">{p.name}</td>
                    <td className="px-3 py-2 border border-[#ddd] align-top font-mono">{p.price} USD</td>
                    <td className="px-3 py-2 border border-[#ddd] align-top">{p.period}</td>
                    <td className="px-3 py-2 border border-[#ddd] text-[#444]">{p.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DocSection>

          {/* ── SECTION 5: Payment Collection ── */}
          <DocSection number="5" title="Payment Collection Method">
            <p className="text-[9pt] text-[#333] leading-[1.65] mb-3">
              All monetary transactions are processed exclusively through PayPal&apos;s secure
              payment infrastructure. Sycord does not handle, transmit, or store any payment card
              data directly. The payment flow is as follows:
            </p>
            <ol className="list-decimal list-outside ml-5 text-[9pt] text-[#333] leading-[1.65] space-y-1 mb-3">
              <li>The customer selects a subscription plan on the Sycord website.</li>
              <li>The customer clicks the &ldquo;Pay with PayPal&rdquo; button.</li>
              <li>The customer is securely redirected to PayPal to authorise the payment.</li>
              <li>Upon successful authorisation, PayPal redirects the customer back to Sycord and the subscription is activated.</li>
            </ol>
            <LegalTable rows={[
              ["Payment Processor",   "PayPal (PayPal Holdings, Inc.)"],
              ["API Endpoint",        "api-m.paypal.com (production) / api-m.sandbox.paypal.com (testing)"],
              ["Collection Point",    WEBSITE_URL + " — /subscriptions (checkout page)"],
              ["Supported Currency",  "United States Dollar (USD)"],
              ["Billing Cycle",       "Monthly recurring subscription"],
              ["Refund Policy",       "Subject to PayPal Buyer Protection and Sycord Terms of Service"],
            ]} />
          </DocSection>

          {/* ── SECTION 6: Branding & Online Presence ── */}
          <DocSection number="6" title="Branding and Online Presence">
            <LegalTable rows={[
              ["Brand Name",         BUSINESS_NAME],
              ["Primary Website",    WEBSITE_URL],
              ["About Page",         WEBSITE_URL + "/about"],
              ["Pricing Page",       WEBSITE_URL + "/subscriptions"],
              ["Terms of Service",   WEBSITE_URL + "/tos"],
              ["Privacy Policy",     WEBSITE_URL + "/pap"],
              ["Contact",            WEBSITE_URL + "/contact"],
            ]} />
          </DocSection>

          {/* ── SECTION 7: Declaration ── */}
          <DocSection number="7" title="Declaration">
            <p className="text-[9pt] text-[#333] leading-[1.65] mb-4">
              I, <strong>{OWNER_NAME}</strong>, the sole owner and operator of{" "}
              <strong>{BUSINESS_NAME}</strong>, hereby declare that the information provided in
              this Business Activity Report is accurate, truthful, and complete to the best of my
              knowledge as of the date stated on this document. I accept full legal responsibility
              for the accuracy of the contents herein.
            </p>
          </DocSection>

          {/* ── Document Footer / Signature ── */}
          <footer className="mt-10 pt-6 border-t-2 border-[#1a1a1a] flex items-end justify-between">
            {/* Left — metadata */}
            <div>
              <p className="text-[8pt] text-[#555]">Document reference: <strong>{DOC_REF}</strong></p>
              <p className="text-[8pt] text-[#555]">Prepared by: <strong>{OWNER_NAME}</strong></p>
              <p className="text-[8pt] text-[#555]">Date: <strong>{REPORT_DATE}</strong></p>
              <p className="text-[8pt] text-[#555] mt-1">{WEBSITE_URL}</p>
            </div>

            {/* Right — signature block */}
            <div className="text-right">
              <p className="text-[7.5pt] text-[#999] uppercase tracking-widest mb-1">Authorised Signature</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 100"
                width="148"
                height="46"
                aria-label={`${OWNER_NAME} signature`}
                style={{ display: "block", marginLeft: "auto" }}
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
              <div style={{ width: "148px", borderTop: "1px solid #aaa", marginTop: "4px", marginLeft: "auto" }} />
              <p className="text-[8pt] text-[#555] mt-1">{OWNER_NAME}</p>
            </div>
          </footer>

        </div>
        {/* ═══════════════════════ END A4 DOCUMENT ═══════════════════════ */}

      </div>
    </>
  )
}

/* ─────────────────────── Helper components ─────────────────────── */

function DocSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "20pt" }}>
      {/* Section heading bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8pt",
        borderBottom: "1.5pt solid #1a1a1a",
        paddingBottom: "3pt",
        marginBottom: "8pt",
      }}>
        <span style={{
          fontSize: "8pt",
          fontWeight: 700,
          background: "#1a1a1a",
          color: "#fff",
          padding: "1pt 5pt",
          borderRadius: "2pt",
          flexShrink: 0,
          letterSpacing: "0.5pt",
        }}>
          {number}
        </span>
        <h2 style={{
          fontSize: "10pt",
          fontWeight: 700,
          color: "#1a1a1a",
          textTransform: "uppercase",
          letterSpacing: "0.8pt",
          margin: 0,
        }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function LegalTable({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt" }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td style={{
              padding: "4pt 8pt",
              fontWeight: 600,
              color: "#444",
              width: "38%",
              borderBottom: "0.5pt solid #e0e0e0",
              verticalAlign: "top",
              backgroundColor: "#f5f5f5",
            }}>
              {label}
            </td>
            <td style={{
              padding: "4pt 8pt",
              color: "#222",
              borderBottom: "0.5pt solid #e0e0e0",
              verticalAlign: "top",
            }}>
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

