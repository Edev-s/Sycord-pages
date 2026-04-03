import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const VPS_SERVER_URL =
  process.env.VPS_SERVER_URL || "https://server.sycord.site"

/**
 * Cron-triggered keep-alive endpoint.
 * Pings both the Next.js website and the VPS runner so external monitoring
 * (Cronitor / Vercel Cron) keeps both services warm 24/7.
 */
export async function GET() {
  const results: Record<string, string> = {}

  // Ping the VPS runner (sycord.site)
  try {
    const runnerRes = await fetch(`${VPS_SERVER_URL}/api/health`, {
      signal: AbortSignal.timeout(10_000),
    })
    results.runner = runnerRes.ok ? "ok" : `error:${runnerRes.status}`
  } catch (err) {
    results.runner = `unreachable:${(err as Error).message}`
  }

  // Self-check (website)
  results.website = "ok"

  return NextResponse.json({
    status: "ok",
    pingedAt: new Date().toISOString(),
    results,
  })
}
