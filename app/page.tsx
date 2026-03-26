"use client"

import Link from "next/link"

// ---------------------------------------------------------------------------
// Dot-portrait generation
// Returns an intensity value (0 = skip, >0 = render dot) for each grid point.
// The coordinate (nx, ny) is normalised in [0, 1] over the portrait grid.
// ---------------------------------------------------------------------------
function getFaceIntensity(nx: number, ny: number): number {
  const cx = 0.50  // face centre-x
  const cy = 0.42  // face centre-y

  // ── HAIR ──────────────────────────────────────────────────────────────────
  const hDx = (nx - cx) / 0.37
  const hDy = (ny - (cy - 0.28)) / 0.24
  const inHair = hDx * hDx + hDy * hDy < 1 && ny < cy + 0.02
  if (inHair && ny < cy - 0.02) {
    const dist = hDx * hDx + hDy * hDy
    return 0.48 + (1 - dist) * 0.32
  }

  // ── FACE OVAL ─────────────────────────────────────────────────────────────
  const fA = 0.25
  const fB = 0.37
  const fDx = (nx - cx) / fA
  const fDy = (ny - cy) / fB
  const fOval = fDx * fDx + fDy * fDy

  if (fOval > 1.0) {
    // ── NECK ────────────────────────────────────────────────────────────────
    const neckTop = cy + fB * 0.85
    const neckBot = cy + fB * 1.28
    if (ny > neckTop && ny < neckBot && Math.abs(nx - cx) < 0.095) return 0.48

    // ── SHOULDERS ───────────────────────────────────────────────────────────
    if (ny > neckBot && ny < 1.0) {
      const sDx = Math.abs(nx - cx)
      const sDy = ny - neckBot
      // Shoulder curve: widens as we go down
      if (sDx < 0.08 + sDy * 3.5 && sDy < 0.18) return 0.40
    }
    return 0
  }

  // ── Inside face: base intensity ───────────────────────────────────────────
  let intensity = fOval > 0.83 ? 0.60 : 0.22

  // ── EYEBROWS ──────────────────────────────────────────────────────────────
  const browY  = cy - fB * 0.30
  const browOX = fA * 0.43

  const lbDx = (nx - (cx - browOX)) / (fA * 0.26)
  const lbDy = (ny - (browY + lbDx * fA * 0.06)) / (fB * 0.045)
  if (lbDx * lbDx + lbDy * lbDy < 1) return 0.87

  const rbDx = (nx - (cx + browOX)) / (fA * 0.26)
  const rbDy = (ny - (browY - rbDx * fA * 0.06)) / (fB * 0.045)
  if (rbDx * rbDx + rbDy * rbDy < 1) return 0.87

  // ── EYES ──────────────────────────────────────────────────────────────────
  const eyeY  = cy - fB * 0.17
  const eyeOX = fA * 0.43

  const leDx = (nx - (cx - eyeOX)) / (fA * 0.23)
  const leDy = (ny - eyeY) / (fB * 0.09)
  const lEd  = leDx * leDx + leDy * leDy
  if (lEd < 1) return lEd < 0.38 ? 0.96 : 0.85

  const reDx = (nx - (cx + eyeOX)) / (fA * 0.23)
  const reDy = (ny - eyeY) / (fB * 0.09)
  const rEd  = reDx * reDx + reDy * reDy
  if (rEd < 1) return rEd < 0.38 ? 0.96 : 0.85

  // ── NOSE ──────────────────────────────────────────────────────────────────
  const noseY = cy + fB * 0.10

  // bridge
  const nbDx = (nx - cx) / (fA * 0.09)
  const nbDy = (ny - (cy - fB * 0.04)) / (fB * 0.20)
  if (nbDx * nbDx + nbDy * nbDy < 1) intensity = Math.max(intensity, 0.52)

  // tip
  const ntDx = (nx - cx) / (fA * 0.19)
  const ntDy = (ny - (noseY + fB * 0.11)) / (fB * 0.07)
  if (ntDx * ntDx + ntDy * ntDy < 1) return 0.74

  // wings
  const nwY  = (ny - (noseY + fB * 0.09)) / (fB * 0.065)
  const nwLx = (nx - (cx - fA * 0.19)) / (fA * 0.09)
  const nwRx = (nx - (cx + fA * 0.19)) / (fA * 0.09)
  if (nwLx * nwLx + nwY * nwY < 1 || nwRx * nwRx + nwY * nwY < 1) return 0.68

  // ── MOUTH ─────────────────────────────────────────────────────────────────
  const mouthY = cy + fB * 0.35

  // upper lip
  const ulDx = (nx - cx) / (fA * 0.37)
  const ulDy = (ny - mouthY) / (fB * 0.048)
  if (ulDx * ulDx + ulDy * ulDy < 1) return 0.85

  // lower lip
  const llDx = (nx - cx) / (fA * 0.32)
  const llDy = (ny - (mouthY + fB * 0.062)) / (fB * 0.072)
  if (llDx * llDx + llDy * llDy < 1) return 0.74

  // corners
  const mcY  = (ny - mouthY) / (fB * 0.042)
  const mcLx = (nx - (cx - fA * 0.36)) / (fA * 0.055)
  const mcRx = (nx - (cx + fA * 0.36)) / (fA * 0.055)
  if (mcLx * mcLx + mcY * mcY < 1 || mcRx * mcRx + mcY * mcY < 1) return 0.68

  // ── CHEEKS (subtle volume) ────────────────────────────────────────────────
  const ckY  = (ny - (cy + fB * 0.14)) / (fB * 0.30)
  const ckLx = (nx - (cx - fA * 0.60)) / (fA * 0.40)
  const ckRx = (nx - (cx + fA * 0.60)) / (fA * 0.40)
  if (ckLx * ckLx + ckY * ckY < 1 || ckRx * ckRx + ckY * ckY < 1) {
    intensity = Math.max(intensity, 0.36)
  }

  return intensity
}

