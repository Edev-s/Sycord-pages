"use client"

import Link from "next/link"
import { ArrowLeft, Mail, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Vissza a főoldalra
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-foreground">Kapcsolat a fejlesztővel</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Project/Founder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">Márton David</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:admin@sycord.com" className="text-lg hover:underline text-primary">
                admin@sycord.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Freelancer contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:dmarton336@gmail.com" className="text-lg hover:underline text-primary">
                dmarton336@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact phone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href="tel:0751544882" className="text-lg hover:underline text-primary">
                0751544882
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
