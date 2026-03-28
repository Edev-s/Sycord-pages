"use client"

import { cn } from "@/lib/utils"

interface CreditIconProps {
  className?: string
  variant?: "gray" | "blue"
  size?: number
}

// Main credit icon - gray star in rounded diamond outline (matches uploaded icon)
export function CreditIcon({ className, variant = "gray", size = 48 }: CreditIconProps) {
  // Generate unique ID for gradient to avoid conflicts when multiple icons are rendered
  const gradientId = `starGradient-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="50" y1="25" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7a7a7a" />
          <stop offset="1" stopColor="#4a4a4a" />
        </linearGradient>
      </defs>
      {/* Rounded diamond outline - thick stroke matching uploaded icon */}
      <rect
        x="50"
        y="10"
        width="56"
        height="56"
        rx="12"
        transform="rotate(45 50 50)"
        stroke="#5a5a5a"
        strokeWidth="6"
        fill="none"
      />
      {/* Four-pointed star with curved edges matching uploaded icon */}
      <path
        d="M50 28 
           C52 38, 62 48, 72 50 
           C62 52, 52 62, 50 72 
           C48 62, 38 52, 28 50 
           C38 48, 48 38, 50 28 Z"
        fill={`url(#${gradientId})`}
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