// Pre-compute dots at module level (deterministic, runs once)
const SPACING = 15
const COLS    = 52
const ROWS    = 60

const PORTRAIT_DOTS: { cx: number; cy: number; opacity: number }[] = []
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const nx = c / (COLS - 1)
    const ny = r / (ROWS - 1)
    const intensity = getFaceIntensity(nx, ny)
    if (intensity > 0) {
      PORTRAIT_DOTS.push({ cx: c * SPACING, cy: r * SPACING, opacity: intensity })
    }
  }
}

const PORTRAIT_W = (COLS - 1) * SPACING
const PORTRAIT_H = (ROWS - 1) * SPACING

function DotPortrait() {
  return (
    <svg
      viewBox={`0 0 ${PORTRAIT_W} ${PORTRAIT_H}`}
      className="w-full h-full"
      preserveAspectRatio="xMinYMin meet"
      aria-hidden="true"
    >
      {PORTRAIT_DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={2.5}
          fill="white"
          fillOpacity={d.opacity}
        />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0C] flex overflow-hidden relative">

      {/* ── Left: copy ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-center px-10 md:px-20 py-16 z-10 w-full md:w-[58%] shrink-0">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-bold text-white leading-tight tracking-tight mb-6">
          Website in a minute
        </h1>

        <p className="text-[#8A8E91] text-sm md:text-base leading-relaxed mb-10 max-w-[400px]">
          Describe your idea, Sycord&apos;s AI designs, codes, and deploys your website
          instantly. No coding or design skills required.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-full bg-[#2C2C2C] hover:bg-[#383838] active:bg-[#1E1E1E] text-white text-sm font-medium px-8 h-12 transition-colors w-fit"
        >
          Get started
        </Link>
      </div>

      {/* ── Right: dot portrait ────────────────────────────────────────────── */}
      <div className="hidden md:block absolute right-0 top-0 h-full w-[48%]">
        <div className="w-full h-full opacity-[0.88]">
          <DotPortrait />
        </div>
      </div>

    </div>
  )
}
