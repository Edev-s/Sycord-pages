"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Suspense } from "react"

function JulesPageContent() {
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError("Missing authentication token. Use ?token=YOUR_TOKEN")
      return
    }

    async function performLogin() {
      try {
        const res = await signIn("credentials", {
          password: token,
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
  }, [token])

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
      <p>Authenticating bypass login...</p>
    </div>
  )
}

export default function JulesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
      </div>
    }>
      <JulesPageContent />
    </Suspense>
  )
}
