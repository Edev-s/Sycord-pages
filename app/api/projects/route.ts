import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { getClientIP } from "@/lib/get-client-ip"
import { containsCurseWords } from "@/lib/curse-word-filter"
import { generateWebpageId } from "@/lib/generate-webpage-id"
import { ObjectId } from "mongodb"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()

  console.log("==========================================");
  console.log(`[Project Creation] Start for User: ${session.user.email}`);

  let body;
  try {
      body = await request.json();
  } catch (e) {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // Validate businessName
  if (!body.businessName || typeof body.businessName !== 'string' || body.businessName.trim().length === 0) {
      return NextResponse.json({ message: "Business name is required" }, { status: 400 });
  }
  if (body.businessName.length > 100) {
      return NextResponse.json({ message: "Business name is too long (max 100 chars)" }, { status: 400 });
  }

  // Validate description if present
  if (body.businessDescription && (typeof body.businessDescription !== 'string' || body.businessDescription.length > 1000)) {
       return NextResponse.json({ message: "Business description is invalid or too long" }, { status: 400 });
  }

  // Fetch user doc to check limits and existing projects
  const userDoc = await db.collection("users").findOne({ id: session.user.id })
  const userProjects = userDoc?.projects || []

  // @ts-ignore
  const isPremium = session.user.isPremium || false
  const MAX_FREE_WEBSITES = 3

  if (!isPremium && userProjects.length >= MAX_FREE_WEBSITES) {
    return NextResponse.json(
      {
        message: `Free users can only create up to ${MAX_FREE_WEBSITES} websites. Upgrade to premium for unlimited websites.`,
      },
      { status: 403 },
    )
  }

  const webpageId = generateWebpageId()

  // sanitize body fields to prevent injection of unexpected fields
  const safeBody = {
      businessName: body.businessName.trim(),
      businessDescription: (body.businessDescription || "").trim(),
      subdomain: body.subdomain,
      style: body.style,
      // explicitly exclude fields that shouldn't be user-settable if any
  };

  let sanitizedSubdomain: string | null = null
  let deploymentData: any = null

  if (body.subdomain) {
    if (typeof body.subdomain !== 'string') {
        // just ignore invalid subdomain type
    } else {
        sanitizedSubdomain = body.subdomain
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/^-+|-+$/g, "")

        if (sanitizedSubdomain.length >= 3 && !containsCurseWords(sanitizedSubdomain)) {
            deploymentData = {
              subdomain: sanitizedSubdomain,
              domain: `${sanitizedSubdomain}.ltpd.xyz`,
              status: "active",
              createdAt: new Date(),
              updatedAt: new Date(),
              deploymentData: {
                businessName: safeBody.businessName,
                businessDescription: safeBody.businessDescription,
              },
            }
        }
    }
  }

  const projectId = new ObjectId()

  const newProject = {
    _id: projectId,
    ...safeBody,
    subdomain: sanitizedSubdomain, // Ensure subdomain is updated with sanitized version
    webpageId,
    userId: session.user.id, // Keep userId for reference, though embedded
    isPremium: isPremium,
    status: "active",
    createdAt: new Date(),
    pages: [], // Initialize empty pages array
    deployment: deploymentData, // Embed deployment info
    // Legacy fields for compatibility if needed, but we try to move away
    deploymentId: deploymentData ? new ObjectId() : null,
  }

  try {
    await db.collection("users").updateOne(
      { id: session.user.id },
      {
        $push: {
          projects: newProject
        } as any // TypeScript might complain about pushing to 'projects' if schema not defined
      }
    )

    console.log("[Project Creation] Project created successfully embedded in user:", projectId.toString())

    // Return the new project. We cast _id to string for JSON serialization compatibility if needed,
    // but Next.js usually handles ObjectId in JSON response or we should stringify it.
    // However, existing frontend likely expects _id to be present.
    return NextResponse.json(newProject, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating project:", error)
    return NextResponse.json(
      {
        message: "Failed to create project",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()

  try {
    const userDoc = await db.collection("users").findOne({ id: session.user.id })
    const projects = userDoc?.projects || []

    return NextResponse.json(projects)
  } catch (error: any) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 })
  }
}
