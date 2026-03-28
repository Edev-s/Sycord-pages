"use client"

import { cn } from "@/lib/utils"

interface CreditIconProps {
  className?: string
  variant?: "gray" | "blue"
  size?: number
}

// Main credit icon - gray star in rounded diamond outline
export function CreditIcon({ className, variant = "gray", size = 48 }: CreditIconProps) {
  const colors = {
    gray: {
      outline: "#5a5a5a",
      star: "url(#grayGradient)",
    },
    blue: {
      outline: "#3b82f6",
      star: "#3b82f6",
    },
  }

  const color = colors[variant]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="grayGradient" x1="24" y1="14" x2="24" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6b6b6b" />
          <stop offset="1" stopColor="#4a4a4a" />
        </linearGradient>
      </defs>
      {/* Rounded diamond outline - rotated square with rounded corners */}
      <rect
        x="24"
        y="4"
        width="28"
        height="28"
        rx="6"
        transform="rotate(45 24 24)"
        stroke={color.outline}
        strokeWidth="3"
        fill="none"
      />
      {/* Four-pointed star */}
      <path
        d="M24 14 L26.5 21.5 L34 24 L26.5 26.5 L24 34 L21.5 26.5 L14 24 L21.5 21.5 Z"
        fill={color.star}
      />
    </svg>
  )
}

// Blue diamond icon for deductions (tilted solid diamond)
export function DeductionIcon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <rect
        x="16"
        y="4"
        width="17"
        height="17"
        rx="3"
        transform="rotate(45 16 16)"
        fill="#3b82f6"
      />
    </svg>
  )
}
