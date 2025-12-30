import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

const HISTORY_HOURS = 20

type HistoryPoint = {
  ts: number
  status: boolean | null
}

const eventToStatus = (event?: string | null) => {
  if (!event) return null
  const normalized = event.toLowerCase()

  if (["fail", "failed", "error", "timeout", "halt", "pause", "stopped", "alert", "down"].some((k) => normalized.includes(k))) {
    return false
  }

  if (["ok", "complete", "run", "ping", "start", "success", "up", "tick", "pass"].some((k) => normalized.includes(k))) {
    return true
  }

  return null
}

const normalizeEvents = (raw: any): HistoryPoint[] => {
  const activity = Array.isArray(raw?.activity)
    ? raw.activity
    : Array.isArray(raw?.events)
      ? raw.events
      : Array.isArray(raw)
        ? raw
        : []

  return activity
    .map((entry: any) => {
      const stamp =
        typeof entry?.stamp === "number"
          ? entry.stamp
          : typeof entry?.timestamp === "number"
            ? entry.timestamp
            : typeof entry?.ts === "number"
              ? entry.ts
              : typeof entry?.time === "number"
                ? entry.time
                : typeof entry?.stamp === "string"
                  ? Number(entry.stamp)
                  : typeof entry?.ts === "string"
                    ? Number(entry.ts)
                    : null

      const status = eventToStatus(
        entry?.event ||
          entry?.state ||
          entry?.status ||
          (typeof entry === "string" ? entry : undefined),
      )

      if (stamp && !Number.isNaN(stamp)) {
        return { ts: stamp, status }
      }
      return null
    })
    .filter(Boolean) as HistoryPoint[]
}

const buildHistory = (events: HistoryPoint[], hours: number): (boolean | null)[] => {
  if (!events.length) {
    return Array(hours).fill(null)
  }

  const sorted = events.sort((a, b) => a.ts - b.ts)
  const nowSec = Date.now() / 1000
  const start = nowSec - hours * 3600
  const history: (boolean | null)[] = []

  let cursor = 0
  let lastStatus: boolean | null = null

  for (let i = 0; i < hours; i++) {
    const bucketEnd = start + (i + 1) * 3600
    while (cursor < sorted.length && sorted[cursor].ts <= bucketEnd) {
      lastStatus = sorted[cursor].status
      cursor++
    }
    history.push(lastStatus)
  }

  return history
}

const lastKnownStatus = (history: (boolean | null)[]) => {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] !== null) return history[i]
  }
  return null
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    const monitors = await db.collection("monitors").find({}).sort({ createdAt: 1 }).toArray()

    const apiKey = process.env.CRONITOR_API
    const authHeader = apiKey
      ? {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        }
      : undefined

    if (!apiKey) {
      console.warn("Missing CRONITOR_API")
    }

    let cronitorData: Record<string, any> = {}
    if (authHeader) {
      try {
        const res = await fetch("https://cronitor.io/api/monitors", {
          headers: authHeader,
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json()
          const monitorsList = data.monitors || []
          monitorsList.forEach((m: any) => {
            cronitorData[m.key] = m
          })
        } else {
          console.error("Cronitor API error:", await res.text())
        }
      } catch (e) {
        console.error("Failed to fetch from Cronitor:", e)
      }
    }

    const servers = await Promise.all(
      monitors.map(async (monitor) => {
        const monitorKey = monitor.uniqueUri || monitor.cronitorId
        let status: "up" | "down" | "unknown" = "unknown"
        let statusCode = 0
        let uptime: (boolean | null)[] = Array(HISTORY_HOURS).fill(null)

        const cronitor = monitorKey ? cronitorData[monitorKey] : undefined
        if (cronitor) {
          status = cronitor.passing ? "up" : "down"
          statusCode = cronitor.passing ? 200 : 503
        }

        if (authHeader && monitorKey) {
          try {
            const activityRes = await fetch(
              `https://cronitor.io/api/monitors/${encodeURIComponent(monitorKey)}/activity?hours=${HISTORY_HOURS}`,
              {
                headers: authHeader,
                cache: "no-store",
              },
            )

            if (activityRes.ok) {
              const activityData = await activityRes.json()
              const events = normalizeEvents(activityData)
              uptime = buildHistory(events, HISTORY_HOURS)
            } else {
              console.error("Cronitor activity error:", await activityRes.text())
            }
          } catch (error) {
            console.error(`Error fetching activity for monitor ${monitorKey}:`, error)
          }
        }

        if (uptime.every((entry) => entry === null)) {
          if (status === "up") uptime = Array(HISTORY_HOURS).fill(true)
          if (status === "down") uptime = Array(HISTORY_HOURS).fill(false)
        }

        const lastPoint = lastKnownStatus(uptime)
        if (!statusCode && lastPoint !== null) {
          statusCode = lastPoint ? 200 : 503
          status = lastPoint ? "up" : "down"
        }

        return {
          id: monitor._id.toString(),
          name: monitor.name,
          provider: monitor.provider,
          providerIcon: monitor.icon,
          status,
          statusCode,
          uptime,
        }
      }),
    )

    const anyDown = servers.some(
      (monitor) => monitor.status === "down" || monitor.uptime.some((point) => point === false),
    )
    const globalStatus = anyDown ? "outage" : "operational"

    return NextResponse.json({
      servers,
      globalStatus,
    })
  } catch (error) {
    console.error("Error in status API:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
