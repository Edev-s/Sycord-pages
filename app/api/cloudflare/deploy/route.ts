import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";

/**
 * Cloudflare API Configuration
 */
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

/**
 * Helper to make Cloudflare API calls with retry logic
 */
async function cloudflareApiCall(
  url: string,
  options: RequestInit,
  apiToken: string,
  retries = 3
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401 || response.status === 403) return response;
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) return response;

      const errorText = await response.text();
      lastError = errorText;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    } catch (err) {
      lastError = err;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }

  throw new Error(`API call failed after ${retries} retries: ${lastError}`);
}

async function createPagesProject(accountId: string, projectName: string, apiToken: string) {
  const getRes = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`,
    { method: "GET" },
    apiToken
  );

  if (getRes.ok) return;

  const createRes = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
      }),
    },
    apiToken
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Pages project: ${err}`);
  }
}

async function deployToPages(
  accountId: string,
  projectName: string,
  files: Record<string, string>,
  apiToken: string
) {
  const form = new FormData();
  const manifest: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    const filename = path.startsWith("/") ? path.slice(1) : path;
    const hash = createHash("sha256").update(Buffer.from(content)).digest("hex");
    manifest[filename] = hash;

    let type = "text/plain";
    if (filename.endsWith(".html")) type = "text/html";
    else if (filename.endsWith(".js")) type = "application/javascript";
    else if (filename.endsWith(".css")) type = "text/css";
    else if (filename.endsWith(".ts")) type = "application/javascript";

    const blob = new Blob([content], { type });
    form.append(filename, blob, filename);
  }

  // Append manifest **first**
  form.append("manifest", new Blob([JSON.stringify(manifest)], { type: "application/json" }));

  const deployRes = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    { method: "POST", body: form },
    apiToken
  );

  if (!deployRes.ok) {
    const err = await deployRes.text();
    throw new Error(`Pages deployment failed: ${err}`);
  }

  return deployRes.json();
}

async function deleteWorkerScript(accountId: string, scriptName: string, apiToken: string) {
  const res = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}`,
    { method: "DELETE" },
    apiToken
  );
  if (!res.ok && res.status !== 404) {
    console.warn(`[Cloudflare] Failed to delete old worker ${scriptName}`);
  }
}

/**
 * POST /api/cloudflare/deploy
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, cloudflareProjectName } = await request.json();
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    if (!ObjectId.isValid(projectId))
      return NextResponse.json({ error: "Invalid projectId format" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    // Get credentials
    let apiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;
    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiToken || !accountId) {
      const tokenDoc = await db.collection("cloudflare_tokens").findOne({
        projectId: new ObjectId(projectId),
        userId: session.user.email,
      });
      if (tokenDoc) {
        apiToken = tokenDoc.apiToken;
        accountId = tokenDoc.accountId;
      }
    }

    if (!apiToken || !accountId)
      return NextResponse.json(
        { error: "No Cloudflare credentials found. Please configure env vars or authenticate." },
        { status: 400 }
      );

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.id,
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    let cfProjectName = cloudflareProjectName || project.cloudflareProjectName;
    if (!cfProjectName) {
      const baseName = project.name || project.businessName || `project-${projectId}`;
      cfProjectName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 58);
    }

    const pages = await db.collection("pages").find({ projectId: new ObjectId(projectId) }).toArray();
    const files: Record<string, string> = {};
    let defaultContent = "";

    if (pages.length === 0) {
      defaultContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${
        project.name || "New Site"
      }</title></head><body><h1>${project.name || "New Site"}</h1></body></html>`;
      files["index.html"] = defaultContent;
    } else {
      let hasIndexHtml = false;
      let indexTsPage = null;

      pages.forEach((page) => {
        let content = page.content || "";
        if (content.trim().startsWith("```")) {
          const match = content.match(/```(?:typescript|js|jsx|tsx|html|css)?\s*([\s\S]*?)```/);
          if (match) content = match[1].trim();
        }

        let filename = page.name;
        if (!filename.includes(".")) filename = `${filename}.html`;

        files[filename] = content;
        if (page.name === "index" || page.name === "index.html") hasIndexHtml = true;
        else if (page.name === "index.ts") indexTsPage = page;
      });

      if (!hasIndexHtml && indexTsPage) {
        defaultContent = `<html><head><title>${project.name || "App"}</title></head><body><div id="root"></div><script type="module" src="/index.ts"></script></body></html>`;
        files["index.html"] = defaultContent;
      } else if (!files["index.html"] && defaultContent) {
        files["index.html"] = defaultContent;
      }
    }

    if (files["index.html"] && !files["404.html"]) files["404.html"] = files["index.html"];

    console.log(`[Cloudflare] Creating/Updating Pages Project: ${cfProjectName}`);
    await createPagesProject(accountId, cfProjectName, apiToken);

    console.log(`[Cloudflare] Deploying ${Object.keys(files).length} files...`);
    await deployToPages(accountId, cfProjectName, files, apiToken);

    const deploymentUrl = `https://${cfProjectName}.pages.dev`;
    console.log(`[Cloudflare] Success! Pages URL: ${deploymentUrl}`);

    if (project.cloudflareDeploymentId?.startsWith("worker-")) {
      console.log(`[Cloudflare] Deleting old worker script: ${cfProjectName}`);
      await deleteWorkerScript(accountId, cfProjectName, apiToken);
    }

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

    return NextResponse.json({ success: true, url: deploymentUrl, projectName: cfProjectName });
  } catch (error: any) {
    console.error("[Cloudflare] Deployment Error:", error);
    return NextResponse.json({ error: error.message || "Deployment failed" }, { status: 500 });
  }
}