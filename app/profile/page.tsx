"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, User, Calendar, Copy, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState<{
    name?: string
    email?: string
    image?: string
    createdAt?: string
    userId?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const response = await fetch("/api/user/profile")
        if (response.ok) {
          const data = await response.json()
          setUserDetails(data)
        } else {
          // Fallback to session data
          if (session?.user) {
            setUserDetails({
              name: session.user.name || "",
              email: session.user.email || "",
              image: session.user.image || "",
              userId: session.user.id || "",
            })
          }
        }
      } catch (error) {
        console.error("Error fetching user details:", error)
        // Fallback to session data
        if (session?.user) {
          setUserDetails({
            name: session.user.name || "",
            email: session.user.email || "",
            image: session.user.image || "",
            userId: session.user.id || "",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchUserDetails()
    }
  }, [status, session])

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const userInitials = userDetails?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  if (status === "unauthenticated") {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background md:ml-16 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background md:ml-16">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Vissza</span>
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-foreground">Profil</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 flex-shrink-0">
                <AvatarImage src={userDetails?.image || ""} alt={userDetails?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-base md:text-lg font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{userDetails?.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">{userDetails?.email}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
                  >
                    Vissza az irányítópultra
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4 md:space-y-6">
            <div className="text-xl font-semibold text-foreground mb-4">Profil Adatok</div>

            {/* Full Name */}
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <label className="text-sm font-semibold text-foreground">Teljes név</label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground font-medium">{userDetails?.name || "N/A"}</p>
                <button
                  onClick={() => copyToClipboard(userDetails?.name || "", "name")}
                  className="p-2 hover:bg-accent rounded-lg transition-colors min-h-[44px]"
                  title="Másolás"
                >
                  {copiedField === "name" ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <label className="text-sm font-semibold text-foreground">Email</label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground font-medium break-all">{userDetails?.email || "N/A"}</p>
                <button
                  onClick={() => copyToClipboard(userDetails?.email || "", "email")}
                  className="p-2 hover:bg-accent rounded-lg transition-colors min-h-[44px] flex-shrink-0"
                  title="Másolás"
                >
                  {copiedField === "email" ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* User ID */}
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <label className="text-sm font-semibold text-foreground">Felhasználó ID</label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground font-mono text-sm break-all">{userDetails?.userId || session?.user?.id || "N/A"}</p>
                <button
                  onClick={() => copyToClipboard(userDetails?.userId || session?.user?.id || "", "userId")}
                  className="p-2 hover:bg-accent rounded-lg transition-colors min-h-[44px] flex-shrink-0"
                  title="Másolás"
                >
                  {copiedField === "userId" ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Created Date */}
            <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <label className="text-sm font-semibold text-foreground">Fiókok Létrehozva</label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-foreground font-medium">{formatDate(userDetails?.createdAt)}</p>
                <button
                  onClick={() =>
                    copyToClipboard(userDetails?.createdAt || new Date().toISOString(), "createdAt")
                  }
                  className="p-2 hover:bg-accent rounded-lg transition-colors min-h-[44px]"
                  title="Másolás"
                >
                  {copiedField === "createdAt" ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 md:mt-12 flex gap-3 flex-col sm:flex-row">
            <button
              onClick={() => router.push("/subscriptions")}
              className="flex-1 px-6 py-3 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors min-h-[44px]"
            >
              Előfizetések kezelése
            </button>
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="flex-1 px-6 py-3 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors min-h-[44px]"
            >
              Beállítások
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
