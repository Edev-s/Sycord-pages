"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function JulesPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function performLogin() {
      try {
        const res = await signIn("credentials", {
          password: process.env.NEXT_PUBLIC_JULES_BYPASS_TOKEN || "julesbypasstoken123",
          redirect: true,
          callbackUrl: "/dashboard",
        })
        if (res?.error) {
          setError(res.error)
        }
      } catch (err: any) {
        setError(err.message)
      }
    }

    performLogin()
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-red-500">
        <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
      <p>Logging into Dashboard as dmarton336@gmail.com...</p>
    </div>
  )
}
