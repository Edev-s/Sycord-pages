import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

/**
 * Cloudflare API call with retry
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

  if (options.headers) Object.assign(headers, options.headers);

  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      const text = await res.text();
      lastError = text;
      console.warn(`[Cloudflare] API call failed attempt ${i + 1}: ${text}`);
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    } catch (err) {
      lastError = err;
      console.warn(`[Cloudflare] API request error attempt ${i + 1}:`, err);
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error(`Cloudflare API failed after ${retries} retries: ${lastError}`);
}

/**
 * Create Pages Project if not exists
 */
async function createPagesProject(accountId: string, projectName: string, apiToken: string) {
  console.log(`[Cloudflare] Checking if project exists: ${projectName}`);
  const res = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`,
    { method: "GET" },
    apiToken
  );

  if (res.ok) {
    console.log(`[Cloudflare] Project already exists: ${projectName}`);
    return;
  }

  console.log(`[Cloudflare] Creating new project: ${projectName}`);
  const createRes = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName, production_branch: "main" }),
    },
    apiToken
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Pages project: ${err}`);
  }

  console.log(`[Cloudflare] Project created successfully: ${projectName}`);
}

/**
 * Deploy files to Cloudflare Pages
 */
async function deployToPages(accountId: string, projectName: string, files: Record<string, string>, apiToken: string) {
  console.log(`[Cloudflare] Preparing deployment for ${Object.keys(files).length} files...`);
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

    form.append(filename, new Blob([content], { type }), filename);
  }

  // Debug log manifest
  console.log(`[Cloudflare] Deployment manifest:`, manifest);

  // Append manifest as **string**, not Blob
  form.append("manifest", JSON.stringify(manifest));

  const deployRes = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    { method: "POST", body: form },
    apiToken
  );

  if (!deployRes.ok) {
    const err = await deployRes.text();
    console.error(`[Cloudflare] Deployment failed: ${err}`);
    throw new Error(`Pages deployment failed: ${err}`);
  }

  const data = await deployRes.json();
  console.log(`[Cloudflare] Deployment successful!`, data);
  return data;
}

/**
 * Delete old worker script
 */
async function deleteWorkerScript(accountId: string, scriptName: string, apiToken: string) {
  const res = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}`,
    { method: "DELETE" },
    apiToken
  );
  if (!res.ok && res.status !== 404) {
    console.warn(`[Cloudflare] Failed to delete old worker: ${scriptName}`);
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
    if (!ObjectId.isValid(projectId)) return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();

    // Get Cloudflare credentials
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

    if (!apiToken || !accountId) return NextResponse.json({ error: "No Cloudflare credentials found." }, { status: 400 });

    // Get project from DB
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId), userId: session.user.id });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    let cfProjectName = cloudflareProjectName || project.cloudflareProjectName;
    if (!cfProjectName) {
      cfProjectName = (project.name || `project-${projectId}`)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 58);
    }

    // Collect pages
    const pages = await db.collection("pages").find({ projectId: new ObjectId(projectId) }).toArray();
    const files: Record<string, string> = {};
    let defaultContent = "";

    if (pages.length === 0) {
      // fallback index.html
      defaultContent = `<html><body><h1>${project.name || "New Site"}</h1></body></html>`;
      files["index.html"] = defaultContent;
    } else {
      let hasIndex = false;
      let indexTsPage = null;

      pages.forEach((page) => {
        let content = page.content || "";
        if (content.trim().startsWith("```")) {
          const match = content.match(/```(?:typescript|js|jsx|tsx|html|css)?\s*([\s\S]*?)```/);
          if (match) content = match[1].trim();
        }
        let filename = page.name;
        if (!filename.includes(".")) filename += ".html";
        files[filename] = content;

        if (filename === "index.html") hasIndex = true;
        else if (filename === "index.ts") indexTsPage = page;
      });

      if (!hasIndex && indexTsPage) {
        defaultContent = `<html><body><div id="root"></div><script src="/index.ts"></script></body></html>`;
        files["index.html"] = defaultContent;
      }
    }

    if (!files["404.html"] && files["index.html"]) files["404.html"] = files["index.html"];

    // Deploy
    console.log(`[Cloudflare] Creating/Updating Pages Project: ${cfProjectName}`);
    await createPagesProject(accountId, cfProjectName, apiToken);

    console.log(`[Cloudflare] Deploying ${Object.keys(files).length} files...`);
    await deployToPages(accountId, cfProjectName, files, apiToken);

    const deploymentUrl = `https://${cfProjectName}.pages.dev`;

    if (project.cloudflareDeploymentId?.startsWith("worker-")) {
      await deleteWorkerScript(accountId, cfProjectName, apiToken);
    }

    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { cloudflareProjectName: cfProjectName, cloudflareUrl: deploymentUrl, cloudflareDeployedAt: new Date(), cloudflareDeploymentId: "pages-latest" } }
    );

    console.log(`[Cloudflare] Deployment completed successfully: ${deploymentUrl}`);
    return NextResponse.json({ success: true, url: deploymentUrl, projectName: cfProjectName });
  } catch (err: any) {
    console.error("[Cloudflare] Deployment Error:", err);
    return NextResponse.json({ error: err.message || "Deployment failed" }, { status: 500 });
  }
}