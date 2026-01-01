import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getClientIP } from "@/lib/get-client-ip"
import { containsCurseWords } from "@/lib/curse-word-filter"
import { generateWebpageId } from "@/lib/generate-webpage-id"

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

  const userProjects = await db.collection("users").findOne({ id: session.user.id })
  const existingProjects = userProjects?.user?.projects || []

  // @ts-ignore
  const isPremium = session.user.isPremium || false
  const MAX_FREE_WEBSITES = 3

  if (!isPremium && existingProjects.length >= MAX_FREE_WEBSITES) {
    return NextResponse.json(
      {
        message: `Free users can only create up to ${MAX_FREE_WEBSITES} websites. Upgrade to premium for unlimited websites.`,
      },
      { status: 403 },
    )
  }

  const userIP = getClientIP(request)
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
  let deploymentId: any = null

  const newProject = {
    ...safeBody,
    webpageId,
    userId: session.user.id,
    isPremium: isPremium,
    status: "active",
    createdAt: new Date(),
  }

  try {
    // Generate a project ID before inserting
    const projectId = new ObjectId()
    
    // Prepare deployment data if subdomain is provided
    let deploymentData = null
    let deploymentId = null
    
    if (body.subdomain) {
      if (typeof body.subdomain === 'string') {
        sanitizedSubdomain = body.subdomain
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/^-+|-+$/g, "")

        if (sanitizedSubdomain.length >= 3 && !containsCurseWords(sanitizedSubdomain)) {
          deploymentId = new ObjectId()
          deploymentData = {
            _id: deploymentId,
            projectId: projectId,
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

    // Create the complete project object
    const completeProject = {
      _id: projectId,
      ...safeBody,
      webpageId,
      userId: session.user.id,
      isPremium: isPremium,
      status: "active",
      createdAt: new Date(),
      ...(deploymentId && {
        deploymentId: deploymentId,
        subdomain: sanitizedSubdomain,
        domain: `${sanitizedSubdomain}.ltpd.xyz`,
        deployedAt: new Date(),
      }),
    }

    // Store project in users collection
    await db.collection("users").updateOne(
      { id: session.user.id },
      {
        $push: {
          "user.projects": completeProject,
          ...(deploymentData && { "user.deployments": deploymentData }),
        },
      },
      { upsert: true }
    )

    console.log("[Project Creation] Project created successfully:", projectId.toString())
    return NextResponse.json(completeProject, { status: 201 })
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

  const userData = await db.collection("users").findOne({ id: session.user.id })
  const projects = userData?.user?.projects || []

  return NextResponse.json(projects)
}
