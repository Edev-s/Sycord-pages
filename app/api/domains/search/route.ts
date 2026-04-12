import { NextResponse } from "next/server"

// Domain TLDs with estimated prices (would be fetched from registrar API in production)
const TLD_PRICING: Record<string, { price: string; popular?: boolean }> = {
  ".com": { price: "$12.99/yr", popular: true },
  ".net": { price: "$14.99/yr" },
  ".org": { price: "$13.99/yr" },
  ".io": { price: "$39.99/yr", popular: true },
  ".co": { price: "$29.99/yr" },
  ".dev": { price: "$15.99/yr", popular: true },
  ".app": { price: "$17.99/yr" },
  ".site": { price: "$2.99/yr" },
  ".online": { price: "$4.99/yr" },
  ".store": { price: "$19.99/yr" },
  ".shop": { price: "$29.99/yr" },
  ".tech": { price: "$12.99/yr" },
  ".ai": { price: "$89.99/yr", popular: true },
  ".me": { price: "$9.99/yr" },
  ".xyz": { price: "$1.99/yr" },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim().toLowerCase() || ""

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], error: "Query too short" })
  }

  // Clean the domain name
  const cleanDomain = query
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .substring(0, 63)

  if (!cleanDomain) {
    return NextResponse.json({ results: [], error: "Invalid domain name" })
  }

  // Generate results for all TLDs
  const results = Object.entries(TLD_PRICING).map(([tld, data]) => ({
    domain: `${cleanDomain}${tld}`,
    tld,
    price: data.price,
    popular: data.popular || false,
    // Simulate availability (in production, check with registrar API)
    available: Math.random() > 0.2, // 80% chance available for demo
  }))

  // Sort: popular first, then by price
  results.sort((a, b) => {
    if (a.popular && !b.popular) return -1
    if (!a.popular && b.popular) return 1
    return 0
  })

  // Add free sycord.site subdomain at the top
  const freeSubdomain = {
    domain: `${cleanDomain}.sycord.site`,
    tld: ".sycord.site",
    price: "Free",
    popular: false,
    available: true,
    isFree: true,
  }

  return NextResponse.json({
    query: cleanDomain,
    results: [freeSubdomain, ...results],
  })
}
