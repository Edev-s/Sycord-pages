"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import React from "react"

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
  { name: "Sycord (Free)",     price: "$0",  period: "N/A",     features: "1 website · 1 GB storage · Basic templates · *.sycord.com subdomain" },
  { name: "Sycord+ (Pro)",     price: "$9",  period: "Monthly", features: "Unlimited websites · 50 GB storage · AI Builder · Custom domain · Analytics" },
  { name: "Sycord Enterprise", price: "$29", period: "Monthly", features: "Everything in Pro · 500 GB storage · Priority support · API access · Team collaboration" },
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
      {/* ── Print / A4 / Mobile CSS ── */}
      <style>{`
        /* ── Print: strict A4 ── */
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
          .a4-outer { padding: 0 !important; background: transparent !important; }
          .a4-page  {
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: none !important;
          }
          .doc-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          table { page-break-inside: avoid; }
          section { page-break-inside: avoid; }
          a { color: #000 !important; text-decoration: none !important; }
          /* hide edit hints on print */
          [contenteditable] { outline: none !important; border: none !important; }
          .edit-hint { display: none !important; }
        }

        /* ── Desktop screen: A4 sheet simulation ── */
        @media screen and (min-width: 794px) {
          .a4-page {
            width: 794px; /* 210mm at 96dpi */
            min-height: 1123px; /* 297mm at 96dpi */
            padding: 96px 76px 76px 96px; /* 2.5cm 2cm 2cm 2.5cm */
            margin: 0 auto;
            background: #fff;
            box-shadow: 0 4px 40px rgba(0,0,0,0.18);
            border-radius: 2px;
          }
        }

        /* ── Mobile screen: full-width fluid layout ── */
        @media screen and (max-width: 793px) {
          .a4-outer { padding: 0 !important; }
          .a4-page {
            width: 100%;
            min-height: auto;
            padding: 20px 16px 32px;
            margin: 0;
            background: #fff;
            box-shadow: none;
            border-radius: 0;
            font-size: 11px !important;
          }
          .report-doc-header {
            flex-direction: column !important;
            gap: 12px !important;
            align-items: flex-start !important;
          }
          .report-doc-header-right {
            text-align: left !important;
          }
          .report-doc-header-right p:first-child {
            font-size: 15px !important;
          }
          .report-footer {
            flex-direction: column !important;
            gap: 20px !important;
            align-items: flex-start !important;
          }
          .report-sig {
            text-align: left !important;
          }
          .legal-table td {
            display: block !important;
            width: 100% !important;
          }
          .legal-table tr {
            display: block;
            margin-bottom: 4px;
          }
          .services-table thead { display: none; }
          .services-table tbody tr td:first-child {
            font-size: 11px;
            background: #1a1a1a;
            color: #fff !important;
            display: block;
            width: 100%;
          }
          .services-table tbody tr td:last-child {
            display: block;
            width: 100%;
          }
          .plans-table thead { display: none; }
          .plans-table tbody tr td { display: block; width: 100%; }
          .plans-table tbody tr { display: block; border: 1px solid #ddd; margin-bottom: 8px; border-radius: 4px; overflow: hidden; }
        }

        /* ── Edit mode hints (screen only) ── */
        @media screen {
          [contenteditable="true"] {
            cursor: text;
            border-radius: 2px;
            transition: outline 0.15s;
          }
          [contenteditable="true"]:hover,
          [contenteditable="true"]:focus {
            outline: 1.5px dashed #2563eb44;
            background: #eff6ff33;
          }
          [contenteditable="true"]:focus {
            outline: 1.5px solid #2563eb88;
            background: #eff6ff55;
          }
          .edit-hint {
            display: inline-block;
            font-size: 9px;
            color: #2563eb99;
            margin-left: 4px;
            vertical-align: middle;
            pointer-events: none;
            user-select: none;
          }
        }
      `}</style>

      {/* ── Screen toolbar ── */}
      <div className="no-print sticky top-0 z-50 bg-[#18191B] border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/logo.png" alt="Sycord" width={22} height={22} className="opacity-90" />
          <span className="text-white font-bold text-sm tracking-tight">Sycord</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[#8A8E91] text-xs hidden sm:block edit-hint-label">
            ✎ Click any field to edit
          </span>
          <Button
            onClick={() => window.print()}
            className="bg-white text-[#18191B] hover:bg-white/90 text-xs font-semibold px-4 h-8 rounded-full flex items-center gap-1.5 flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {/* ── Background wrapper ── */}
      <div className="a4-outer min-h-screen bg-[#E8E8E8] py-6 sm:py-10 px-0 sm:px-4">

        {/* ═══ A4 DOCUMENT ═══ */}
        <div className="a4-page">

          {/* ── Document Header ── */}
          <header className="doc-header report-doc-header mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-[#1a1a1a] flex items-start justify-between gap-3">
            {/* Left: real Sycord logo + name */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                {/* Inline Sycord logo SVG — dark variant, prints correctly */}
                <svg width="40" height="40" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Sycord">
                  <rect width="180" height="180" rx="37" fill="#18191B"/>
                  <g style={{transform:"scale(95%)",transformOrigin:"center"}}>
                    <path fill="white" d="M101.141 53H136.632C151.023 53 162.689 64.6662 162.689 79.0573V112.904H148.112V79.0573C148.112 78.7105 148.098 78.3662 148.072 78.0251L112.581 112.898C112.701 112.902 112.821 112.904 112.941 112.904H148.112V126.672H112.941C98.5504 126.672 86.5638 114.891 86.5638 100.5V66.7434H101.141V100.5C101.141 101.15 101.191 101.792 101.289 102.422L137.56 66.7816C137.255 66.7563 136.945 66.7434 136.632 66.7434H101.141V53Z"/>
                    <path fill="white" d="M65.2926 124.136L14 66.7372H34.6355L64.7495 100.436V66.7372H80.1365V118.47C80.1365 126.278 70.4953 129.958 65.2926 124.136Z"/>
                  </g>
                </svg>
              </div>
              <div>
                <EditableField tag="p" className="text-[11pt] font-black text-[#1a1a1a] tracking-tight leading-none">{BUSINESS_NAME}</EditableField>
                <EditableField tag="p" className="text-[8pt] text-[#555] mt-0.5">{WEBSITE_URL}</EditableField>
              </div>
            </div>

            {/* Right: document title + ref */}
            <div className="report-doc-header-right text-right">
              <EditableField tag="p" className="text-[13pt] sm:text-[14pt] font-bold text-[#1a1a1a] leading-tight">BUSINESS ACTIVITY REPORT</EditableField>
              <EditableField tag="p" className="text-[8pt] text-[#666] mt-1">Document Ref: {DOC_REF}</EditableField>
              <EditableField tag="p" className="text-[8pt] text-[#666]">Date: {REPORT_DATE}</EditableField>
            </div>
          </header>

          {/* ── Introductory notice ── */}
          <EditableField tag="div" className="mb-6 sm:mb-8 p-3 border border-[#c0c0c0] bg-[#f9f9f9] text-[8.5pt] text-[#444] leading-relaxed">
            This document constitutes an official Business Activity Report prepared by{" "}
            <strong>{OWNER_NAME}</strong> on behalf of <strong>{BUSINESS_NAME}</strong>.
            It has been compiled for regulatory, financial, or partnership compliance
            purposes and reflects the business activities as of the date stated above.
          </EditableField>

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
            <EditableField tag="p" className="text-[9pt] text-[#333] leading-[1.65] mb-3">
              Sycord is an AI-powered website-building platform that enables individuals and
              businesses to create, customise, and publish professional websites in under five
              minutes — without any coding knowledge. The platform combines large-language-model
              AI (Google Gemini) with an intuitive visual editor to automate code generation,
              design, and deployment.
            </EditableField>
            <EditableField tag="p" className="text-[9pt] text-[#333] leading-[1.65]">
              The service is offered exclusively as a Software-as-a-Service (SaaS) product,
              accessible via web browser at <strong>{WEBSITE_URL}</strong>. No physical goods
              are manufactured or distributed. All services are delivered digitally over the
              internet.
            </EditableField>
          </DocSection>

          {/* ── SECTION 3: Services & Products ── */}
          <DocSection number="3" title="Services and Products Offered">
            <div className="overflow-x-auto">
              <table className="services-table w-full text-[8.5pt] border-collapse" style={{minWidth:"280px"}}>
                <thead>
                  <tr style={{background:"#1a1a1a",color:"#fff"}}>
                    <th className="text-left px-3 py-2 font-semibold" style={{width:"32%"}}>Service</th>
                    <th className="text-left px-3 py-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICES.map((s, i) => (
                    <tr key={s.title} style={{background: i % 2 === 0 ? "#fff" : "#f5f5f5"}}>
                      <td className="px-3 py-2 font-semibold text-[#1a1a1a] align-top border border-[#ddd]">
                        <EditableField>{s.title}</EditableField>
                      </td>
                      <td className="px-3 py-2 text-[#444] leading-[1.5] border border-[#ddd]">
                        <EditableField>{s.desc}</EditableField>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          {/* ── SECTION 4: Subscription Plans ── */}
          <DocSection number="4" title="Subscription Plans and Pricing">
            <EditableField tag="p" className="text-[9pt] text-[#333] leading-[1.65] mb-3">
              Sycord offers three subscription tiers billed on a monthly basis. Payments are
              collected online via PayPal&apos;s secure checkout infrastructure upon checkout
              completion. All prices are stated in United States Dollars (USD).
            </EditableField>
            <div className="overflow-x-auto">
              <table className="plans-table w-full text-[8.5pt] border-collapse" style={{minWidth:"280px"}}>
                <thead>
                  <tr style={{background:"#1a1a1a",color:"#fff"}}>
                    <th className="text-left px-3 py-2 font-semibold">Plan</th>
                    <th className="text-left px-3 py-2 font-semibold">Price</th>
                    <th className="text-left px-3 py-2 font-semibold">Billing</th>
                    <th className="text-left px-3 py-2 font-semibold">Included Features</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((p, i) => (
                    <tr key={p.name} style={{background: i % 2 === 0 ? "#fff" : "#f5f5f5"}}>
                      <td className="px-3 py-2 font-semibold border border-[#ddd] align-top"><EditableField>{p.name}</EditableField></td>
                      <td className="px-3 py-2 border border-[#ddd] align-top font-mono"><EditableField>{p.price} USD</EditableField></td>
                      <td className="px-3 py-2 border border-[#ddd] align-top"><EditableField>{p.period}</EditableField></td>
                      <td className="px-3 py-2 border border-[#ddd] text-[#444]"><EditableField>{p.features}</EditableField></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          {/* ── SECTION 5: Payment Collection ── */}
          <DocSection number="5" title="Payment Collection Method">
            <EditableField tag="p" className="text-[9pt] text-[#333] leading-[1.65] mb-3">
              All monetary transactions are processed exclusively through PayPal&apos;s secure
              payment infrastructure. Sycord does not handle, transmit, or store any payment card
              data directly. The payment flow is as follows:
            </EditableField>
            <ol className="list-decimal list-outside ml-5 text-[9pt] text-[#333] leading-[1.65] space-y-1 mb-3">
              <li><EditableField>The customer selects a subscription plan on the Sycord website.</EditableField></li>
              <li><EditableField>The customer clicks the &ldquo;Pay with PayPal&rdquo; button.</EditableField></li>
              <li><EditableField>The customer is securely redirected to PayPal to authorise the payment.</EditableField></li>
              <li><EditableField>Upon successful authorisation, PayPal redirects the customer back to Sycord and the subscription is activated.</EditableField></li>
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
              ["Brand Name",        BUSINESS_NAME],
              ["Primary Website",   WEBSITE_URL],
              ["About Page",        WEBSITE_URL + "/about"],
              ["Pricing Page",      WEBSITE_URL + "/subscriptions"],
              ["Terms of Service",  WEBSITE_URL + "/tos"],
              ["Privacy Policy",    WEBSITE_URL + "/pap"],
              ["Contact",           WEBSITE_URL + "/contact"],
            ]} />
          </DocSection>

          {/* ── SECTION 7: Declaration ── */}
          <DocSection number="7" title="Declaration">
            <EditableField tag="p" className="text-[9pt] text-[#333] leading-[1.65] mb-4">
              I, <strong>{OWNER_NAME}</strong>, the sole owner and operator of{" "}
              <strong>{BUSINESS_NAME}</strong>, hereby declare that the information provided in
              this Business Activity Report is accurate, truthful, and complete to the best of my
              knowledge as of the date stated on this document. I accept full legal responsibility
              for the accuracy of the contents herein.
            </EditableField>
          </DocSection>

          {/* ── Document Footer / Signature ── */}
          <footer className="report-footer mt-8 sm:mt-10 pt-5 sm:pt-6 border-t-2 border-[#1a1a1a] flex items-end justify-between gap-6">

            {/* Left — metadata */}
            <div className="space-y-0.5">
              <EditableField tag="p" className="text-[8pt] text-[#555]">Document reference: <strong>{DOC_REF}</strong></EditableField>
              <EditableField tag="p" className="text-[8pt] text-[#555]">Prepared by: <strong>{OWNER_NAME}</strong></EditableField>
              <EditableField tag="p" className="text-[8pt] text-[#555]">Date: <strong>{REPORT_DATE}</strong></EditableField>
              <EditableField tag="p" className="text-[8pt] text-[#555] pt-1">{WEBSITE_URL}</EditableField>
            </div>

            {/* Right — signature block */}
            <div className="report-sig text-right">
              <p className="text-[7.5pt] text-[#999] uppercase tracking-widest mb-2">Authorised Signature</p>
              {/* Real "Márton" cursive signature — hand-traced SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 340 110"
                width="170"
                height="55"
                aria-label="Dávid Márton signature"
                style={{display:"block", marginLeft:"auto"}}
              >
                <g fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Initial approach loop / hook before M */}
                  <path d="M 18,82 C 12,78 8,62 10,48 C 12,36 16,30 20,36 C 22,42 20,70 22,80"/>
                  {/* M — two humps */}
                  <path d="M 22,80 C 24,74 26,40 30,28 C 34,16 36,60 40,76 C 42,70 46,38 50,26 C 54,14 58,62 62,78"/>
                  {/* Connection into á */}
                  <path d="M 62,78 C 66,72 72,54 78,48 C 84,44 82,62 80,70 C 78,78 86,54 92,46"/>
                  {/* Accent mark over á */}
                  <path d="M 73,32 C 76,26 79,21 82,18"/>
                  {/* r — small loop */}
                  <path d="M 92,46 C 92,52 90,68 92,76 C 96,70 102,54 108,48"/>
                  {/* t — tall stem */}
                  <path d="M 108,48 C 108,38 110,22 112,16 C 114,22 116,58 118,70 C 122,64 128,50 134,46"/>
                  {/* t crossbar */}
                  <path d="M 100,42 L 126,40"/>
                  {/* o */}
                  <path d="M 134,46 C 132,54 128,72 134,78 C 140,82 150,66 152,58 C 154,50 148,44 142,48 C 136,52 140,76 150,70"/>
                  {/* n + trailing tail */}
                  <path d="M 150,70 C 152,74 154,80 158,74 C 164,64 170,50 176,46 C 182,42 184,62 186,74 C 188,82 196,72 204,64 C 208,60 210,72 210,78"/>
                </g>
              </svg>
              <div style={{width:"170px",borderTop:"1px solid #bbb",marginTop:"6px",marginLeft:"auto"}}/>
              <EditableField tag="p" className="text-[8pt] text-[#555] mt-1">{OWNER_NAME}</EditableField>
            </div>
          </footer>

        </div>
        {/* ═══ END A4 DOCUMENT ═══ */}
      </div>
    </>
  )
}

