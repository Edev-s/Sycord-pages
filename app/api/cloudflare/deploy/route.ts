import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { exec } from "child_process";
import path from "path";

/**
 * Helper: run shell command (promisified)
 */
function runCommand(cmd: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * POST /api/cloudflare/deploy
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, cloudflareProjectName } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Get project from DB
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Determine Cloudflare Pages project name
    const cfProjectName =
      cloudflareProjectName ||
      project.cloudflareProjectName ||
      (project.name || `project-${projectId}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 58);

    // 3. Build local temp folder for deploy (index.html + other pages)
    const pages = await db
      .collection("pages")
      .find({ projectId: new ObjectId(projectId) })
      .toArray();

    const tmpDir = path.join(process.cwd(), `tmp-deploy-${projectId}`);
    const fs = await import("fs/promises");

    // Clean/create folder
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });

    if (pages.length === 0) {
      // Fallback "Start Imagining" page
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${project.name || "New Site"}</title>
</head>
<body>
<h1>${project.name || "New Site"}</h1>
<p>This site is successfully deployed to Cloudflare Pages.</p>
</body>
</html>`;
      await fs.writeFile(path.join(tmpDir, "index.html"), html);
    } else {
      // Write all pages
      for (const page of pages) {
        let filename = page.name;
        if (!filename.includes(".")) filename = `${filename}.html`;
        const content = page.content || "";
        await fs.writeFile(path.join(tmpDir, filename), content);
      }
    }

    // 4. Deploy with Wrangler CLI
    console.log(`[Cloudflare] Deploying project: ${cfProjectName}`);
    const deployOutput = await runCommand(
      `npx wrangler pages deploy ${tmpDir} --project-name=${cfProjectName}`,
    );

    // 5. Construct URL
    const deploymentUrl = `https://${cfProjectName}.pages.dev`;

    // 6. Update DB
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          cloudflareProjectName: cfProjectName,
          cloudflareUrl: deploymentUrl,
          cloudflareDeployedAt: new Date(),
          cloudflareDeploymentId: "pages-latest",
        },
      }
    );

    console.log(`[Cloudflare] Deployment completed successfully: ${deploymentUrl}`);
    console.log(deployOutput);

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      projectName: cfProjectName,
    });

  } catch (error: any) {
    console.error("[Cloudflare] Deployment Error:", error);
    return NextResponse.json(
      { error: error.message || "Deployment failed" },
      { status: 500 }
    );
  }
}