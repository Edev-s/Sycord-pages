import { notFound } from "next/navigation"
import clientPromise from "@/lib/mongodb"
import { IdlePage } from "@/lib/idle-page"

interface PageProps {
  params: Promise<{
    subdomain: string
  }>
}

export default async function SubdomainPage({ params }: PageProps) {
  const { subdomain } = await params

  console.log("[v0] Loading subdomain:", subdomain)

  try {
    const client = await clientPromise
    const db = client.db()

    console.log("[v0] Webshop: Looking up project for subdomain:", subdomain)

    // Find user who has a project with this subdomain
    const userWithProject = await db.collection("users").findOne({
      "projects.subdomain": subdomain.toLowerCase()
    }, {
      projection: { "projects.$": 1 }
    })

    if (!userWithProject || !userWithProject.projects || userWithProject.projects.length === 0) {
      console.log("[v0] Webshop: No project found for subdomain:", subdomain)
      return notFound()
    }

    const project = userWithProject.projects[0]

    console.log("[v0] Webshop: Project found. Name:", project.businessName, "Has AI code:", !!project.aiGeneratedCode)

    const hasGeneratedSite = (project.pages && project.pages.length > 0) || project.aiGeneratedCode

    if (!hasGeneratedSite) {
      console.log("[v0] Webshop: Rendering idle page for undeployed site.")
      return <IdlePage />
    }

    console.log("[v0] Webshop: Rendering AI-generated site.")
    return (
      <div className="min-h-screen bg-background">
        <iframe
          src={`/sites/${subdomain}/content/index.html`} // Updated path to route correctly
          title="AI Generated Website"
          className="w-full min-h-screen border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
        />
      </div>
    )
  } catch (error) {
    console.error("[v0] Error loading project:", error)
    return notFound()
  }
}