/* ─────────────────── Editable wrapper ─────────────────── */
/**
 * E — Inline-editable element.
 * On screen it is contentEditable; on print it renders as plain text.
 * Use `tag` to control the HTML element (default: "span").
 */
function EditableField({
  children,
  tag = "span",
  className,
  style,
}: {
  children?: React.ReactNode
  tag?: string
  className?: string
  style?: React.CSSProperties
}) {
  const Tag = tag as React.ElementType
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      className={className}
      style={style}
    >
      {children}
    </Tag>
  )
}

/* ─────────────────── DocSection ─────────────────── */
function DocSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{marginBottom:"18pt"}}>
      <div style={{
        display:"flex",
        alignItems:"center",
        gap:"8pt",
        borderBottom:"1.5pt solid #1a1a1a",
        paddingBottom:"3pt",
        marginBottom:"8pt",
      }}>
        <span style={{
          fontSize:"8pt",
          fontWeight:700,
          background:"#1a1a1a",
          color:"#fff",
          padding:"1pt 5pt",
          borderRadius:"2pt",
          flexShrink:0,
          letterSpacing:"0.5pt",
        }}>
          {number}
        </span>
        <h2
          contentEditable
          suppressContentEditableWarning
          style={{
            fontSize:"10pt",
            fontWeight:700,
            color:"#1a1a1a",
            textTransform:"uppercase",
            letterSpacing:"0.8pt",
            margin:0,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

/* ─────────────────── LegalTable ─────────────────── */
function LegalTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="legal-table w-full border-collapse" style={{fontSize:"8.5pt"}}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td
                contentEditable
                suppressContentEditableWarning
                style={{
                  padding:"4pt 8pt",
                  fontWeight:600,
                  color:"#444",
                  width:"38%",
                  borderBottom:"0.5pt solid #e0e0e0",
                  verticalAlign:"top",
                  backgroundColor:"#f5f5f5",
                  minWidth:"100px",
                }}
              >
                {label}
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                style={{
                  padding:"4pt 8pt",
                  color:"#222",
                  borderBottom:"0.5pt solid #e0e0e0",
                  verticalAlign:"top",
                }}
              >
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
