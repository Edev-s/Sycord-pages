import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
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

  const userProjects = await db.collection("projects").find({ userId: session.user.id }).toArray()

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

  const newProject = {
    ...safeBody,
    webpageId,
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    userIP: userIP,
    isPremium: isPremium,
    status: "active",
    createdAt: new Date(),
  }

  try {
    const projectResult = await db.collection("projects").insertOne(newProject)
    const projectId = projectResult.insertedId.toString()

    if (body.subdomain) {
      if (typeof body.subdomain !== 'string') {
          // just ignore invalid subdomain type
      } else {
          const sanitizedSubdomain = body.subdomain
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/^-+|-+$/g, "")

          if (sanitizedSubdomain.length >= 3 && !containsCurseWords(sanitizedSubdomain)) {
            try {
              const deployment = {
                projectId: projectResult.insertedId,
                userId: session.user.id,
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

              const deploymentResult = await db.collection("deployments").insertOne(deployment)

              await db.collection("projects").updateOne(
                { _id: projectResult.insertedId },
                {
                  $set: {
                    deploymentId: deploymentResult.insertedId,
                    subdomain: sanitizedSubdomain,
                    domain: `${sanitizedSubdomain}.ltpd.xyz`,
                    deployedAt: new Date(),
                  },
                },
              )
            } catch (deploymentError: any) {
              console.error("[v0] Error creating deployment record:", deploymentError.message)
            }
          }
      }
    }

    const updatedProject = await db.collection("projects").findOne({ _id: projectResult.insertedId })
    console.log("[Project Creation] Project created successfully:", projectId)
    return NextResponse.json(updatedProject, { status: 201 })
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

  const projects = await db.collection("projects").find({ userId: session.user.id }).toArray()

  return NextResponse.json(projects)
}
